/**
 * MapboxMapProvider — SECONDARY renderer.
 *
 * Used for Mapbox's specific strengths, NOT as the primary Korea base map:
 *   - fully offline tiles for connectivity dead zones (river/mountain sections)
 *   - terrain / elevation profiles for climbs
 *   - hosting our own course GeoJSON as vector tilesets
 *
 * Korean road/POI detail is weak on Mapbox (1:5,000 export restriction), so this
 * provider is a deliberate fallback/companion to Naver. See map_provider_decision.md.
 *
 * Backed by the official @rnmapbox/maps native SDK. This file is a thin adapter;
 * the actual <MapboxGL.MapView/> is rendered by a companion component that holds a
 * camera ref and shape sources, and forwards them here.
 */
import type {
  MapInitOptions,
  MapProvider,
  MapProviderId,
} from '../MapProvider';
import type {
  CameraPosition,
  MapBounds,
  MapEventHandler,
  MapLanguage,
  MapMarker,
  RoutePath,
} from '../types';

/** Imperative handle the @rnmapbox/maps component exposes to this adapter. */
export interface MapboxNativeHandle {
  setRouteSources(routes: RoutePath[]): void;
  setMarkerSource(markers: MapMarker[]): void;
  setCamera(position: CameraPosition, animated: boolean): void;
  fitBounds(bounds: MapBounds, paddingPx: number): void;
  setOfflinePack(bounds: MapBounds): Promise<void>;
}

export class MapboxMapProvider implements MapProvider {
  readonly id: MapProviderId = 'mapbox';
  readonly hasKoreanRoadDetail = false; // intentional: companion, not primary
  readonly supportsOffline = true;

  private handlers = new Set<MapEventHandler>();

  constructor(private readonly native: MapboxNativeHandle) {}

  async init(options: MapInitOptions): Promise<void> {
    // TODO: MapboxGL.setAccessToken(options.accessKey) is called once at app boot.
    this.native.setCamera(options.initialCamera, false);
    // Mapbox label language is limited for KR; we overlay our own English names.
    this.emit({ type: 'MAP_LOADED' });
  }

  setRoutes(routes: RoutePath[]): void {
    this.native.setRouteSources(routes);
  }

  setMarkers(markers: MapMarker[]): void {
    this.native.setMarkerSource(markers);
  }

  moveCamera(position: CameraPosition, animated = true): void {
    this.native.setCamera(position, animated);
  }

  fitBounds(bounds: MapBounds, paddingPx = 48): void {
    this.native.fitBounds(bounds, paddingPx);
  }

  setLanguage(_language: MapLanguage): void {
    // No-op: Korean label language is constrained on Mapbox; handled via overlays.
  }

  on(handler: MapEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  async prefetchOffline(bounds: MapBounds): Promise<void> {
    await this.native.setOfflinePack(bounds);
  }

  private emit(event: Parameters<MapEventHandler>[0]): void {
    this.handlers.forEach((h) => h(event));
  }
}
