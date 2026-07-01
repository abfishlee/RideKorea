import type { JourneyTrackPointInput } from '@/types/ridekorea';
import {
  normalizeOfflineTrackQueue,
  type OfflineTrackQueueItem,
} from '@/utils/offline-track-queue-core';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';

const TRACK_QUEUE_KEY = 'ridekorea_offline_track_queue_v1';
const TRACK_QUEUE_MIGRATION_KEY = 'secure_store_track_queue_migrated_v1';
const DATABASE_NAME = 'ridekorea.db';
const TRACK_QUEUE_BATCH_LIMIT = 20;

interface TrackQueueRow {
  id: number;
  journey_id: string;
  point_json: string;
  queued_at: string;
  retry_count: number;
  last_tried_at: string | null;
}

let dbPromise: Promise<SQLiteDatabase> | null = null;

async function readLegacySecureStoreQueue(): Promise<OfflineTrackQueueItem[]> {
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

async function getDb() {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS ride_track_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          journey_id TEXT NOT NULL,
          point_json TEXT NOT NULL,
          queued_at TEXT NOT NULL,
          retry_count INTEGER NOT NULL DEFAULT 0,
          last_tried_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_ride_track_queue_journey_id_id
          ON ride_track_queue (journey_id, id);
      `);
      await migrateLegacySecureStoreQueue(db);
      return db;
    });
  }
  return dbPromise;
}

async function migrateLegacySecureStoreQueue(db: SQLiteDatabase) {
  const migrationState = await SecureStore.getItemAsync(TRACK_QUEUE_MIGRATION_KEY);
  if (migrationState === 'done') return;

  const legacyQueue = await readLegacySecureStoreQueue();
  if (legacyQueue.length > 0) {
    await db.withExclusiveTransactionAsync(async (tx) => {
      for (const item of legacyQueue) {
        await tx.runAsync(
          `INSERT INTO ride_track_queue
            (journey_id, point_json, queued_at, retry_count, last_tried_at)
           VALUES (?, ?, ?, ?, ?)`,
          item.journeyId,
          JSON.stringify(item.point),
          item.queuedAt,
          item.retryCount,
          item.lastTriedAt ?? null,
        );
      }
    });
  }

  await SecureStore.setItemAsync(TRACK_QUEUE_MIGRATION_KEY, 'done');
  await SecureStore.deleteItemAsync(TRACK_QUEUE_KEY);
}

function rowToQueueItem(row: TrackQueueRow): OfflineTrackQueueItem | null {
  try {
    const normalized = normalizeOfflineTrackQueue([{
      journeyId: row.journey_id,
      point: JSON.parse(row.point_json),
      queuedAt: row.queued_at,
      retryCount: row.retry_count,
      lastTriedAt: row.last_tried_at,
    }]);
    return normalized[0] ?? null;
  } catch (err) {
    console.log('Offline track queue row parse error', err);
    return null;
  }
}

async function getQueueRows(journeyId: string, limit: number) {
  const db = await getDb();
  return db.getAllAsync<TrackQueueRow>(
    `SELECT id, journey_id, point_json, queued_at, retry_count, last_tried_at
     FROM ride_track_queue
     WHERE journey_id = ?
     ORDER BY id ASC
     LIMIT ?`,
    journeyId,
    limit,
  );
}

export async function getQueuedTrackPointCount(journeyId?: string | null): Promise<number> {
  const db = await getDb();
  const row = journeyId
    ? await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM ride_track_queue WHERE journey_id = ?',
      journeyId,
    )
    : await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM ride_track_queue',
    );
  return row?.count ?? 0;
}

export async function enqueueTrackPoint(
  journeyId: string,
  point: JourneyTrackPointInput,
): Promise<number> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO ride_track_queue
      (journey_id, point_json, queued_at, retry_count, last_tried_at)
     VALUES (?, ?, ?, 0, NULL)`,
    journeyId,
    JSON.stringify(point),
    new Date().toISOString(),
  );
  return getQueuedTrackPointCount(journeyId);
}

export async function takeQueuedTrackPoints(
  journeyId: string,
  limit = TRACK_QUEUE_BATCH_LIMIT,
): Promise<JourneyTrackPointInput[]> {
  const rows = await getQueueRows(journeyId, limit);
  return rows.flatMap((row) => {
    const item = rowToQueueItem(row);
    return item ? [item.point] : [];
  });
}

export async function markQueuedTrackPointAttempt(
  journeyId: string,
  attemptedCount: number,
): Promise<number> {
  if (attemptedCount <= 0) return getQueuedTrackPointCount(journeyId);
  const db = await getDb();
  await db.runAsync(
    `UPDATE ride_track_queue
     SET retry_count = retry_count + 1,
         last_tried_at = ?
     WHERE id IN (
       SELECT id FROM ride_track_queue
       WHERE journey_id = ?
       ORDER BY id ASC
       LIMIT ?
     )`,
    new Date().toISOString(),
    journeyId,
    attemptedCount,
  );
  return getQueuedTrackPointCount(journeyId);
}

export async function removeQueuedTrackPoints(
  journeyId: string,
  removeCount: number,
): Promise<number> {
  if (removeCount <= 0) return getQueuedTrackPointCount(journeyId);
  const db = await getDb();
  await db.runAsync(
    `DELETE FROM ride_track_queue
     WHERE id IN (
       SELECT id FROM ride_track_queue
       WHERE journey_id = ?
       ORDER BY id ASC
       LIMIT ?
     )`,
    journeyId,
    removeCount,
  );
  return getQueuedTrackPointCount(journeyId);
}
