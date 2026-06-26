/**
 * Shared geo + map types for the provider-agnostic map layer.
 *
 * These types are intentionally provider-neutral: nothing here references Naver,
 * Mapbox, or any SDK. Provider implementations adapt to/from these shapes.
 */

/** {lat, lng} — the app's canonical coordinate shape (NOT GeoJSON [lng, lat]). */
export interface LatLng {
  lat: number;
  lng: number;
}

/** A polyline path drawn on the map (e.g. a course or a routing result). */
export interface RoutePath {
  id: string;
  /** Ordered coordinates of the line. */
  coordinates: LatLng[];
  /** Optional style hints; providers map these to their own styling. */
  color?: string;
  widthPx?: number;
  dashed?: boolean;
}

export type SpotMarkerType =
  | 'certification_center'
  | 'lodging'
  | 'campsite'
  | 'restaurant'
  | 'cafe'
  | 'convenience_store'
  | 'bicycle_shop'
  | 'bicycle_rental'
  | 'repair'
  | 'rest_area'
  | 'viewpoint'
  | 'transport'
  | 'rider_story'; // public diary marker

export interface MapMarker {
  id: string;
  position: LatLng;
  type: SpotMarkerType;
  title?: string;
  /** True to render the voucher (🎁) affordance. */
  voucherActive?: boolean;
}

/** Bounding box for viewport queries (matches backend /diaries/public params). */
export interface MapBounds {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export interface CameraPosition {
  center: LatLng;
  /** Provider-neutral zoom (0 = world, larger = closer). Providers clamp/convert. */
  zoom: number;
}

/** Map UI language. Naver supports ko/en/zh/ja; others fall back to en. */
export type MapLanguage = 'ko' | 'en' | 'zh' | 'ja';

export type TravelMode = 'cycling' | 'walking';

/** Events the map surface emits back to the app (mirrors the WebView bridge). */
export type MapEvent =
  | { type: 'MAP_LOADED' }
  | { type: 'MARKER_CLICKED'; markerId: string }
  | { type: 'MAP_BOUNDS_CHANGED'; bounds: MapBounds }
  | { type: 'MAP_CLICKED'; position: LatLng };

export type MapEventHandler = (event: MapEvent) => void;
