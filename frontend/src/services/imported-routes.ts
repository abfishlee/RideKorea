import type { ImportedRouteDraft, SharedRoute } from '@/types/ridekorea';
import * as SecureStore from 'expo-secure-store';

const IMPORTED_ROUTES_KEY = 'ridekorea_imported_route_drafts';

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
  const raw = await SecureStore.getItemAsync(IMPORTED_ROUTES_KEY);
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

  await SecureStore.setItemAsync(IMPORTED_ROUTES_KEY, JSON.stringify(nextDrafts));
  return nextDrafts;
}

export async function removeImportedRouteDraft(draftId: string): Promise<ImportedRouteDraft[]> {
  const drafts = await getImportedRouteDrafts();
  const nextDrafts = drafts.filter((draft) => draft.id !== draftId);
  await SecureStore.setItemAsync(IMPORTED_ROUTES_KEY, JSON.stringify(nextDrafts));
  return nextDrafts;
}
