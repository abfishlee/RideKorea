import type { Journey } from '@/types/ridekorea';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

const DATABASE_NAME = 'ridekorea.db';
const ACTIVE_RIDE_KEY = 'active';
const WEB_ACTIVE_RIDE_KEY = 'ridekorea_active_ride_session_v1';

interface RideMetaRow {
  key: string;
  journey_id: string;
  journey_json: string;
  started_at: string;
  updated_at: string;
}

export interface LocalRideSession {
  journey: Journey;
  startedAt: string;
  updatedAt: string;
}

let dbPromise: Promise<SQLiteDatabase> | null = null;

function readWebSession(): LocalRideSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(WEB_ACTIVE_RIDE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalRideSession;
    if (!parsed?.journey?.id) return null;
    return parsed;
  } catch (err) {
    console.log('Active ride web session parse error', err);
    return null;
  }
}

async function getDb() {
  if (!dbPromise) {
    dbPromise = openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS ride_meta (
          key TEXT PRIMARY KEY NOT NULL,
          journey_id TEXT NOT NULL,
          journey_json TEXT NOT NULL,
          started_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      return db;
    });
  }
  return dbPromise;
}

export async function saveActiveRideSession(
  journey: Journey,
  startedAt = new Date().toISOString(),
): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      const nowIso = new Date().toISOString();
      window.localStorage.setItem(WEB_ACTIVE_RIDE_KEY, JSON.stringify({
        journey,
        startedAt,
        updatedAt: nowIso,
      }));
    }
    return;
  }

  const db = await getDb();
  const nowIso = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO ride_meta (key, journey_id, journey_json, started_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       journey_id = excluded.journey_id,
       journey_json = excluded.journey_json,
       updated_at = excluded.updated_at`,
    ACTIVE_RIDE_KEY,
    journey.id,
    JSON.stringify(journey),
    startedAt,
    nowIso,
  );
}

export async function getActiveRideSession(): Promise<LocalRideSession | null> {
  if (Platform.OS === 'web') {
    return readWebSession();
  }

  const db = await getDb();
  const row = await db.getFirstAsync<RideMetaRow>(
    `SELECT key, journey_id, journey_json, started_at, updated_at
     FROM ride_meta
     WHERE key = ?`,
    ACTIVE_RIDE_KEY,
  );

  if (!row) return null;

  try {
    const journey = JSON.parse(row.journey_json) as Journey;
    if (!journey.id || journey.id !== row.journey_id) return null;

    return {
      journey,
      startedAt: row.started_at,
      updatedAt: row.updated_at,
    };
  } catch (err) {
    console.log('Active ride session parse error', err);
    return null;
  }
}

export async function clearActiveRideSession(journeyId?: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    const session = readWebSession();
    if (typeof window !== 'undefined' && (!journeyId || session?.journey.id === journeyId)) {
      window.localStorage.removeItem(WEB_ACTIVE_RIDE_KEY);
    }
    return;
  }

  const db = await getDb();
  if (journeyId) {
    await db.runAsync(
      'DELETE FROM ride_meta WHERE key = ? AND journey_id = ?',
      ACTIVE_RIDE_KEY,
      journeyId,
    );
    return;
  }

  await db.runAsync('DELETE FROM ride_meta WHERE key = ?', ACTIVE_RIDE_KEY);
}
