/**
 * Map layer entry point — factory + config.
 *
 * Feature code imports from here only, e.g.:
 *
 *   import { createMapProvider, createRoutingProvider, MAP_CONFIG } from '@/map';
 *
 * Swapping renderers (Naver -> Google once its Korea navigation ships) is a
 * one-line change to MAP_CONFIG.primary, with no edits to screens/hooks.
 */
import { MapProvider, MapProviderId, RoutingProvider } from './MapProvider';
import { NaverMapProvider, WebViewBridge } from './providers/NaverMapProvider';
import { MapboxMapProvider, MapboxNativeHandle } from './providers/MapboxMapProvider';
import { OsmBikeRoutingProvider, OsmBikeRoutingConfig } from './routing/OsmBikeRoutingProvider';

export * from './types';
export * from './MapProvider';
export { NaverMapProvider } from './providers/NaverMapProvider';
export { MapboxMapProvider } from './providers/MapboxMapProvider';
export { OsmBikeRoutingProvider } from './routing/OsmBikeRoutingProvider';

/**
 * Central map configuration. Pull real values from Expo config / env
 * (e.g. process.env.EXPO_PUBLIC_NAVER_CLIENT_ID) — do NOT hardcode secrets.
 */
export const MAP_CONFIG = {
  /** Primary renderer for the app. Naver today; 'google' is a future candidate. */
  primary: 'naver' as MapProviderId,
  /** Secondary renderer used for offline/terrain/custom tiles. */
  secondary: 'mapbox' as MapProviderId,
  naverClientId: process.env.EXPO_PUBLIC_NAVER_CLIENT_ID ?? '',
  mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000',
};

/** Dependencies the host React components inject into the providers. */
export interface MapProviderDeps {
  naverBridge?: WebViewBridge;
  mapboxNative?: MapboxNativeHandle;
}

/** Build the requested (or configured primary) map provider. */
export function createMapProvider(
  deps: MapProviderDeps,
  which: MapProviderId = MAP_CONFIG.primary,
): MapProvider {
  switch (which) {
    case 'naver':
      if (!deps.naverBridge) throw new Error('NaverMapProvider requires a WebViewBridge');
      return new NaverMapProvider(deps.naverBridge);
    case 'mapbox':
      if (!deps.mapboxNative) throw new Error('MapboxMapProvider requires a native handle');
      return new MapboxMapProvider(deps.mapboxNative);
    case 'google':
      // TODO: implement once Google's Korea turn-by-turn navigation ships.
      throw new Error('Google provider not yet implemented (awaiting Korea launch)');
    default:
      throw new Error(`Unknown map provider: ${which}`);
  }
}

/** Build the routing provider (OSM bike via backend). */
export function createRoutingProvider(
  config: Partial<OsmBikeRoutingConfig> = {},
): RoutingProvider {
  return new OsmBikeRoutingProvider({
    apiBaseUrl: config.apiBaseUrl ?? MAP_CONFIG.apiBaseUrl,
    getAuthToken: config.getAuthToken,
  });
}
