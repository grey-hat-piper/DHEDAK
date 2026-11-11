from django.urls import path

from . import views

urlpatterns = [
    path("", views.OrganisationListCreate.as_view(), name="org-list"),
    path("<int:pk>/", views.OrganisationDetail.as_view(), name="org-detail"),
    path("<int:org_id>/members/", views.MemberListCreate.as_view(), name="org-members"),
    path("<int:org_id>/members/<int:pk>/", views.MemberDetail.as_view(), name="org-member"),
]
