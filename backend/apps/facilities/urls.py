from django.urls import path

from . import views

urlpatterns = [
    path("", views.FacilityList.as_view(), name="facility-list"),
    path("geojson/", views.FacilityGeoJSON.as_view(), name="facility-geojson"),
    path("meta/", views.FacilityMeta.as_view(), name="facility-meta"),
    path("<int:pk>/", views.FacilityDetail.as_view(), name="facility-detail"),
]
