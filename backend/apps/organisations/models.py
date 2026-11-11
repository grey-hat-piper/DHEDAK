from django.conf import settings
from django.db import models


class Role(models.TextChoices):
    ADMIN = "org_admin", "Organisation administrator"
    DATA_MANAGER = "data_manager", "Data manager"
    PROGRAMME_MANAGER = "programme_manager", "Programme manager"
    REVIEWER = "reviewer", "Reviewer"
    MEMBER = "member", "Member"


class Organisation(models.Model):
    name = models.CharField(max_length=200)
    org_type = models.CharField(max_length=20)  # an accounts.AccountType value, validated in the serializer
    country_code = models.CharField(max_length=2)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Membership(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="memberships")
    organisation = models.ForeignKey(Organisation, on_delete=models.CASCADE, related_name="memberships")
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "organisation"], name="unique_user_org")]
