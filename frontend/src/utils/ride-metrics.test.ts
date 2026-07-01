import {
  distanceKmBetween,
  formatRideDistance,
  formatRideDuration,
  summarizeRideTrack,
  type RideMetricPoint,
} from './ride-metrics';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertAlmostEqual(actual: number, expected: number, tolerance: number, message: string) {
  assert(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, got ${actual}`);
}

function point(
  lat: number,
  lng: number,
  recordedAt: string,
  isOffRoute = false,
): RideMetricPoint {
  return {
    location: { lat, lng },
    recorded_at: recordedAt,
    is_off_route: isOffRoute,
  };
}

function testDistanceCalculation() {
  const from = point(37.5665, 126.9780, '2026-06-30T09:00:00+09:00');
  const to = point(37.5675, 126.9790, '2026-06-30T09:05:00+09:00');

  assertAlmostEqual(distanceKmBetween(from, to), 0.142, 0.02, 'distanceKmBetween should use haversine distance');
}

function testSummarySortsPointsAndCountsOffRoute() {
  const summary = summarizeRideTrack([
    point(37.002, 127.002, '2026-06-30T09:20:00+09:00', true),
    point(37.000, 127.000, '2026-06-30T09:00:00+09:00'),
    point(37.001, 127.001, '2026-06-30T09:10:00+09:00'),
  ]);

  assert(summary.pointCount === 3, 'summary should count points');
  assert(summary.offRouteCount === 1, 'summary should count off-route points');
  assert(summary.durationSeconds === 1200, 'summary should use sorted first and last recorded_at');
  assert(summary.hasEnoughTrack, 'summary should mark two or more points as enough track');
  assert(summary.distanceKm > 0, 'summary should include distance');
  assert(summary.averageSpeedKmh > 0, 'summary should include average speed');
}

function testSummaryIgnoresLargeGpsJump() {
  const summary = summarizeRideTrack([
    point(37.000, 127.000, '2026-06-30T09:00:00+09:00'),
    point(37.001, 127.001, '2026-06-30T09:10:00+09:00'),
    point(38.000, 128.000, '2026-06-30T09:20:00+09:00'),
  ]);
  const withoutJump = summarizeRideTrack([
    point(37.000, 127.000, '2026-06-30T09:00:00+09:00'),
    point(37.001, 127.001, '2026-06-30T09:10:00+09:00'),
  ]);

  assertAlmostEqual(
    summary.distanceKm,
    withoutJump.distanceKm,
    0.001,
    'summary should ignore segments over the GPS jump threshold',
  );
}

function testEmptySummaryAndFormatting() {
  const summary = summarizeRideTrack([]);

  assert(summary.pointCount === 0, 'empty summary should have zero points');
  assert(!summary.hasEnoughTrack, 'empty summary should not have enough track');
  assert(formatRideDistance(0) === '기록 없음', 'zero distance label');
  assert(formatRideDistance(2.345) === '2.35 km', 'short distance label');
  assert(formatRideDistance(12.34) === '12.3 km', 'long distance label');
  assert(formatRideDuration(0) === '기록 없음', 'zero duration label');
  assert(formatRideDuration(600) === '10분', 'minute duration label');
  assert(formatRideDuration(7200) === '2시간', 'hour duration label');
  assert(formatRideDuration(7800) === '2시간 10분', 'hour and minute duration label');
}

testDistanceCalculation();
testSummarySortsPointsAndCountsOffRoute();
testSummaryIgnoresLargeGpsJump();
testEmptySummaryAndFormatting();
