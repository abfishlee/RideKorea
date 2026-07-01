import {
  addRideTrackPoint,
  createEmptyRideTrackState,
} from './ride-track-core';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function testFirstPointInitializesTrack() {
  const update = addRideTrackPoint(createEmptyRideTrackState(), {
    lat: 37.0,
    lng: 127.0,
  });

  assert(update.accepted, 'first point should be accepted');
  assert(update.segmentKm === 0, 'first point should not add distance');
  assert(update.state.previousPoint?.lat === 37.0, 'first point should become previous point');
}

function testSmallJitterIsIgnored() {
  const first = addRideTrackPoint(createEmptyRideTrackState(), {
    lat: 37.0,
    lng: 127.0,
  });
  const second = addRideTrackPoint(first.state, {
    lat: 37.000001,
    lng: 127.000001,
  });

  assert(!second.accepted, 'tiny GPS jitter should not add distance');
  assert(second.state.distanceKm === 0, 'tiny GPS jitter should keep distance unchanged');
}

function testNormalSegmentAddsDistance() {
  const first = addRideTrackPoint(createEmptyRideTrackState(), {
    lat: 37.0,
    lng: 127.0,
  });
  const second = addRideTrackPoint(first.state, {
    lat: 37.001,
    lng: 127.001,
  });

  assert(second.accepted, 'normal segment should be accepted');
  assert(second.state.distanceKm > 0.1, 'normal segment should add distance');
}

function testLargeJumpIsIgnored() {
  const first = addRideTrackPoint(createEmptyRideTrackState(), {
    lat: 37.0,
    lng: 127.0,
  });
  const second = addRideTrackPoint(first.state, {
    lat: 38.0,
    lng: 128.0,
  });

  assert(!second.accepted, 'large GPS jump should not add distance');
  assert(second.state.distanceKm === 0, 'large GPS jump should keep distance unchanged');
}

testFirstPointInitializesTrack();
testSmallJitterIsIgnored();
testNormalSegmentAddsDistance();
testLargeJumpIsIgnored();

