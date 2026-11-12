import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Country",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=2, unique=True)),
                ("name", models.CharField(max_length=100)),
                ("is_active", models.BooleanField(default=False)),
            ],
        ),
        migrations.CreateModel(
            name="AdministrativeRegion",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                ("country", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="regions", to="geography.country")),
            ],
        ),
        migrations.CreateModel(
            name="District",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                ("region", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="districts", to="geography.administrativeregion")),
            ],
        ),
        migrations.AddConstraint(
            model_name="administrativeregion",
            constraint=models.UniqueConstraint(fields=("country", "name"), name="unique_region_per_country"),
        ),
        migrations.AddConstraint(
            model_name="district",
            constraint=models.UniqueConstraint(fields=("region", "name"), name="unique_district_per_region"),
        ),
    ]
