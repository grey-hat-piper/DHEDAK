import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("geography", "0002_seed_countries_and_rls"),
        ("organisations", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="FacilityService",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("slug", models.SlugField(unique=True)),
                ("name", models.CharField(max_length=100)),
                ("is_sensitive", models.BooleanField(default=False)),
            ],
        ),
        migrations.CreateModel(
            name="Facility",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=200)),
                ("facility_type", models.CharField(choices=[("hospital", "Hospital"), ("clinic", "Clinic"), ("pharmacy", "Pharmacy"), ("laboratory", "Laboratory"), ("primary_healthcare", "Primary healthcare facility")], max_length=30)),
                ("address", models.TextField(blank=True)),
                ("latitude", models.FloatField(validators=[django.core.validators.MinValueValidator(-90), django.core.validators.MaxValueValidator(90)])),
                ("longitude", models.FloatField(validators=[django.core.validators.MinValueValidator(-180), django.core.validators.MaxValueValidator(180)])),
                ("phone", models.CharField(blank=True, max_length=40)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("website", models.URLField(blank=True)),
                ("operating_hours", models.CharField(blank=True, max_length=300)),
                ("status", models.CharField(choices=[("draft", "Draft"), ("submitted", "Submitted"), ("under_review", "Under review"), ("approved", "Approved"), ("rejected", "Rejected"), ("requires_update", "Requires update")], default="draft", max_length=20)),
                ("data_source", models.CharField(blank=True, max_length=200)),
                ("last_verified", models.DateField(blank=True, null=True)),
                ("sensitive_cleared", models.BooleanField(default=False)),
                ("is_demo", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("country", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="facilities", to="geography.country")),
                ("district", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="facilities", to="geography.district")),
                ("owner_organisation", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="facilities", to="organisations.organisation")),
                ("region", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="facilities", to="geography.administrativeregion")),
                ("services", models.ManyToManyField(blank=True, related_name="facilities", to="facilities.facilityservice")),
                ("submitted_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
                ("verified_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddIndex(model_name="facility", index=models.Index(fields=["status", "country"], name="fac_status_country_idx")),
        migrations.AddIndex(model_name="facility", index=models.Index(fields=["latitude", "longitude"], name="fac_lat_lng_idx")),
    ]
