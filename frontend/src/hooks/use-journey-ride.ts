import { journeyCopy, t } from '@/i18n';
import {
  createJourney,
  createSpotDiary,
  updateJourneyStatus,
  uploadDiaryPhotos,
} from '@/services/api';
import { clearActiveRideSession, saveActiveRideSession } from '@/services/local-ride-session';
import { clearQueuedTrackPoints } from '@/services/offline-track-queue';
import type { AppLanguage, Course, Journey, LatLng, Spot } from '@/types/ridekorea';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

interface LocalMomentMarker {
  id: string;
  location: LatLng;
  photoUrl?: string | null;
  title: string;
}

type DiaryLocationMode = 'current' | 'planned-stop' | null;

interface UseJourneyRideParams {
  lang: AppLanguage;
  token: string | null;
  selectedCourse: Course | null;
  selectedSpot: Spot | null;
  currentLocation: LatLng | null;
  onCreateLocalMomentMarker?: (marker: LocalMomentMarker) => void;
}

function pick(lang: AppLanguage, ko: string, en: string, ja: string) {
  if (lang === 'ko') return ko;
  if (lang === 'ja') return ja;
  return en;
}

export function useJourneyRide({
  currentLocation,
  lang,
  token,
  selectedCourse,
  selectedSpot,
  onCreateLocalMomentMarker,
}: UseJourneyRideParams) {
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false);
  const [diaryTitle, setDiaryTitle] = useState('');
  const [diaryText, setDiaryText] = useState('');
  const [diaryLocation, setDiaryLocation] = useState<LatLng | null>(null);
  const [diaryLocationMode, setDiaryLocationMode] = useState<DiaryLocationMode>(null);
  const [diaryLocationLabel, setDiaryLocationLabel] = useState<string | null>(null);
  const [sourceSharedRouteStopId, setSourceSharedRouteStopId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isSubmittingDiary, setIsSubmittingDiary] = useState(false);

  const resetDiaryDraft = useCallback(() => {
    setDiaryTitle('');
    setDiaryText('');
    setDiaryLocation(null);
    setDiaryLocationMode(null);
    setDiaryLocationLabel(null);
    setSourceSharedRouteStopId(null);
    setSelectedPhoto(null);
  }, []);

  const resetJourney = useCallback(() => {
    setActiveJourney(null);
    setIsDiaryModalOpen(false);
    resetDiaryDraft();
    setIsSubmittingDiary(false);
  }, [resetDiaryDraft]);

  const uploadImageToServer = useCallback(async (photoUri: string): Promise<string[]> => {
    if (!token) return [];
    return uploadDiaryPhotos(token, photoUri);
  }, [token]);

  const handleStartJourney = useCallback(async () => {
    if (!token) {
      Alert.alert(
        t(lang, journeyCopy.loginRequiredTitle),
        t(lang, journeyCopy.loginRequiredBody),
      );
      return;
    }
    if (!selectedCourse) return;

    try {
      const journey = await createJourney(
        token,
        selectedCourse.id,
        `${selectedCourse.name_en} Riding`,
      );
      const startedJourney = await updateJourneyStatus(token, journey.id, 'riding');
      await saveActiveRideSession(startedJourney);
      setActiveJourney(startedJourney);
      Alert.alert(
        t(lang, journeyCopy.journeyStartedTitle),
        pick(
          lang,
          `"${selectedCourse.name}" 종주 기록을 시작합니다.`,
          `"${selectedCourse.name_en}" ride is now recording.`,
          `"${selectedCourse.name_en}" の走行記録を開始します。`,
        ),
      );
    } catch (err: any) {
      Alert.alert(t(lang, journeyCopy.error), err.message);
    }
  }, [lang, selectedCourse, token]);

  const handleStartExistingJourney = useCallback(async (journey: Journey) => {
    if (!token) {
      Alert.alert(
        t(lang, journeyCopy.loginRequiredTitle),
        t(lang, journeyCopy.loginRequiredBody),
      );
      return;
    }

    try {
      const startedJourney = await updateJourneyStatus(token, journey.id, 'riding');
      await saveActiveRideSession(startedJourney, journey.started_at || journey.created_at || undefined);
      setActiveJourney(startedJourney);
      Alert.alert(
        t(lang, journeyCopy.rideStartedTitle),
        pick(
          lang,
          `"${journey.title}" 기록을 시작합니다.`,
          `"${journey.title}" is now recording.`,
          `"${journey.title}" の記録を開始します。`,
        ),
      );
    } catch (err: any) {
      Alert.alert(t(lang, journeyCopy.error), err.message);
    }
  }, [lang, token]);

  const handleCompleteJourney = useCallback(async () => {
    if (!activeJourney || !token) return;

    try {
      await updateJourneyStatus(token, activeJourney.id, 'completed');
      await clearActiveRideSession(activeJourney.id);
      Alert.alert(
        t(lang, journeyCopy.journeyCompletedTitle),
        t(lang, journeyCopy.journeyCompletedBody),
      );
      setActiveJourney(null);
    } catch (err: any) {
      Alert.alert(t(lang, journeyCopy.error), err.message);
    }
  }, [activeJourney, lang, token]);

  const handleRecoverJourney = useCallback(async (journey: Journey) => {
    if (!token) return;

    try {
      const recoveredJourney = await updateJourneyStatus(token, journey.id, 'riding');
      await saveActiveRideSession(
        recoveredJourney,
        journey.started_at || journey.created_at || undefined,
      );
      setActiveJourney(recoveredJourney);
      Alert.alert(
        pick(lang, '二쇳뻾 蹂듦뎄', 'Ride recovered', 'ライドを復元'),
        pick(
          lang,
          `"${recoveredJourney.title}" 湲곕줉???댁뼱媛묐땲??`,
          `"${recoveredJourney.title}" is ready to continue.`,
          `"${recoveredJourney.title}" を続けられます。`,
        ),
      );
    } catch (err: any) {
      Alert.alert(t(lang, journeyCopy.error), err.message);
    }
  }, [lang, token]);

  const handleDiscardRecoveredJourney = useCallback(async (journey: Journey) => {
    try {
      if (token) {
        await updateJourneyStatus(token, journey.id, 'paused');
      }
      await clearQueuedTrackPoints(journey.id);
      await clearActiveRideSession(journey.id);
      if (activeJourney?.id === journey.id) {
        setActiveJourney(null);
      }
    } catch (err: any) {
      Alert.alert(t(lang, journeyCopy.error), err.message);
    }
  }, [activeJourney, lang, token]);

  const handleOpenSpotDiary = useCallback(() => {
    setDiaryLocation(null);
    setDiaryLocationMode(null);
    setDiaryLocationLabel(null);
    setSourceSharedRouteStopId(null);
    setIsDiaryModalOpen(true);
  }, []);

  const handleOpenLocationDiary = useCallback(() => {
    if (!activeJourney) {
      Alert.alert(
        t(lang, journeyCopy.startJourneyRequiredTitle),
        t(lang, journeyCopy.locationDiaryNeedsJourney),
      );
      return;
    }

    if (!currentLocation) {
      Alert.alert(
        t(lang, journeyCopy.waitingForGpsTitle),
        t(lang, journeyCopy.waitingForGpsBody),
      );
      return;
    }

    setDiaryLocation(currentLocation);
    setDiaryLocationMode('current');
    setDiaryLocationLabel(null);
    setSourceSharedRouteStopId(null);
    setIsDiaryModalOpen(true);
  }, [activeJourney, currentLocation, lang]);

  const handleOpenPlannedStopDiary = useCallback((location: LatLng, title?: string, stopId?: string) => {
    if (!activeJourney) {
      Alert.alert(
        t(lang, journeyCopy.startJourneyRequiredTitle),
        t(lang, journeyCopy.plannedStopNeedsJourney),
      );
      return;
    }

    setDiaryLocation(location);
    setDiaryLocationMode('planned-stop');
    setDiaryLocationLabel(title || null);
    setSourceSharedRouteStopId(stopId || null);
    setDiaryTitle(title ? pick(lang, `${title}에서`, `At ${title}`, `${title}にて`) : '');
    setIsDiaryModalOpen(true);
  }, [activeJourney, lang]);

  const handlePhotoChange = useCallback((photoUri: string | null) => {
    setSelectedPhoto(photoUri);

    if (photoUri && diaryLocation) {
      onCreateLocalMomentMarker?.({
        id: `local-moment-${Date.now()}`,
        location: diaryLocation,
        photoUrl: photoUri,
        title: diaryTitle.trim() || diaryText.trim() || t(lang, journeyCopy.ridingPhoto),
      });
    }
  }, [diaryLocation, diaryText, diaryTitle, lang, onCreateLocalMomentMarker]);

  const handleSaveDiary = useCallback(async () => {
    if (!activeJourney || !token) return;

    const saveLocation = selectedSpot ? null : diaryLocation;
    if (!selectedSpot && !saveLocation) {
      Alert.alert(
        t(lang, journeyCopy.locationRequiredTitle),
        t(lang, journeyCopy.locationRequiredBody),
      );
      return;
    }

    if (!diaryText.trim()) {
      Alert.alert(
        t(lang, journeyCopy.contentRequiredTitle),
        t(lang, journeyCopy.contentRequiredBody),
      );
      return;
    }

    setIsSubmittingDiary(true);
    try {
      const uploadedUrls = selectedPhoto ? await uploadImageToServer(selectedPhoto) : [];
      const savedDiary = await createSpotDiary(
        token,
        activeJourney.id,
        selectedSpot?.id ?? null,
        sourceSharedRouteStopId,
        diaryTitle.trim() || null,
        diaryText,
        uploadedUrls,
        saveLocation,
      );

      if (saveLocation) {
        onCreateLocalMomentMarker?.({
          id: savedDiary.id,
          location: saveLocation,
          photoUrl: uploadedUrls[0] ?? selectedPhoto,
          title: savedDiary.title || diaryTitle.trim() || diaryText.trim() || t(lang, journeyCopy.ridingDiary),
        });
      }

      Alert.alert(
        t(lang, journeyCopy.savedTitle),
        t(lang, journeyCopy.savedBody),
      );
      resetDiaryDraft();
      setIsDiaryModalOpen(false);
    } catch (err: any) {
      Alert.alert(t(lang, journeyCopy.error), err.message);
    } finally {
      setIsSubmittingDiary(false);
    }
  }, [
    activeJourney,
    diaryLocation,
    diaryText,
    diaryTitle,
    lang,
    onCreateLocalMomentMarker,
    resetDiaryDraft,
    selectedPhoto,
    selectedSpot,
    sourceSharedRouteStopId,
    token,
    uploadImageToServer,
  ]);

  return {
    activeJourney,
    diaryLocation,
    diaryLocationLabel,
    diaryLocationMode,
    diaryTitle,
    diaryText,
    handleCompleteJourney,
    handleOpenLocationDiary,
    handleOpenPlannedStopDiary,
    handleOpenSpotDiary,
    handleSaveDiary,
    handleStartExistingJourney,
    handleStartJourney,
    handleRecoverJourney,
    handleDiscardRecoveredJourney,
    isDiaryModalOpen,
    isSubmittingDiary,
    resetJourney,
    selectedPhoto,
    setDiaryTitle,
    setDiaryText,
    setIsDiaryModalOpen,
    setSelectedPhoto: handlePhotoChange,
  };
}
