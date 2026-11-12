from django.db import migrations

from apps.core.db import enable_rls

# Initial supported countries (PRD 2.2). Regions and districts are NOT seeded here: they must be
# imported from an authoritative boundary dataset, not typed in.
COUNTRIES = [("GH", "Ghana"), ("CM", "Cameroon"), ("UG", "Uganda")]


def seed(apps, schema_editor):
    Country = apps.get_model("geography", "Country")
    for code, name in COUNTRIES:
        Country.objects.update_or_create(code=code, defaults={"name": name, "is_active": True})


class Migration(migrations.Migration):
    dependencies = [("geography", "0001_initial")]

    operations = [
        migrations.RunPython(seed, migrations.RunPython.noop),
        enable_rls("geography_country", "geography_administrativeregion", "geography_district"),
    ]
