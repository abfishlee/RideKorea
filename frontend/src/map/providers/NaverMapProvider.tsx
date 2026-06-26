/**
 * NaverMapProvider — DEFAULT renderer.
 *
 * Backed by Naver "Web Dynamic Map" inside a React Native WebView. We deliberately
 * use the WebView (Web Dynamic Map) rather than the native Mobile Dynamic Map SDK
 * because Web Dynamic Map is eligible for NCP's free usage tier and reuses the
 * project's existing WebView bridge pattern (see frontend/assets/map.html).
 *
 * This file defines the provider adapter. The actual HTML/JS that loads the Naver
 * maps.js script and draws overlays lives in assets/map.html (to be migrated from
 * the Kakao bridge to Naver). The bridge message contract is kept identical to the
 * existing one (INIT_MAP / DRAW_ROUTE / SET_SPOTS / MAP_LOADED / MARKER_CLICKED /
 * MAP_BOUNDS_CHANGED) so the migration is incremental.
 *
 * NOTE: keep Naver feature names (거리뷰/길찾기/내비게이션 등) unchanged per NCP terms.
 */
import type {
  MapInitOptions,
  MapProvider,
  MapProviderId,
} from '../MapProvider';
import type {
  CameraPosition,
  MapBounds,
  MapEvent,
  MapEventHandler,
  MapLanguage,
  MapMarker,
  RoutePath,
} from '../types';

/**
 * Minimal bridge to the WebView. The React component owning the <WebView/>
 * supplies this: `post` injects a message into the page, and incoming page
 * messages are forwarded to `emit`.
 */
export interface WebViewBridge {
  post(message: unknown): void;
  /** Register a listener for messages coming FROM the WebView. Returns unsubscribe. */
  subscribe(listener: (raw: string) => void): () => void;
}

export class NaverMapProvider implements MapProvider {
  readonly id: MapProviderId = 'naver';
  readonly hasKoreanRoadDetail = true;
  readonly supportsOffline = false;

  private handlers = new Set<MapEventHandler>();
  private unsubscribeBridge?: () => void;

  constructor(private readonly bridge: WebViewBridge) {}

  async init(options: MapInitOptions): Promise<void> {
    this.unsubscribeBridge = this.bridge.subscribe((raw) => this.onBridgeMessage(raw));
    this.bridge.post({
      type: 'INIT_MAP',
      center: { lat: options.initialCamera.center.lat, lng: options.initialCamera.center.lng },
      level: options.initialCamera.zoom,
      language: options.language, // ko | en | zh | ja
      clientId: options.accessKey, // Naver maps client id (ncpClientId)
    });
  }

  setRoutes(routes: RoutePath[]): void {
    // Existing bridge draws one route at a time via DRAW_ROUTE; send each.
    routes.forEach((route) => {
      this.bridge.post({
        type: 'DRAW_ROUTE',
        routeId: route.id,
        path: route.coordinates, // [{lat,lng}, ...]
        color: route.color,
        widthPx: route.widthPx,
        dashed: route.dashed,
      });
    });
  }

  setMarkers(markers: MapMarker[]): void {
    this.bridge.post({
      type: 'SET_SPOTS',
      spots: markers.map((m) => ({
        id: m.id,
        name: m.title,
        type: m.type,
        lat: m.position.lat,
        lng: m.position.lng,
        voucherActive: m.voucherActive ?? false,
      })),
    });
  }

  moveCamera(position: CameraPosition, animated = true): void {
    this.bridge.post({
      type: 'MOVE_CAMERA',
      center: position.center,
      level: position.zoom,
      animated,
    });
  }

  fitBounds(bounds: MapBounds, paddingPx = 48): void {
    this.bridge.post({ type: 'FIT_BOUNDS', bounds, paddingPx });
  }

  setLanguage(language: MapLanguage): void {
    this.bridge.post({ type: 'SET_LANGUAGE', language });
  }

  on(handler: MapEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  destroy(): void {
    this.unsubscribeBridge?.();
    this.handlers.clear();
  }

  private onBridgeMessage(raw: string): void {
    let event: MapEvent;
    try {
      event = JSON.parse(raw) as MapEvent;
    } catch {
      return; // ignore malformed bridge payloads
    }
    this.handlers.forEach((h) => h(event));
  }
}
