from django.contrib import admin

from .models import Facility, FacilityService


@admin.register(FacilityService)
class FacilityServiceAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "is_sensitive"]


@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ["name", "facility_type", "country", "region", "status", "sensitive_cleared", "is_demo", "last_verified"]
    list_filter = ["status", "facility_type", "country", "is_demo", "sensitive_cleared"]
    search_fields = ["name", "address"]
    filter_horizontal = ["services"]
    readonly_fields = ["created_at", "updated_at"]
