from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Membership, Organisation, Role

User = get_user_model()
PW = "a-Strong-passphrase-42"


def make_user(email, account_type="ngo"):
    return User.objects.create_user(email, PW, full_name=email, account_type=account_type)


def client_for(user):
    c = APIClient()
    c.force_authenticate(user)
    return c


class OrganisationIsolationTests(TestCase):
    def setUp(self):
        self.alice, self.bob = make_user("alice@x.org"), make_user("bob@x.org")
        self.a, self.b = client_for(self.alice), client_for(self.bob)
        self.org_a = self.a.post("/api/v1/organisations/", {"name": "Org A", "org_type": "ngo", "country_code": "gh"}, format="json").json()
        self.org_b = self.b.post("/api/v1/organisations/", {"name": "Org B", "org_type": "facility", "country_code": "ug"}, format="json").json()

    def test_creator_becomes_admin_and_lists_only_own_orgs(self):
        self.assertEqual(self.org_a["my_role"], Role.ADMIN)
        self.assertEqual([o["name"] for o in self.a.get("/api/v1/organisations/").json()["results"]], ["Org A"])

    def test_non_member_gets_404_on_detail_members_and_update(self):
        oid = self.org_a["id"]
        self.assertEqual(self.b.get(f"/api/v1/organisations/{oid}/").status_code, 404)
        self.assertEqual(self.b.get(f"/api/v1/organisations/{oid}/members/").status_code, 404)
        self.assertEqual(self.b.patch(f"/api/v1/organisations/{oid}/", {"name": "Hacked"}, format="json").status_code, 404)
        self.assertEqual(Organisation.objects.get(pk=oid).name, "Org A")

    def test_unauthenticated_is_denied(self):
        self.assertIn(APIClient().get("/api/v1/organisations/").status_code, (401, 403))

    def test_individual_cannot_create_organisation(self):
        ind = client_for(make_user("ind@x.org", "individual"))
        res = ind.post("/api/v1/organisations/", {"name": "N", "org_type": "ngo", "country_code": "GH"}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_non_admin_member_cannot_manage_members_or_edit_org(self):
        oid = self.org_a["id"]
        carol = make_user("carol@x.org")
        Membership.objects.create(user=carol, organisation_id=oid, role=Role.DATA_MANAGER)
        c = client_for(carol)
        self.assertEqual(c.get(f"/api/v1/organisations/{oid}/").status_code, 200)
        self.assertEqual(c.get(f"/api/v1/organisations/{oid}/members/").status_code, 403)
        self.assertEqual(c.post(f"/api/v1/organisations/{oid}/members/", {"email": "bob@x.org"}, format="json").status_code, 403)
        self.assertEqual(c.patch(f"/api/v1/organisations/{oid}/", {"name": "X"}, format="json").status_code, 403)

    def test_admin_adds_changes_and_removes_member_but_not_last_admin(self):
        oid = self.org_a["id"]
        res = self.a.post(f"/api/v1/organisations/{oid}/members/", {"email": "BOB@x.org", "role": "reviewer"}, format="json")
        self.assertEqual(res.status_code, 201)
        mid = res.json()["id"]
        self.assertEqual(self.a.patch(f"/api/v1/organisations/{oid}/members/{mid}/", {"role": "member"}, format="json").status_code, 200)
        self.assertEqual(self.a.delete(f"/api/v1/organisations/{oid}/members/{mid}/").status_code, 204)
        own = Membership.objects.get(user=self.alice, organisation_id=oid)
        self.assertEqual(self.a.delete(f"/api/v1/organisations/{oid}/members/{own.id}/").status_code, 400)
        self.assertEqual(self.a.patch(f"/api/v1/organisations/{oid}/members/{own.id}/", {"role": "member"}, format="json").status_code, 400)

    def test_cannot_touch_member_of_another_org_via_own_org_url(self):
        other_member = Membership.objects.get(user=self.bob, organisation_id=self.org_b["id"])
        res = self.a.delete(f"/api/v1/organisations/{self.org_a['id']}/members/{other_member.id}/")
        self.assertEqual(res.status_code, 404)
        self.assertTrue(Membership.objects.filter(pk=other_member.pk).exists())
