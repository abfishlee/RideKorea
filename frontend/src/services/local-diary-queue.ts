import {
  createSpotDiary,
  uploadDiaryPhotos,
} from '@/services/api';
import type { Diary, LatLng } from '@/types/ridekorea';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

const DATABASE_NAME = 'ridekorea.db';
const DIARY_QUEUE_BATCH_LIMIT = 10;

interface DiaryQueueRow {
  id: number;
  journey_id: string;
  spot_id: string | null;
  source_shared_route_stop_id: string | null;
  title: string | null;
  body: string;
  photo_uri: string | null;
  lat: number | null;
  lng: number | null;
  visibility: string;
  queued_at: string;
  retry_count: number;
  last_tried_at: string | null;
}

export interface QueuedSpotDiaryInput {
  journeyId: string;
  spotId?: string | null;
  sourceSharedRouteStopId?: string | null;
  title?: string | null;
  body: string;
  photoUri?: string | null;
  location?: LatLng | null;
  visibility?: string;
}

export interface FlushQueuedSpotDiariesResult {
  syncedDiaries: Diary[];
  pendingDiaryCount: number;
}

let dbPromise: Promise<SQLiteDatabase> | null = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS spot_diary_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          journey_id TEXT NOT NULL,
          spot_id TEXT,
          source_shared_route_stop_id TEXT,
          title TEXT,
          body TEXT NOT NULL,
          photo_uri TEXT,
          lat REAL,
          lng REAL,
          visibility TEXT NOT NULL DEFAULT 'private',
          queued_at TEXT NOT NULL,
          retry_count INTEGER NOT NULL DEFAULT 0,
          last_tried_at TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_spot_diary_queue_journey_id_id
          ON spot_diary_queue (journey_id, id);
      `);
      return db;
    });
  }
  return dbPromise;
}

function rowToLocation(row: DiaryQueueRow): LatLng | null {
  if (typeof row.lat !== 'number' || typeof row.lng !== 'number') return null;
  return { lat: row.lat, lng: row.lng };
}

export async function enqueueSpotDiary(input: QueuedSpotDiaryInput): Promise<number> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO spot_diary_queue (
      journey_id,
      spot_id,
      source_shared_route_stop_id,
      title,
      body,
      photo_uri,
      lat,
      lng,
      visibility,
      queued_at,
      retry_count,
      last_tried_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)`,
    input.journeyId,
    input.spotId ?? null,
    input.sourceSharedRouteStopId ?? null,
    input.title ?? null,
    input.body,
    input.photoUri ?? null,
    input.location?.lat ?? null,
    input.location?.lng ?? null,
    input.visibility ?? 'private',
    new Date().toISOString(),
  );
  return getQueuedSpotDiaryCount(input.journeyId);
}

export async function getQueuedSpotDiaryCount(journeyId?: string | null): Promise<number> {
  const db = await getDb();
  const row = journeyId
    ? await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM spot_diary_queue WHERE journey_id = ?',
      journeyId,
    )
    : await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM spot_diary_queue',
    );
  return row?.count ?? 0;
}

async function getQueuedRows(journeyId: string, limit = DIARY_QUEUE_BATCH_LIMIT) {
  const db = await getDb();
  return db.getAllAsync<DiaryQueueRow>(
    `SELECT
      id,
      journey_id,
      spot_id,
      source_shared_route_stop_id,
      title,
      body,
      photo_uri,
      lat,
      lng,
      visibility,
      queued_at,
      retry_count,
      last_tried_at
     FROM spot_diary_queue
     WHERE journey_id = ?
     ORDER BY id ASC
     LIMIT ?`,
    journeyId,
    limit,
  );
}

export async function flushQueuedSpotDiaries(
  token: string,
  journeyId: string,
): Promise<FlushQueuedSpotDiariesResult> {
  const db = await getDb();
  const rows = await getQueuedRows(journeyId);
  const syncedDiaries: Diary[] = [];

  for (const row of rows) {
    await db.runAsync(
      `UPDATE spot_diary_queue
       SET retry_count = retry_count + 1,
           last_tried_at = ?
       WHERE id = ?`,
      new Date().toISOString(),
      row.id,
    );

    const photoUrls = row.photo_uri
      ? await uploadDiaryPhotos(token, row.photo_uri)
      : [];
    const diary = await createSpotDiary(
      token,
      row.journey_id,
      row.spot_id,
      row.source_shared_route_stop_id,
      row.title,
      row.body,
      photoUrls,
      rowToLocation(row),
      row.visibility,
    );
    syncedDiaries.push(diary);

    await db.runAsync('DELETE FROM spot_diary_queue WHERE id = ?', row.id);
  }

  return {
    syncedDiaries,
    pendingDiaryCount: await getQueuedSpotDiaryCount(journeyId),
  };
}

