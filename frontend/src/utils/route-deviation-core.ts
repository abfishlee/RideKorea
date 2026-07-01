export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface DeviationOptions {
  enterThresholdMeters?: number;
  exitThresholdMeters?: number;
}

export interface DeviationState {
  isOffRoute: boolean;
}

export interface DeviationResult extends DeviationState {
  distanceFromRouteMeters: number | null;
}

const EARTH_RADIUS_METERS = 6371000;
const DEFAULT_ENTER_THRESHOLD_METERS = 40;
const DEFAULT_EXIT_THRESHOLD_METERS = 25;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceMetersBetween(from: LatLngPoint, to: LatLngPoint) {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toLocalMeters(origin: LatLngPoint, point: LatLngPoint) {
  const latMeters = (point.lat - origin.lat) * 111320;
  const lngMeters = (point.lng - origin.lng) * 111320 * Math.cos(toRadians(origin.lat));
  return { x: lngMeters, y: latMeters };
}

export function distanceToSegmentMeters(point: LatLngPoint, start: LatLngPoint, end: LatLngPoint) {
  const p = toLocalMeters(start, point);
  const a = { x: 0, y: 0 };
  const b = toLocalMeters(start, end);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return distanceMetersBetween(point, start);
  }

  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared));
  const projection = {
    x: a.x + t * dx,
    y: a.y + t * dy,
  };
  const diffX = p.x - projection.x;
  const diffY = p.y - projection.y;
  return Math.sqrt(diffX * diffX + diffY * diffY);
}

export function distanceToPolylineMeters(point: LatLngPoint, path: LatLngPoint[]) {
  if (path.length === 0) return null;
  if (path.length === 1) return distanceMetersBetween(point, path[0]);

  return path.slice(1).reduce((closest, segmentEnd, index) => {
    const segmentStart = path[index];
    const distance = distanceToSegmentMeters(point, segmentStart, segmentEnd);
    return Math.min(closest, distance);
  }, Number.POSITIVE_INFINITY);
}

export function detectRouteDeviation(
  point: LatLngPoint,
  path: LatLngPoint[],
  previousState: DeviationState = { isOffRoute: false },
  options: DeviationOptions = {},
): DeviationResult {
  const distanceFromRouteMeters = distanceToPolylineMeters(point, path);
  if (distanceFromRouteMeters === null) {
    return {
      isOffRoute: false,
      distanceFromRouteMeters,
    };
  }

  const enterThresholdMeters = options.enterThresholdMeters ?? DEFAULT_ENTER_THRESHOLD_METERS;
  const exitThresholdMeters = options.exitThresholdMeters ?? DEFAULT_EXIT_THRESHOLD_METERS;
  const isOffRoute = previousState.isOffRoute
    ? distanceFromRouteMeters > exitThresholdMeters
    : distanceFromRouteMeters >= enterThresholdMeters;

  return {
    isOffRoute,
    distanceFromRouteMeters,
  };
}

