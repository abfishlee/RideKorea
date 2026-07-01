export interface RideMetricPoint {
  location: {
    lat: number;
    lng: number;
  };
  recorded_at: string;
  is_off_route?: boolean;
}

export interface RideTrackSummary {
  distanceKm: number;
  durationSeconds: number;
  averageSpeedKmh: number;
  pointCount: number;
  offRouteCount: number;
  hasEnoughTrack: boolean;
}

const GPS_JUMP_THRESHOLD_KM = 1;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceKmBetween(from: RideMetricPoint, to: RideMetricPoint) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.location.lat - from.location.lat);
  const dLng = toRadians(to.location.lng - from.location.lng);
  const lat1 = toRadians(from.location.lat);
  const lat2 = toRadians(to.location.lat);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function summarizeRideTrack(points: RideMetricPoint[]): RideTrackSummary {
  if (points.length === 0) {
    return {
      distanceKm: 0,
      durationSeconds: 0,
      averageSpeedKmh: 0,
      pointCount: 0,
      offRouteCount: 0,
      hasEnoughTrack: false,
    };
  }

  const sortedPoints = [...points].sort((a, b) => (
    new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  ));
  const distanceKm = sortedPoints.reduce((sum, point, index) => {
    if (index === 0) return sum;
    const segmentKm = distanceKmBetween(sortedPoints[index - 1], point);
    return segmentKm < GPS_JUMP_THRESHOLD_KM ? sum + segmentKm : sum;
  }, 0);
  const firstRecordedAt = new Date(sortedPoints[0].recorded_at).getTime();
  const lastRecordedAt = new Date(sortedPoints[sortedPoints.length - 1].recorded_at).getTime();
  const durationSeconds = Math.max(0, Math.floor((lastRecordedAt - firstRecordedAt) / 1000));
  const averageSpeedKmh = durationSeconds > 0
    ? distanceKm / (durationSeconds / 3600)
    : 0;

  return {
    distanceKm,
    durationSeconds,
    averageSpeedKmh,
    pointCount: sortedPoints.length,
    offRouteCount: sortedPoints.filter((point) => point.is_off_route).length,
    hasEnoughTrack: sortedPoints.length >= 2,
  };
}

export function formatRideDistance(distanceKm: number) {
  if (distanceKm <= 0) return '기록 없음';
  if (distanceKm < 10) return `${distanceKm.toFixed(2)} km`;
  return `${distanceKm.toFixed(1)} km`;
}

export function formatRideDuration(totalSeconds: number) {
  if (totalSeconds <= 0) return '기록 없음';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours <= 0) return `${minutes}분`;
  if (minutes <= 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}
