from django.db import migrations

from apps.core.db import enable_rls

# Non-sensitive and sensitive service catalogue (reference data, not facility data).
SERVICES = [
    ("diabetes-screening-care", "Diabetes screening and care", False),
    ("womens-health", "Women's health", False),
    ("maternal-reproductive-health", "Maternal and reproductive health", False),
    ("survivor-support", "Verified survivor-support service", True),
]


def seed_services(apps, schema_editor):
    FacilityService = apps.get_model("facilities", "FacilityService")
    for slug, name, sensitive in SERVICES:
        FacilityService.objects.update_or_create(slug=slug, defaults={"name": name, "is_sensitive": sensitive})


def add_location(apps, schema_editor):
    """PostGIS only. `location` is generated from latitude/longitude, so it cannot drift from them,
    and Django (which never writes it) needs no GDAL/GeoDjango. Use it in raw SQL for ST_DWithin etc."""
    if schema_editor.connection.vendor != "postgresql":
        return
    schema_editor.execute(
        "ALTER TABLE facilities_facility ADD COLUMN location geography(Point, 4326) GENERATED ALWAYS AS "
        "(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED"
    )
    schema_editor.execute("CREATE INDEX facilities_facility_location_gix ON facilities_facility USING GIST (location)")


def drop_location(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    schema_editor.execute("DROP INDEX IF EXISTS facilities_facility_location_gix")
    schema_editor.execute("ALTER TABLE facilities_facility DROP COLUMN IF EXISTS location")


class Migration(migrations.Migration):
    dependencies = [("facilities", "0001_initial")]

    operations = [
        migrations.RunPython(seed_services, migrations.RunPython.noop),
        migrations.RunPython(add_location, drop_location),
        enable_rls("facilities_facility", "facilities_facilityservice", "facilities_facility_services"),
    ]
