"""Geospatial helpers.

Centralizes the PostGIS <-> lat/lng conversions that were previously duplicated
across the courses, spots, and diaries routers. Keeping them here means there is
a single place to adjust SRID handling, coordinate ordering, or output shape.

GeoJSON stores coordinates as [longitude, latitude]; the app's API speaks
{lat, lng}. These helpers are the only place that ordering is reasoned about.
"""
import json
from typing import Optional


def latlng_to_point_wkt(lat: float, lng: float) -> str:
    """Build a PostGIS WKT POINT string (note: WKT is 'POINT(lng lat)')."""
    return f"POINT({lng} {lat})"


def geojson_to_latlng(geojson_str: Optional[str]) -> tuple[float, float]:
    """Parse an ``ST_AsGeoJSON`` Point string into a ``(lat, lng)`` tuple.

    Returns ``(0.0, 0.0)`` when the input is empty, matching prior behavior.
    """
    if not geojson_str:
        return 0.0, 0.0
    data = json.loads(geojson_str)
    coords = data.get("coordinates", [0.0, 0.0])
    lng, lat = coords[0], coords[1]
    return lat, lng


def geojson_to_latlng_dict(geojson_str: Optional[str]) -> dict:
    """Parse an ``ST_AsGeoJSON`` Point string into ``{"lat": .., "lng": ..}``."""
    lat, lng = geojson_to_latlng(geojson_str)
    return {"lat": lat, "lng": lng}
