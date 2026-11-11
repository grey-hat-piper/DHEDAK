from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.accounts.models import AccountType

from .models import Membership, Organisation, Role

User = get_user_model()
ORG_TYPES = [c for c in AccountType.choices if c[0] not in (AccountType.INDIVIDUAL, AccountType.INTERNAL)]


class OrganisationSerializer(serializers.ModelSerializer):
    org_type = serializers.ChoiceField(choices=ORG_TYPES)
    my_role = serializers.SerializerMethodField()

    class Meta:
        model = Organisation
        fields = ["id", "name", "org_type", "country_code", "created_at", "my_role"]
        read_only_fields = ["id", "created_at", "my_role"]

    def get_my_role(self, obj):
        return Membership.objects.filter(organisation=obj, user=self.context["request"].user).values_list("role", flat=True).first()

    def validate_country_code(self, value):
        value = value.upper()
        if value not in settings.SUPPORTED_COUNTRIES:
            raise serializers.ValidationError("Country is not currently supported.")
        return value


class MembershipSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    full_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = Membership
        fields = ["id", "email", "full_name", "role"]
        read_only_fields = ["id", "email", "full_name"]


class AddMemberSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=Role.choices, default=Role.MEMBER)
