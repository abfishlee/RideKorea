import {
  countOfflineTrackPoints,
  enqueueOfflineTrackPoint,
  markOfflineTrackAttempt,
  normalizeOfflineTrackQueue,
  peekOfflineTrackPoints,
  removeOfflineTrackPoints,
  type OfflineTrackQueueItem,
} from './offline-track-queue-core';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function point(lat: number, lng: number, recordedAt: string) {
  return {
    location: { lat, lng },
    speed_kmh: null,
    altitude_m: null,
    is_off_route: false,
    recorded_at: recordedAt,
  };
}

function queueItem(
  journeyId: string,
  index: number,
  retryCount = 0,
): OfflineTrackQueueItem {
  return {
    journeyId,
    point: point(37 + index / 1000, 127 + index / 1000, `2026-06-30T09:${String(index).padStart(2, '0')}:00+09:00`),
    queuedAt: `2026-06-30T09:${String(index).padStart(2, '0')}:01+09:00`,
    retryCount,
    lastTriedAt: null,
  };
}

function testNormalizeKeepsLegacyItemsAndDropsInvalidRows() {
  const normalized = normalizeOfflineTrackQueue([
    {
      journeyId: 'journey-a',
      point: point(37, 127, '2026-06-30T09:00:00+09:00'),
      queuedAt: '2026-06-30T09:00:01+09:00',
    },
    {
      journeyId: 'journey-b',
      point: { recorded_at: 'missing-location' },
      queuedAt: '2026-06-30T09:00:02+09:00',
    },
    null,
  ]);

  assert(normalized.length === 1, 'normalize should keep valid rows only');
  assert(normalized[0].retryCount === 0, 'legacy rows should default retryCount to zero');
  assert(normalized[0].lastTriedAt === null, 'legacy rows should default lastTriedAt to null');
}

function testEnqueueCapsQueueAndReportsDroppedItems() {
  const result = enqueueOfflineTrackPoint(
    [queueItem('old', 1), queueItem('old', 2)],
    'journey-a',
    point(37.003, 127.003, '2026-06-30T09:03:00+09:00'),
    '2026-06-30T09:03:01+09:00',
    2,
  );

  assert(result.queue.length === 2, 'enqueue should cap queue size');
  assert(result.droppedCount === 1, 'enqueue should report dropped rows');
  assert(result.queue[1].journeyId === 'journey-a', 'enqueue should keep the newest row');
}

function testPeekCountAndRemoveAreJourneyScoped() {
  const queue = [
    queueItem('journey-a', 1),
    queueItem('journey-b', 2),
    queueItem('journey-a', 3),
  ];

  assert(countOfflineTrackPoints(queue) === 3, 'count should include all rows without journey id');
  assert(countOfflineTrackPoints(queue, 'journey-a') === 2, 'count should filter by journey id');
  assert(peekOfflineTrackPoints(queue, 'journey-a', 1).length === 1, 'peek should apply limit');

  const removed = removeOfflineTrackPoints(queue, 'journey-a', 1);
  assert(removed.length === 2, 'remove should drop requested journey rows');
  assert(removed[0].journeyId === 'journey-b', 'remove should preserve other journey rows');
  assert(removed[1].journeyId === 'journey-a', 'remove should preserve later matching rows');
}

function testMarkAttemptOnlyMarksAttemptedRows() {
  const queue = [
    queueItem('journey-a', 1),
    queueItem('journey-a', 2, 2),
    queueItem('journey-a', 3),
  ];
  const marked = markOfflineTrackAttempt(
    queue,
    'journey-a',
    2,
    '2026-06-30T09:10:00+09:00',
  );

  assert(marked[0].retryCount === 1, 'mark should increment first attempted row');
  assert(marked[1].retryCount === 3, 'mark should increment second attempted row');
  assert(marked[2].retryCount === 0, 'mark should leave rows outside attempted count unchanged');
  assert(marked[0].lastTriedAt === '2026-06-30T09:10:00+09:00', 'mark should set lastTriedAt');
}

testNormalizeKeepsLegacyItemsAndDropsInvalidRows();
testEnqueueCapsQueueAndReportsDroppedItems();
testPeekCountAndRemoveAreJourneyScoped();
testMarkAttemptOnlyMarksAttemptedRows();
