from django.db.models import Q
from rest_framework.exceptions import ValidationError

from .models import FacilityType


def _int(params, key):
    raw = params.get(key)
    if raw in (None, ""):
        return None
    try:
        return int(raw)
    except ValueError:
        raise ValidationError({key: "Must be an integer."})


def _csv(params, key):
    return [v.strip() for v in params.get(key, "").split(",") if v.strip()]


def _bbox(raw):
    try:
        west, south, east, north = (float(v) for v in raw.split(","))
    except ValueError:
        raise ValidationError({"bbox": "Use bbox=west,south,east,north as four numbers."})
    if not (-180 <= west < east <= 180 and -90 <= south < north <= 90):
        raise ValidationError({"bbox": "Coordinates out of range, or min is not less than max."})
    return west, south, east, north


def apply_filters(qs, params):
    """Validated filtering shared by the list and GeoJSON endpoints. Bad input is a 400, never ignored."""
    if params.get("country"):
        qs = qs.filter(country__code=params["country"].upper())
    for key, field in (("region", "region_id"), ("district", "district_id")):
        value = _int(params, key)
        if value is not None:
            qs = qs.filter(**{field: value})

    types = _csv(params, "type")
    unknown = set(types) - set(FacilityType.values)
    if unknown:
        raise ValidationError({"type": f"Unknown facility type(s): {', '.join(sorted(unknown))}."})
    if types:
        qs = qs.filter(facility_type__in=types)

    services = _csv(params, "service")
    if services:
        qs = qs.filter(services__slug__in=services)

    q = params.get("q", "").strip()[:100]
    if q:
        qs = qs.filter(
            Q(name__icontains=q) | Q(address__icontains=q) | Q(district__name__icontains=q)
            | Q(region__name__icontains=q) | Q(services__name__icontains=q)
        )

    if params.get("bbox"):
        west, south, east, north = _bbox(params["bbox"])
        qs = qs.filter(longitude__gte=west, longitude__lte=east, latitude__gte=south, latitude__lte=north)

    return qs.distinct()
