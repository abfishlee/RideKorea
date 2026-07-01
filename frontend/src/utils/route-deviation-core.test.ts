import {
  detectRouteDeviation,
  distanceToPolylineMeters,
  type LatLngPoint,
} from './route-deviation-core';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertAlmostEqual(actual: number | null, expected: number, tolerance: number, message: string) {
  if (actual === null) {
    throw new Error(`${message}: expected a number`);
  }
  assert(
    Math.abs(actual - expected) <= tolerance,
    `${message}: expected ${expected}, got ${actual}`,
  );
}

const route: LatLngPoint[] = [
  { lat: 37.0000, lng: 127.0000 },
  { lat: 37.0100, lng: 127.0000 },
];

function testDistanceToPolyline() {
  const nearRoute = { lat: 37.0050, lng: 127.0002 };
  const farRoute = { lat: 37.0050, lng: 127.0010 };

  assertAlmostEqual(distanceToPolylineMeters(nearRoute, route), 17.8, 4, 'near point distance');
  assertAlmostEqual(distanceToPolylineMeters(farRoute, route), 89, 8, 'far point distance');
}

function testDeviationHysteresis() {
  const first = detectRouteDeviation(
    { lat: 37.0050, lng: 127.0002 },
    route,
    { isOffRoute: false },
    { enterThresholdMeters: 40, exitThresholdMeters: 25 },
  );
  assert(!first.isOffRoute, 'near point should stay on route');

  const offRoute = detectRouteDeviation(
    { lat: 37.0050, lng: 127.0010 },
    route,
    first,
    { enterThresholdMeters: 40, exitThresholdMeters: 25 },
  );
  assert(offRoute.isOffRoute, 'far point should enter off-route state');

  const stillOffRoute = detectRouteDeviation(
    { lat: 37.0050, lng: 127.0003 },
    route,
    offRoute,
    { enterThresholdMeters: 40, exitThresholdMeters: 25 },
  );
  assert(stillOffRoute.isOffRoute, 'point outside exit threshold should keep off-route state');

  const recovered = detectRouteDeviation(
    { lat: 37.0050, lng: 127.0001 },
    route,
    stillOffRoute,
    { enterThresholdMeters: 40, exitThresholdMeters: 25 },
  );
  assert(!recovered.isOffRoute, 'point inside exit threshold should recover');
}

function testEmptyRouteIsOnRoute() {
  const result = detectRouteDeviation({ lat: 37.0, lng: 127.0 }, []);

  assert(!result.isOffRoute, 'empty route should not mark point off-route');
  assert(result.distanceFromRouteMeters === null, 'empty route should not report distance');
}

testDistanceToPolyline();
testDeviationHysteresis();
testEmptyRouteIsOnRoute();
