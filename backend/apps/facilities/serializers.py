from rest_framework import serializers

from .models import Facility, FacilityService


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacilityService
        fields = ["slug", "name"]


class PublicFacilitySerializer(serializers.ModelSerializer):
    """Explicit allow-list of public fields. Internal fields (status, submitter, organisation, reviewer,
    sensitivity flags, timestamps) are deliberately not listed, so they cannot leak by accident."""

    facility_type_label = serializers.CharField(source="get_facility_type_display", read_only=True)
    country = serializers.CharField(source="country.code", read_only=True)
    region = serializers.SerializerMethodField()
    district = serializers.SerializerMethodField()
    services = ServiceSerializer(many=True, read_only=True)

    class Meta:
        model = Facility
        fields = [
            "id", "name", "facility_type", "facility_type_label", "country", "region", "district", "address",
            "latitude", "longitude", "phone", "email", "website", "operating_hours", "services",
            "data_source", "last_verified",
        ]
        read_only_fields = fields

    def get_region(self, obj):
        return obj.region.name if obj.region_id else None

    def get_district(self, obj):
        return obj.district.name if obj.district_id else None
