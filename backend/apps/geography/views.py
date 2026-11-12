from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.throttling import ScopedRateThrottle

from .models import AdministrativeRegion, Country, District
from .serializers import CountrySerializer, DistrictSerializer, RegionSerializer


class PublicReadMixin:
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "public_read"
    pagination_class = None  # reference lists are small and used to populate filters


class CountryList(PublicReadMixin, generics.ListAPIView):
    serializer_class = CountrySerializer
    queryset = Country.objects.filter(is_active=True).order_by("name")


class RegionList(PublicReadMixin, generics.ListAPIView):
    serializer_class = RegionSerializer

    def get_queryset(self):
        code = self.request.query_params.get("country", "").upper()
        if not code:
            raise ValidationError({"country": "This query parameter is required."})
        return AdministrativeRegion.objects.filter(country__code=code, country__is_active=True).order_by("name")


class DistrictList(PublicReadMixin, generics.ListAPIView):
    serializer_class = DistrictSerializer

    def get_queryset(self):
        raw = self.request.query_params.get("region", "")
        if not raw.isdigit():
            raise ValidationError({"region": "A numeric region id is required."})
        return District.objects.filter(region_id=int(raw), region__country__is_active=True).order_by("name")
