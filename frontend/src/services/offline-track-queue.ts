import type { JourneyTrackPointInput } from '@/types/ridekorea';
import {
  countOfflineTrackPoints,
  enqueueOfflineTrackPoint,
  markOfflineTrackAttempt,
  normalizeOfflineTrackQueue,
  peekOfflineTrackPoints,
  removeOfflineTrackPoints,
  type OfflineTrackQueueItem,
} from '@/utils/offline-track-queue-core';
import * as SecureStore from 'expo-secure-store';

const TRACK_QUEUE_KEY = 'ridekorea_offline_track_queue_v1';
const MAX_QUEUE_ITEMS = 80;
const TRACK_QUEUE_BATCH_LIMIT = 20;

async function readQueue(): Promise<OfflineTrackQueueItem[]> {
  try {
    const raw = await SecureStore.getItemAsync(TRACK_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return normalizeOfflineTrackQueue(parsed);
  } catch (err) {
    console.log('Offline track queue read error', err);
    return [];
  }
}

async function writeQueue(queue: OfflineTrackQueueItem[]): Promise<void> {
  await SecureStore.setItemAsync(TRACK_QUEUE_KEY, JSON.stringify(queue));
}

export async function getQueuedTrackPointCount(journeyId?: string | null): Promise<number> {
  const queue = await readQueue();
  return countOfflineTrackPoints(queue, journeyId);
}

export async function enqueueTrackPoint(
  journeyId: string,
  point: JourneyTrackPointInput,
): Promise<number> {
  const queue = await readQueue();
  const result = enqueueOfflineTrackPoint(
    queue,
    journeyId,
    point,
    new Date().toISOString(),
    MAX_QUEUE_ITEMS,
  );
  if (result.droppedCount > 0) {
    console.log(`Offline track queue dropped ${result.droppedCount} oldest point(s)`);
  }
  await writeQueue(result.queue);
  return countOfflineTrackPoints(result.queue, journeyId);
}

export async function takeQueuedTrackPoints(
  journeyId: string,
  limit = TRACK_QUEUE_BATCH_LIMIT,
): Promise<JourneyTrackPointInput[]> {
  const queue = await readQueue();
  return peekOfflineTrackPoints(queue, journeyId, limit);
}

export async function markQueuedTrackPointAttempt(
  journeyId: string,
  attemptedCount: number,
): Promise<number> {
  if (attemptedCount <= 0) return getQueuedTrackPointCount(journeyId);
  const queue = await readQueue();
  const nextQueue = markOfflineTrackAttempt(
    queue,
    journeyId,
    attemptedCount,
    new Date().toISOString(),
  );
  await writeQueue(nextQueue);
  return countOfflineTrackPoints(nextQueue, journeyId);
}

export async function removeQueuedTrackPoints(
  journeyId: string,
  removeCount: number,
): Promise<number> {
  if (removeCount <= 0) return getQueuedTrackPointCount(journeyId);
  const queue = await readQueue();
  const nextQueue = removeOfflineTrackPoints(queue, journeyId, removeCount);
  await writeQueue(nextQueue);
  return countOfflineTrackPoints(nextQueue, journeyId);
}
