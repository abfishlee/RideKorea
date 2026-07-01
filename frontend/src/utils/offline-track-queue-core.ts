import type { JourneyTrackPointInput } from '../types/ridekorea';

export interface OfflineTrackQueueItem {
  journeyId: string;
  point: JourneyTrackPointInput;
  queuedAt: string;
  retryCount: number;
  lastTriedAt?: string | null;
}

export interface EnqueueOfflineTrackPointResult {
  queue: OfflineTrackQueueItem[];
  droppedCount: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidTrackPoint(value: unknown): value is JourneyTrackPointInput {
  if (!isRecord(value)) return false;
  if (!isRecord(value.location)) return false;
  return (
    typeof value.location.lat === 'number'
    && typeof value.location.lng === 'number'
    && typeof value.recorded_at === 'string'
  );
}

export function normalizeOfflineTrackQueue(raw: unknown): OfflineTrackQueueItem[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (!isRecord(item)) return [];
    if (typeof item.journeyId !== 'string') return [];
    if (typeof item.queuedAt !== 'string') return [];
    if (!isValidTrackPoint(item.point)) return [];

    return [{
      journeyId: item.journeyId,
      point: item.point,
      queuedAt: item.queuedAt,
      retryCount: typeof item.retryCount === 'number' && item.retryCount > 0
        ? Math.floor(item.retryCount)
        : 0,
      lastTriedAt: typeof item.lastTriedAt === 'string' ? item.lastTriedAt : null,
    }];
  });
}

export function countOfflineTrackPoints(
  queue: OfflineTrackQueueItem[],
  journeyId?: string | null,
) {
  if (!journeyId) return queue.length;
  return queue.filter((item) => item.journeyId === journeyId).length;
}

export function enqueueOfflineTrackPoint(
  queue: OfflineTrackQueueItem[],
  journeyId: string,
  point: JourneyTrackPointInput,
  nowIso: string,
  maxItems: number,
): EnqueueOfflineTrackPointResult {
  const nextQueue = [
    ...queue,
    {
      journeyId,
      point,
      queuedAt: nowIso,
      retryCount: 0,
      lastTriedAt: null,
    },
  ];
  const cappedQueue = nextQueue.slice(-maxItems);

  return {
    queue: cappedQueue,
    droppedCount: nextQueue.length - cappedQueue.length,
  };
}

export function peekOfflineTrackPoints(
  queue: OfflineTrackQueueItem[],
  journeyId: string,
  limit: number,
) {
  return queue
    .filter((item) => item.journeyId === journeyId)
    .slice(0, limit)
    .map((item) => item.point);
}

export function markOfflineTrackAttempt(
  queue: OfflineTrackQueueItem[],
  journeyId: string,
  attemptedCount: number,
  nowIso: string,
) {
  let remainingToMark = attemptedCount;

  return queue.map((item) => {
    if (item.journeyId !== journeyId || remainingToMark <= 0) return item;
    remainingToMark -= 1;
    return {
      ...item,
      retryCount: item.retryCount + 1,
      lastTriedAt: nowIso,
    };
  });
}

export function removeOfflineTrackPoints(
  queue: OfflineTrackQueueItem[],
  journeyId: string,
  removeCount: number,
) {
  let remainingToRemove = removeCount;

  return queue.filter((item) => {
    if (item.journeyId !== journeyId || remainingToRemove <= 0) return true;
    remainingToRemove -= 1;
    return false;
  });
}
