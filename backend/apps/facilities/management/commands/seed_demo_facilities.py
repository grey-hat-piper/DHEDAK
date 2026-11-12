import random

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.facilities.models import Facility, FacilityService, FacilityStatus, FacilityType
from apps.geography.models import AdministrativeRegion, Country

# (country, region, centre lat, centre lng). Region names are real top-level units; the FACILITIES are not.
HUBS = [
    ("GH", "Greater Accra", 5.6037, -0.1870), ("GH", "Ashanti", 6.6885, -1.6244), ("GH", "Northern", 9.4034, -0.8424),
    ("CM", "Centre", 3.8480, 11.5021), ("CM", "Littoral", 4.0511, 9.7679), ("CM", "Adamawa", 7.3277, 13.5847),
    ("UG", "Central", 0.3476, 32.5825), ("UG", "Western", -0.6072, 30.6545), ("UG", "Northern", 2.7747, 32.2990),
]


class Command(BaseCommand):
    help = "Create CLEARLY LABELLED fake facilities for local development. Refuses to run unless ALLOW_DEMO_DATA is on."

    def add_arguments(self, parser):
        parser.add_argument("--per-hub", type=int, default=14)

    def handle(self, *args, per_hub, **options):
        if not settings.ALLOW_DEMO_DATA:
            raise CommandError("ALLOW_DEMO_DATA is off. Demo data must never be created in production.")
        rnd = random.Random(2026)
        types = list(FacilityType.values)
        services = list(FacilityService.objects.filter(is_sensitive=False))
        created = 0
        for code, region_name, lat, lng in HUBS:
            country = Country.objects.get(code=code)
            region, _ = AdministrativeRegion.objects.get_or_create(country=country, name=region_name)
            for i in range(per_hub):
                kind = rnd.choice(types)
                f, new = Facility.objects.get_or_create(
                    name=f"DEMO {kind.replace('_', ' ').title()} {region_name[:3].upper()}-{i + 1:02d} (not a real facility)",
                    country=country,
                    defaults=dict(
                        facility_type=kind, region=region, latitude=lat + rnd.uniform(-0.12, 0.12), longitude=lng + rnd.uniform(-0.12, 0.12),
                        address="Demo address. Not a real location.", status=FacilityStatus.APPROVED,
                        data_source="DEMO DATA. Not real.", is_demo=True,
                    ),
                )
                if new:
                    f.services.set(rnd.sample(services, rnd.randint(0, 2)))
                    created += 1
        self.stdout.write(self.style.SUCCESS(f"Created {created} demo facilities (existing ones left untouched)."))
