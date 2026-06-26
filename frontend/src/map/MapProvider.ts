/**
 * Provider-agnostic map + routing contracts.
 *
 * The app (screens, hooks) depends ONLY on these interfaces — never on a concrete
 * provider. This is what lets us run Naver today, keep Mapbox as a secondary, and
 * adopt Google's Korea navigation later by writing one new implementation, with no
 * changes to feature code. See map_provider_decision.md.
 */
import type {
  CameraPosition,
  LatLng,
  MapBounds,
  MapEventHandler,
  MapLanguage,
  MapMarker,
  RoutePath,
  TravelMode,
} from './types';

/** Identifiers for the renderers we support / plan to support. */
export type MapProviderId = 'naver' | 'mapbox' | 'google';

/**
 * Renders a base map and accepts overlays. Concrete providers may be backed by a
 * WebView bridge (Naver Web Dynamic Map) or a native SDK (Mapbox) — callers don't
 * care which.
 */
export interface MapProvider {
  readonly id: MapProviderId;

  /** Whether this provider's base map can show usable Korean road detail. */
  readonly hasKoreanRoadDetail: boolean;
  /** Whether this provider can render fully offline (Mapbox: yes). */
  readonly supportsOffline: boolean;

  /** One-time setup: provider keys, initial camera, language. */
  init(options: MapInitOptions): Promise<void>;

  /** Replace the set of route polylines drawn on the map. */
  setRoutes(routes: RoutePath[]): void;

  /** Replace the set of markers drawn on the map. */
  setMarkers(markers: MapMarker[]): void;

  /** Move/animate the camera. */
  moveCamera(position: CameraPosition, animated?: boolean): void;

  /** Fit the camera to a bounding box (e.g. a whole course). */
  fitBounds(bounds: MapBounds, paddingPx?: number): void;

  /** Switch label/UI language at runtime (Naver: ko/en/zh/ja). */
  setLanguage(language: MapLanguage): void;

  /** Subscribe to map events (load, marker tap, viewport idle, map tap). */
  on(handler: MapEventHandler): () => void;

  /** Pre-cache tiles for offline use; no-op for providers without offline support. */
  prefetchOffline?(bounds: MapBounds): Promise<void>;
}

export interface MapInitOptions {
  initialCamera: CameraPosition;
  language: MapLanguage;
  /** Provider-specific credential (Naver client id, Mapbox token, ...). */
  accessKey: string;
}

// --- Routing -----------------------------------------------------------------

export interface RouteRequest {
  origin: LatLng;
  destination: LatLng;
  waypoints?: LatLng[];
  mode: TravelMode; // 'cycling' primary; 'walking' fallback
  /** If set, prefer a stored official course over computed routing. */
  preferCourseId?: string;
}

export interface RouteResult {
  path: RoutePath;
  distanceMeters: number;
  durationSeconds: number;
  /** Which tier produced this route (for UX/telemetry). */
  source: 'self_managed' | 'osm_bike' | 'walking_fallback';
}

/**
 * Computes a route between points. Implementations decide the engine; the app
 * just asks for a cycling route and renders the returned path via MapProvider.
 */
export interface RoutingProvider {
  route(request: RouteRequest): Promise<RouteResult>;
}
