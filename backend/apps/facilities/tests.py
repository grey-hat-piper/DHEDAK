from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from apps.geography.models import AdministrativeRegion, Country, District

from .models import Facility, FacilityService, FacilityStatus

User = get_user_model()
API = "/api/v1/facilities/"
INTERNAL_FIELDS = {"status", "submitted_by", "verified_by", "owner_organisation", "sensitive_cleared", "is_demo", "created_at", "updated_at"}


def make_facility(name="Clinic A", **kw):
    defaults = dict(
        facility_type="clinic", country=Country.objects.get(code="GH"), latitude=5.6, longitude=-0.2,
        status=FacilityStatus.APPROVED, data_source="Test source",
    )
    defaults.update(kw)
    services = defaults.pop("services", [])
    f = Facility.objects.create(name=name, **defaults)
    f.services.set(services)
    return f


class PublicVisibilityTests(TestCase):
    def setUp(self):
        cache.clear()  # throttle counters live in the cache
        self.api = APIClient()

    def test_only_approved_facilities_are_public(self):
        make_facility("Approved")
        for i, status in enumerate(s for s in FacilityStatus.values if s != "approved"):
            make_facility(f"Hidden {status}", status=status)
        names = [f["name"] for f in self.api.get(API).json()["results"]]
        self.assertEqual(names, ["Approved"])

    def test_non_public_detail_is_404(self):
        draft = make_facility("Draft", status=FacilityStatus.DRAFT)
        self.assertEqual(self.api.get(f"{API}{draft.id}/").status_code, 404)

    @override_settings(ALLOW_DEMO_DATA=False)
    def test_demo_data_hidden_when_not_allowed(self):
        make_facility("Real")
        make_facility("Fake", is_demo=True)
        self.assertEqual([f["name"] for f in self.api.get(API).json()["results"]], ["Real"])

    @override_settings(ALLOW_DEMO_DATA=True)
    def test_demo_data_visible_when_allowed(self):
        make_facility("Fake", is_demo=True)
        self.assertEqual(self.api.get(API).json()["count"], 1)

    def test_sensitive_service_facility_hidden_until_cleared(self):
        sensitive = FacilityService.objects.get(slug="survivor-support")
        f = make_facility("Support service", services=[sensitive])
        self.assertEqual(self.api.get(API).json()["count"], 0)
        self.assertEqual(self.api.get(f"{API}{f.id}/").status_code, 404)
        self.assertEqual(self.api.get(API + "geojson/").json()["features"], [])
        f.sensitive_cleared = True
        f.save()
        self.assertEqual(self.api.get(API).json()["count"], 1)

    def test_internal_fields_never_exposed(self):
        make_facility("A")
        item = self.api.get(API).json()["results"][0]
        self.assertFalse(INTERNAL_FIELDS & set(item))
        detail = self.api.get(f"{API}{Facility.objects.get().id}/").json()
        self.assertFalse(INTERNAL_FIELDS & set(detail))

    def test_public_endpoints_need_no_login(self):
        for path in (API, API + "geojson/", API + "meta/", "/api/v1/geography/countries/"):
            self.assertEqual(self.api.get(path).status_code, 200, path)

    def test_write_methods_not_allowed(self):
        self.assertEqual(self.api.post(API, {"name": "x"}, format="json").status_code, 405)


class FilterTests(TestCase):
    def setUp(self):
        cache.clear()  # throttle counters live in the cache
        self.api = APIClient()
        gh, ug = Country.objects.get(code="GH"), Country.objects.get(code="UG")
        self.region = AdministrativeRegion.objects.create(country=gh, name="Greater Accra")
        self.district = District.objects.create(region=self.region, name="Ablekuma")
        diabetes = FacilityService.objects.get(slug="diabetes-screening-care")
        make_facility("Korle Test Hospital", facility_type="hospital", region=self.region, district=self.district, services=[diabetes])
        make_facility("Pharmacy One", facility_type="pharmacy", region=self.region, latitude=5.7, longitude=-0.1)
        make_facility("Kampala Lab", facility_type="laboratory", country=ug, latitude=0.35, longitude=32.58)

    def names(self, query):
        res = self.api.get(f"{API}?{query}")
        self.assertEqual(res.status_code, 200, res.content)
        return sorted(f["name"] for f in res.json()["results"])

    def test_country_type_region_district_service(self):
        self.assertEqual(self.names("country=ug"), ["Kampala Lab"])
        self.assertEqual(self.names("type=hospital,pharmacy"), ["Korle Test Hospital", "Pharmacy One"])
        self.assertEqual(self.names(f"region={self.region.id}"), ["Korle Test Hospital", "Pharmacy One"])
        self.assertEqual(self.names(f"district={self.district.id}"), ["Korle Test Hospital"])
        self.assertEqual(self.names("service=diabetes-screening-care"), ["Korle Test Hospital"])

    def test_search_matches_name_district_and_service(self):
        self.assertEqual(self.names("q=pharmacy"), ["Pharmacy One"])
        self.assertEqual(self.names("q=ablekuma"), ["Korle Test Hospital"])
        self.assertEqual(self.names("q=diabetes"), ["Korle Test Hospital"])

    def test_bbox(self):
        self.assertEqual(self.names("bbox=-1,5,0,6"), ["Korle Test Hospital", "Pharmacy One"])
        self.assertEqual(self.names("bbox=32,0,33,1"), ["Kampala Lab"])

    def test_invalid_input_is_a_400_not_ignored(self):
        for bad in ("type=spaceship", "region=abc", "bbox=1,2,3", "bbox=10,0,5,1", "bbox=0,0,500,1"):
            self.assertEqual(self.api.get(f"{API}?{bad}").status_code, 400, bad)

    def test_multiple_service_matches_do_not_duplicate_rows(self):
        f = Facility.objects.get(name="Korle Test Hospital")
        f.services.add(FacilityService.objects.get(slug="womens-health"))
        self.assertEqual(self.names("service=diabetes-screening-care,womens-health"), ["Korle Test Hospital"])


class GeoJSONAndMetaTests(TestCase):
    def setUp(self):
        cache.clear()  # throttle counters live in the cache
        self.api = APIClient()

    def test_geojson_shape_uses_lng_lat_order(self):
        make_facility("Pin", latitude=5.6, longitude=-0.2)
        data = self.api.get(API + "geojson/").json()
        self.assertEqual(data["type"], "FeatureCollection")
        self.assertFalse(data["truncated"])
        feature = data["features"][0]
        self.assertEqual(feature["geometry"], {"type": "Point", "coordinates": [-0.2, 5.6]})
        self.assertEqual(set(feature["properties"]), {"id", "name", "facility_type", "services"})

    def test_meta_hides_sensitive_service_unless_in_public_use(self):
        slugs = lambda: {s["slug"] for s in self.api.get(API + "meta/").json()["services"]}
        self.assertNotIn("survivor-support", slugs())
        make_facility("Cleared", services=[FacilityService.objects.get(slug="survivor-support")], sensitive_cleared=True)
        self.assertIn("survivor-support", slugs())

    def test_meta_lists_active_countries(self):
        codes = {c["code"] for c in self.api.get(API + "meta/").json()["countries"]}
        self.assertEqual(codes, {"GH", "CM", "UG"})


class ModelValidationTests(TestCase):
    def test_coordinates_validated(self):
        from django.core.exceptions import ValidationError

        f = Facility(name="Bad", facility_type="clinic", country=Country.objects.get(code="GH"), latitude=91, longitude=-181)
        with self.assertRaises(ValidationError) as ctx:
            f.full_clean()
        self.assertIn("latitude", ctx.exception.message_dict)
        self.assertIn("longitude", ctx.exception.message_dict)

    def test_region_must_belong_to_country(self):
        from django.core.exceptions import ValidationError

        region = AdministrativeRegion.objects.create(country=Country.objects.get(code="UG"), name="Central")
        f = Facility(name="Mismatch", facility_type="clinic", country=Country.objects.get(code="GH"), region=region, latitude=1, longitude=1)
        with self.assertRaises(ValidationError):
            f.full_clean()


class GeographyApiTests(TestCase):
    def setUp(self):
        cache.clear()

    def test_regions_and_districts(self):
        gh = Country.objects.get(code="GH")
        region = AdministrativeRegion.objects.create(country=gh, name="Ashanti")
        District.objects.create(region=region, name="Kumasi Metro")
        api = APIClient()
        self.assertEqual(api.get("/api/v1/geography/regions/?country=gh").json(), [{"id": region.id, "name": "Ashanti"}])
        self.assertEqual(len(api.get(f"/api/v1/geography/districts/?region={region.id}").json()), 1)
        self.assertEqual(api.get("/api/v1/geography/regions/").status_code, 400)
        self.assertEqual(api.get("/api/v1/geography/districts/?region=x").status_code, 400)
