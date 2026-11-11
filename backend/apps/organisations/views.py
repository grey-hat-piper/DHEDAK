from django.db import transaction
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from apps.accounts.models import AccountType

from .access import get_membership_or_404, is_last_admin, organisations_for, require_admin
from .models import Membership, Role
from .serializers import AddMemberSerializer, MembershipSerializer, OrganisationSerializer

User = get_user_model()


class OrganisationListCreate(generics.ListCreateAPIView):
    serializer_class = OrganisationSerializer

    def get_queryset(self):
        return organisations_for(self.request.user).order_by("name")

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user
        if user.account_type == AccountType.INDIVIDUAL:
            raise PermissionDenied("Individual accounts cannot create organisations.")
        org = serializer.save(created_by=user)
        Membership.objects.create(user=user, organisation=org, role=Role.ADMIN)


class OrganisationDetail(generics.RetrieveUpdateAPIView):
    serializer_class = OrganisationSerializer

    def get_queryset(self):
        return organisations_for(self.request.user)

    def perform_update(self, serializer):
        require_admin(self.request.user, self.kwargs["pk"])
        serializer.save()


class MemberListCreate(APIView):
    """Member lists are visible to organisation administrators only."""

    def get(self, request, org_id):
        require_admin(request.user, org_id)
        qs = Membership.objects.filter(organisation_id=org_id).select_related("user").order_by("user__email")
        return Response(MembershipSerializer(qs, many=True).data)

    def post(self, request, org_id):
        require_admin(request.user, org_id)
        data = AddMemberSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        user = User.objects.filter(email__iexact=data.validated_data["email"], is_active=True).first()
        if user is None:
            raise ValidationError({"email": "No active DHEDAK account with this email. Ask them to register first."})
        if user.account_type == AccountType.INTERNAL:
            raise ValidationError({"email": "This account cannot be added."})
        member, created = Membership.objects.get_or_create(
            user=user, organisation_id=org_id, defaults={"role": data.validated_data["role"]}
        )
        if not created:
            raise ValidationError({"email": "Already a member."})
        return Response(MembershipSerializer(member).data, status=status.HTTP_201_CREATED)


class MemberDetail(APIView):
    def _target(self, request, org_id, pk):
        require_admin(request.user, org_id)
        return get_object_or_404(Membership.objects.select_related("user"), pk=pk, organisation_id=org_id)

    def patch(self, request, org_id, pk):
        member = self._target(request, org_id, pk)
        role = request.data.get("role")
        if role not in Role.values:
            raise ValidationError({"role": "Invalid role."})
        if role != Role.ADMIN and is_last_admin(member):
            raise ValidationError({"role": "An organisation must keep at least one administrator."})
        member.role = role
        member.save(update_fields=["role"])
        return Response(MembershipSerializer(member).data)

    def delete(self, request, org_id, pk):
        member = self._target(request, org_id, pk)
        if is_last_admin(member):
            raise ValidationError({"detail": "An organisation must keep at least one administrator."})
        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
