from django.contrib import admin

from .models import AdministrativeRegion, Country, District


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "is_active"]
    list_editable = ["is_active"]


@admin.register(AdministrativeRegion)
class RegionAdmin(admin.ModelAdmin):
    list_display = ["name", "country"]
    list_filter = ["country"]
    search_fields = ["name"]


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ["name", "region"]
    list_filter = ["region__country"]
    search_fields = ["name"]
