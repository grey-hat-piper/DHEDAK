from django.test import TestCase
from rest_framework.test import APIClient


class HealthTests(TestCase):
    def test_health_is_public_and_reports_database(self):
        res = APIClient().get("/api/v1/health/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"status": "ok", "database": True})

    def test_unlisted_endpoints_require_auth_by_default(self):
        from rest_framework.permissions import IsAuthenticated
        from django.conf import settings

        self.assertEqual(
            settings.REST_FRAMEWORK["DEFAULT_PERMISSION_CLASSES"],
            ["rest_framework.permissions.IsAuthenticated"],
        )
        self.assertIs(IsAuthenticated.__name__, "IsAuthenticated")
