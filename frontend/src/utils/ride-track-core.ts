import { distanceMetersBetween, type LatLngPoint } from './route-deviation-core';

export interface RideTrackPoint extends LatLngPoint {
  speedKmh?: number | null;
  recordedAt?: string;
}

export interface RideTrackState {
  previousPoint: RideTrackPoint | null;
  distanceKm: number;
}

export interface RideTrackOptions {
  maxSegmentKm?: number;
  minSegmentMeters?: number;
}

export interface RideTrackUpdate {
  state: RideTrackState;
  segmentKm: number;
  accepted: boolean;
}

const DEFAULT_MAX_SEGMENT_KM = 1;
const DEFAULT_MIN_SEGMENT_METERS = 3;

export function createEmptyRideTrackState(): RideTrackState {
  return {
    previousPoint: null,
    distanceKm: 0,
  };
}

export function addRideTrackPoint(
  state: RideTrackState,
  point: RideTrackPoint,
  options: RideTrackOptions = {},
): RideTrackUpdate {
  const maxSegmentKm = options.maxSegmentKm ?? DEFAULT_MAX_SEGMENT_KM;
  const minSegmentMeters = options.minSegmentMeters ?? DEFAULT_MIN_SEGMENT_METERS;

  if (!state.previousPoint) {
    return {
      state: {
        previousPoint: point,
        distanceKm: state.distanceKm,
      },
      segmentKm: 0,
      accepted: true,
    };
  }

  const segmentMeters = distanceMetersBetween(state.previousPoint, point);
  const segmentKm = segmentMeters / 1000;
  const accepted = segmentMeters >= minSegmentMeters && segmentKm < maxSegmentKm;

  return {
    state: {
      previousPoint: point,
      distanceKm: accepted ? state.distanceKm + segmentKm : state.distanceKm,
    },
    segmentKm: accepted ? segmentKm : 0,
    accepted,
  };
}

