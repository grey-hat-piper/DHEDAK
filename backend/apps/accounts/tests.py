from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

User = get_user_model()
PW = "a-Strong-passphrase-42"
REG = {
    "email": "Amina@Example.org", "password": PW, "full_name": "Amina K",
    "country_code": "gh", "account_type": "ngo", "primary_reason": "Programme tracking",
}


class AuthTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def test_register_logs_in_and_normalises_email_and_country(self):
        res = self.client.post("/api/v1/auth/register/", REG, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()["email"], "amina@example.org")
        self.assertEqual(res.json()["country_code"], "GH")
        self.assertNotIn("password", res.json())
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 200)

    def test_internal_account_type_cannot_self_register(self):
        res = self.client.post("/api/v1/auth/register/", {**REG, "account_type": "internal"}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertFalse(User.objects.exists())

    def test_unsupported_country_weak_password_and_duplicate_rejected(self):
        self.assertEqual(self.client.post("/api/v1/auth/register/", {**REG, "country_code": "ZZ"}, format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/v1/auth/register/", {**REG, "password": "short"}, format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/v1/auth/register/", REG, format="json").status_code, 201)
        self.assertEqual(APIClient().post("/api/v1/auth/register/", {**REG, "email": "AMINA@example.org"}, format="json").status_code, 400)

    def test_login_logout_flow_and_generic_error(self):
        User.objects.create_user("a@example.org", PW, full_name="A")
        bad = self.client.post("/api/v1/auth/login/", {"email": "a@example.org", "password": "wrong"}, format="json")
        unknown = self.client.post("/api/v1/auth/login/", {"email": "none@example.org", "password": "wrong"}, format="json")
        self.assertEqual(bad.status_code, 400)
        self.assertEqual(bad.json(), unknown.json())
        self.assertEqual(self.client.post("/api/v1/auth/login/", {"email": "A@example.org", "password": PW}, format="json").status_code, 200)
        self.assertEqual(self.client.post("/api/v1/auth/logout/").status_code, 204)
        self.assertEqual(self.client.get("/api/v1/auth/me/").status_code, 403)

    def test_me_requires_authentication(self):
        self.assertIn(self.client.get("/api/v1/auth/me/").status_code, (401, 403))

    def test_login_enforces_csrf(self):
        User.objects.create_user("a@example.org", PW, full_name="A")
        strict = APIClient(enforce_csrf_checks=True)
        res = strict.post("/api/v1/auth/login/", {"email": "a@example.org", "password": PW}, format="json")
        self.assertEqual(res.status_code, 403)
        token = strict.get("/api/v1/auth/csrf/").cookies["csrftoken"].value
        res = strict.post("/api/v1/auth/login/", {"email": "a@example.org", "password": PW}, format="json", HTTP_X_CSRFTOKEN=token)
        self.assertEqual(res.status_code, 200)
