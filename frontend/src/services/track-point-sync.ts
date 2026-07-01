import { addJourneyTrackPoints } from '@/services/api';
import {
  getQueuedTrackPointCount,
  markQueuedTrackPointAttempt,
  removeQueuedTrackPoints,
  takeQueuedTrackPoints,
} from '@/services/offline-track-queue';
import type { JourneyTrackPoint, JourneyTrackPointInput } from '@/types/ridekorea';

interface FlushJourneyTrackQueueParams {
  token: string;
  journeyId: string;
  extraPoint?: JourneyTrackPointInput;
}

export interface FlushJourneyTrackQueueResult {
  trackPoints: JourneyTrackPoint[];
  pendingTrackPointCount: number;
  flushedQueuedPointCount: number;
}

export async function flushJourneyTrackQueue({
  extraPoint,
  journeyId,
  token,
}: FlushJourneyTrackQueueParams): Promise<FlushJourneyTrackQueueResult> {
  const queuedPoints = await takeQueuedTrackPoints(journeyId);
  const pointsToSave = extraPoint ? [...queuedPoints, extraPoint] : queuedPoints;

  if (pointsToSave.length === 0) {
    return {
      trackPoints: [],
      pendingTrackPointCount: await getQueuedTrackPointCount(journeyId),
      flushedQueuedPointCount: 0,
    };
  }

  if (queuedPoints.length > 0) {
    await markQueuedTrackPointAttempt(journeyId, queuedPoints.length);
  }

  const trackPoints = await addJourneyTrackPoints(token, journeyId, pointsToSave);
  const pendingTrackPointCount = queuedPoints.length > 0
    ? await removeQueuedTrackPoints(journeyId, queuedPoints.length)
    : await getQueuedTrackPointCount(journeyId);

  return {
    trackPoints,
    pendingTrackPointCount,
    flushedQueuedPointCount: queuedPoints.length,
  };
}

