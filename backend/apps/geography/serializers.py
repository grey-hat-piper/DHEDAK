from rest_framework import serializers

from .models import AdministrativeRegion, Country, District


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ["code", "name"]


class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdministrativeRegion
        fields = ["id", "name"]


class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ["id", "name"]
