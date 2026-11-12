from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class FacilityType(models.TextChoices):
    HOSPITAL = "hospital", "Hospital"
    CLINIC = "clinic", "Clinic"
    PHARMACY = "pharmacy", "Pharmacy"
    LABORATORY = "laboratory", "Laboratory"
    PRIMARY_HEALTHCARE = "primary_healthcare", "Primary healthcare facility"


class FacilityStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    SUBMITTED = "submitted", "Submitted"
    UNDER_REVIEW = "under_review", "Under review"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"
    REQUIRES_UPDATE = "requires_update", "Requires update"


class FacilityService(models.Model):
    """A service a facility offers (e.g. diabetes screening). Sensitive services need a safety review."""

    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=100)
    is_sensitive = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class FacilityQuerySet(models.QuerySet):
    def public(self):
        """The ONLY queryset public endpoints may use.

        - approved records only; drafts, submissions and rejected records are never public
        - demo records only when ALLOW_DEMO_DATA is on (development/preview)
        - facilities offering a sensitive service stay hidden until a reviewer clears them
        """
        qs = self.filter(status=FacilityStatus.APPROVED)
        if not settings.ALLOW_DEMO_DATA:
            qs = qs.filter(is_demo=False)
        uncleared = self.model.objects.filter(sensitive_cleared=False, services__is_sensitive=True).values("pk")
        return qs.exclude(pk__in=uncleared)


class Facility(models.Model):
    name = models.CharField(max_length=200)
    facility_type = models.CharField(max_length=30, choices=FacilityType.choices)
    country = models.ForeignKey("geography.Country", on_delete=models.PROTECT, related_name="facilities")
    region = models.ForeignKey("geography.AdministrativeRegion", null=True, blank=True, on_delete=models.SET_NULL, related_name="facilities")
    district = models.ForeignKey("geography.District", null=True, blank=True, on_delete=models.SET_NULL, related_name="facilities")
    address = models.TextField(blank=True)
    # Plain validated numbers are the source of truth. The PostGIS `location` geography column is
    # generated from them by the database (see migration 0002), so the two can never disagree.
    latitude = models.FloatField(validators=[MinValueValidator(-90), MaxValueValidator(90)])
    longitude = models.FloatField(validators=[MinValueValidator(-180), MaxValueValidator(180)])
    phone = models.CharField(max_length=40, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    operating_hours = models.CharField(max_length=300, blank=True)
    services = models.ManyToManyField(FacilityService, blank=True, related_name="facilities")

    status = models.CharField(max_length=20, choices=FacilityStatus.choices, default=FacilityStatus.DRAFT)
    data_source = models.CharField(max_length=200, blank=True)
    last_verified = models.DateField(null=True, blank=True)
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    submitted_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    owner_organisation = models.ForeignKey("organisations.Organisation", null=True, blank=True, on_delete=models.SET_NULL, related_name="facilities")
    sensitive_cleared = models.BooleanField(default=False)  # a reviewer has confirmed public display is safe
    is_demo = models.BooleanField(default=False)  # development sample data; never shown in production
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = FacilityQuerySet.as_manager()

    class Meta:
        indexes = [
            models.Index(fields=["status", "country"], name="fac_status_country_idx"),
            models.Index(fields=["latitude", "longitude"], name="fac_lat_lng_idx"),
        ]

    def clean(self):
        if self.region_id and self.region.country_id != self.country_id:
            raise ValidationError({"region": "Region does not belong to the selected country."})
        if self.district_id and self.district.region_id != self.region_id:
            raise ValidationError({"district": "District does not belong to the selected region."})

    def __str__(self):
        return self.name
