import { distanceMetersBetween, type LatLngPoint } from './route-deviation-core';

export interface GeofenceTarget extends LatLngPoint {
  id: string;
  radiusMeters?: number;
}

export interface GeofenceHit {
  target: GeofenceTarget;
  distanceMeters: number;
}

export function findNearestGeofenceHit(
  point: LatLngPoint | null,
  targets: GeofenceTarget[],
  defaultRadiusMeters = 150,
): GeofenceHit | null {
  if (!point) return null;

  return targets.reduce<GeofenceHit | null>((nearest, target) => {
    const radiusMeters = target.radiusMeters ?? defaultRadiusMeters;
    const distanceMeters = distanceMetersBetween(point, target);
    if (distanceMeters > radiusMeters) return nearest;
    if (!nearest || distanceMeters < nearest.distanceMeters) {
      return { target, distanceMeters };
    }
    return nearest;
  }, null);
}

