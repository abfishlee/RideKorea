import type { ImportedRouteDraft, SharedRoute } from '@/types/ridekorea';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const IMPORTED_ROUTES_KEY = 'ridekorea_imported_route_drafts';

async function getStoredDraftsRaw() {
  if (Platform.OS === 'web') {
    return typeof window === 'undefined'
      ? null
      : window.localStorage.getItem(IMPORTED_ROUTES_KEY);
  }

  return SecureStore.getItemAsync(IMPORTED_ROUTES_KEY);
}

async function setStoredDraftsRaw(value: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(IMPORTED_ROUTES_KEY, value);
    }
    return;
  }

  await SecureStore.setItemAsync(IMPORTED_ROUTES_KEY, value);
}

function toDraft(route: SharedRoute): ImportedRouteDraft {
  return {
    id: `draft-${route.id}`,
    sourceRouteId: route.id,
    title: route.title,
    authorName: route.authorName,
    startName: route.startName,
    endName: route.endName,
    distanceKm: route.distanceKm,
    durationHours: route.durationHours,
    stopCount: route.stops.length,
    tags: route.tags,
    importedAt: new Date().toISOString(),
  };
}

export async function getImportedRouteDrafts(): Promise<ImportedRouteDraft[]> {
  const raw = await getStoredDraftsRaw();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function importSharedRoute(route: SharedRoute): Promise<ImportedRouteDraft[]> {
  const drafts = await getImportedRouteDrafts();
  const nextDraft = toDraft(route);
  const nextDrafts = [
    nextDraft,
    ...drafts.filter((draft) => draft.sourceRouteId !== route.id),
  ];

  await setStoredDraftsRaw(JSON.stringify(nextDrafts));
  return nextDrafts;
}

export async function removeImportedRouteDraft(draftId: string): Promise<ImportedRouteDraft[]> {
  const drafts = await getImportedRouteDrafts();
  const nextDrafts = drafts.filter((draft) => draft.id !== draftId);
  await setStoredDraftsRaw(JSON.stringify(nextDrafts));
  return nextDrafts;
}
