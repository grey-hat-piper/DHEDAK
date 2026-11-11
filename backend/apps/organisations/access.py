"""Single place where organisation access is decided. Every org-scoped view must use these helpers."""
from django.http import Http404
from rest_framework.exceptions import PermissionDenied

from .models import Membership, Role


def organisations_for(user):
    from .models import Organisation

    return Organisation.objects.filter(memberships__user=user)


def get_membership_or_404(user, org_id):
    """Non-members get 404, not 403, so organisation existence is not revealed."""
    try:
        return Membership.objects.select_related("organisation").get(user=user, organisation_id=org_id)
    except Membership.DoesNotExist:
        raise Http404


def require_role(user, org_id, *roles):
    membership = get_membership_or_404(user, org_id)
    if membership.role not in roles:
        raise PermissionDenied("Your role does not permit this action.")
    return membership


def require_admin(user, org_id):
    return require_role(user, org_id, Role.ADMIN)


def is_last_admin(membership):
    return (
        membership.role == Role.ADMIN
        and not Membership.objects.filter(organisation=membership.organisation, role=Role.ADMIN)
        .exclude(pk=membership.pk)
        .exists()
    )
