/**
 * OsmBikeRoutingProvider — bicycle routing via our backend.
 *
 * No Korean map vendor exposes a programmable bicycle-routing API, so cycling
 * routes come from a self-hosted OSM engine (GraphHopper/BRouter) that the backend
 * fronts at POST /routing. This client just calls that endpoint; the 3-tier
 * fallback (self-managed course GeoJSON -> OSM bike -> walking) lives server-side.
 *
 * Never use a car-routing API for cycling: it can route onto expressways.
 */
import type {
  RouteRequest,
  RouteResult,
  RoutingProvider,
} from '../MapProvider';

export interface OsmBikeRoutingConfig {
  /** Backend base URL, e.g. https://api.ridekorea.app */
  apiBaseUrl: string;
  /** Optional bearer token getter for authenticated routing calls. */
  getAuthToken?: () => Promise<string | null>;
}

export class OsmBikeRoutingProvider implements RoutingProvider {
  constructor(private readonly config: OsmBikeRoutingConfig) {}

  async route(request: RouteRequest): Promise<RouteResult> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = await this.config.getAuthToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${this.config.apiBaseUrl}/api/v1/routing`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        origin: request.origin,
        destination: request.destination,
        waypoints: request.waypoints ?? [],
        mode: request.mode,
        prefer_course_id: request.preferCourseId ?? null,
      }),
    });

    if (!res.ok) {
      throw new Error(`Routing failed: ${res.status}`);
    }

    const data = await res.json();
    return {
      path: {
        id: data.path.id,
        coordinates: data.path.coordinates, // [{lat,lng}, ...]
      },
      distanceMeters: data.distance_meters,
      durationSeconds: data.duration_seconds,
      source: data.source, // 'self_managed' | 'osm_bike' | 'walking_fallback'
    };
  }
}
