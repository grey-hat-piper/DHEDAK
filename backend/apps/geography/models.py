from django.db import models


class Country(models.Model):
    """Countries are data, not code: enabling a country is an admin action (is_active)."""

    code = models.CharField(max_length=2, unique=True)  # ISO 3166-1 alpha-2
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class AdministrativeRegion(models.Model):
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name="regions")
    name = models.CharField(max_length=120)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["country", "name"], name="unique_region_per_country")]

    def __str__(self):
        return f"{self.name}, {self.country.code}"


class District(models.Model):
    region = models.ForeignKey(AdministrativeRegion, on_delete=models.CASCADE, related_name="districts")
    name = models.CharField(max_length=120)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["region", "name"], name="unique_district_per_region")]

    def __str__(self):
        return self.name
