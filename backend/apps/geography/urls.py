from django.urls import path

from . import views

urlpatterns = [
    path("countries/", views.CountryList.as_view(), name="geo-countries"),
    path("regions/", views.RegionList.as_view(), name="geo-regions"),
    path("districts/", views.DistrictList.as_view(), name="geo-districts"),
]
