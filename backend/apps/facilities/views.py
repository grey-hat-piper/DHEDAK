from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.geography.models import Country

from .filters import apply_filters
from .models import Facility, FacilityService, FacilityType
from .serializers import PublicFacilitySerializer, ServiceSerializer

GEOJSON_LIMIT = 2000


class PublicReadMixin:
    """Public, read-only, unauthenticated, throttled. Every public view reads Facility.objects.public()."""

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "public_read"


def public_queryset():
    return Facility.objects.public().select_related("country", "region", "district")


class FacilityList(PublicReadMixin, generics.ListAPIView):
    serializer_class = PublicFacilitySerializer

    def get_queryset(self):
        return apply_filters(public_queryset().prefetch_related("services"), self.request.query_params).order_by("name", "id")


class FacilityDetail(PublicReadMixin, generics.RetrieveAPIView):
    serializer_class = PublicFacilitySerializer

    def get_queryset(self):
        return public_queryset().prefetch_related("services")


class FacilityGeoJSON(PublicReadMixin, APIView):
    """Light GeoJSON for the map: just enough to draw and cluster pins. Details come from the detail endpoint."""

    def get(self, request):
        qs = apply_filters(public_queryset().prefetch_related("services"), request.query_params).order_by("id")
        rows = list(qs[: GEOJSON_LIMIT + 1])
        truncated = len(rows) > GEOJSON_LIMIT
        features = [
            {
                "type": "Feature",
                "id": f.id,
                "geometry": {"type": "Point", "coordinates": [f.longitude, f.latitude]},
                "properties": {
                    "id": f.id,
                    "name": f.name,
                    "facility_type": f.facility_type,
                    "services": [s.slug for s in f.services.all()],
                },
            }
            for f in rows[:GEOJSON_LIMIT]
        ]
        return Response({"type": "FeatureCollection", "features": features, "truncated": truncated})


class FacilityMeta(PublicReadMixin, APIView):
    """Options for filter controls. Sensitive services are listed only if a cleared public facility offers one."""

    def get(self, request):
        in_use = FacilityService.objects.filter(is_sensitive=True, facilities__in=Facility.objects.public()).distinct()
        services = list(FacilityService.objects.filter(is_sensitive=False).order_by("name")) + list(in_use.order_by("name"))
        return Response({
            "facility_types": [{"value": v, "label": label} for v, label in FacilityType.choices],
            "services": ServiceSerializer(services, many=True).data,
            "countries": [{"code": c.code, "name": c.name} for c in Country.objects.filter(is_active=True).order_by("name")],
        })
