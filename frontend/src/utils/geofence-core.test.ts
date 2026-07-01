import { findNearestGeofenceHit, type GeofenceTarget } from './geofence-core';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const targets: GeofenceTarget[] = [
  { id: 'near', lat: 37.0002, lng: 127.0000, radiusMeters: 80 },
  { id: 'far', lat: 37.0100, lng: 127.0000, radiusMeters: 80 },
];

function testFindsNearestHitInsideRadius() {
  const hit = findNearestGeofenceHit({ lat: 37.0000, lng: 127.0000 }, targets);

  assert(hit !== null, 'should find a target inside radius');
  assert(hit.target.id === 'near', 'should find nearest target inside radius');
  assert(hit.distanceMeters < 80, 'hit should be inside radius');
}

function testReturnsNullOutsideRadius() {
  const hit = findNearestGeofenceHit({ lat: 37.0200, lng: 127.0000 }, targets);

  assert(hit === null, 'should return null outside every radius');
}

testFindsNearestHitInsideRadius();
testReturnsNullOutsideRadius();
