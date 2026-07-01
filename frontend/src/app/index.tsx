import { GoogleLoginScreen } from '@/components/auth/GoogleLoginScreen';
import { DiaryComposerModal } from '@/components/diary/DiaryComposerModal';
import { ImportedRoutePlanSheet } from '@/components/journey/ImportedRoutePlanSheet';
import { JourneyHeader } from '@/components/journey/JourneyHeader';
import { NearbyTravelPoiPanel } from '@/components/journey/NearbyTravelPoiPanel';
import { PublicDiarySheet } from '@/components/journey/PublicDiarySheet';
import { SharedRouteStopSheet } from '@/components/journey/SharedRouteStopSheet';
import { SpotBottomSheet } from '@/components/journey/SpotBottomSheet';
import { TravelPoiCategoryFilter } from '@/components/journey/TravelPoiCategoryFilter';
import { TravelPoiSheet } from '@/components/journey/TravelPoiSheet';
import { MapPanel } from '@/components/map/MapPanel';
import { GOOGLE_AUTH_PROXY_URI, GOOGLE_WEB_CLIENT_ID, MAP_URL } from '@/config/env';
import { useAuthSession } from '@/context/AuthSessionContext';
import { findSharedRouteById } from '@/data/shared-routes';
import { useJourneyMap } from '@/hooks/use-journey-map';
import { useJourneyRide } from '@/hooks/use-journey-ride';
import { useRiderLocation } from '@/hooks/use-rider-location';
import { nextLanguage, t } from '@/i18n';
import {
  claimVoucher,
  createTravelPoiReport,
  getJourney,
  getJourneyTrackPoints,
  getNearbyTravelPois,
  getPublicDiary,
  getPublicSharedRoute,
  setTravelPoiFeedback,
  socialLogin,
} from '@/services/api';
import { getImportedRouteDrafts } from '@/services/imported-routes';
import { clearActiveRideSession, getActiveRideSession } from '@/services/local-ride-session';
import type {
  AppLanguage,
  ImportedRouteDraft,
  Journey,
  LatLng,
  PublishedSharedRoute,
  SharedRoute,
  TravelPoi,
  TravelPoiReportType,
} from '@/types/ridekorea';
import { findNearestGeofenceHit } from '@/utils/geofence-core';
import { makeRedirectUri } from 'expo-auth-session';
import { router, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

WebBrowser.maybeCompleteAuthSession();

function formatElapsedTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

async function createOAuthVerifier() {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function extractAuthParam(url: string, key: string) {
  const match = url.match(new RegExp(`[?#&]${key}=([^&]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function toSharedRoute(route: PublishedSharedRoute): SharedRoute {
  const stops = [...route.stops].sort((a, b) => a.sort_order - b.sort_order);

  return {
    id: route.id,
    title: route.title,
    authorName: route.author?.display_name || 'RideKorea Rider',
    summary: route.summary || '라이더가 공유한 루트입니다.',
    startName: route.start_name || '출발지 미정',
    endName: route.end_name || '도착지 미정',
    distanceKm: 0,
    durationHours: 0,
    stayedPlaces: [],
    likeCount: route.like_count,
    commentCount: route.comment_count,
    shareCount: route.share_count,
    tags: ['가져온 루트'],
    stops: stops
      .filter((stop) => stop.location)
      .map((stop) => ({
        id: stop.id,
        title: stop.title,
        body: stop.body || '',
        type: 'note',
        location: stop.location!,
        photoUrl: stop.photo_urls?.[0],
        createdAt: stop.created_at,
      })),
  };
}

function toImportedDraft(journey: Journey, route: SharedRoute): ImportedRouteDraft {
  return {
    id: `journey-${journey.id}`,
    sourceRouteId: route.id,
    title: route.title,
    authorName: route.authorName,
    startName: route.startName,
    endName: route.endName,
    distanceKm: route.distanceKm,
    durationHours: route.durationHours,
    stopCount: route.stops.length,
    tags: route.tags,
    importedAt: journey.created_at || new Date().toISOString(),
  };
}

export default function HomeScreen() {
  const webViewRef = useRef<WebView>(null);
  const params = useLocalSearchParams<{ draftId?: string; journeyId?: string; publicDiaryId?: string }>();
  const { token, userProfile, isAuthChecked, signIn, signOut } = useAuthSession();
  const [lang, setLang] = useState<AppLanguage>('ko');
  const [isGoogleLoginLoading, setIsGoogleLoginLoading] = useState(false);
  const [importedDrafts, setImportedDrafts] = useState<ImportedRouteDraft[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<ImportedRouteDraft | null>(null);
  const [selectedServerJourney, setSelectedServerJourney] = useState<Journey | null>(null);
  const [selectedServerRoute, setSelectedServerRoute] = useState<SharedRoute | null>(null);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [riderLocation, setRiderLocation] = useState<LatLng | null>(null);
  const [isNearbyPoiOpen, setIsNearbyPoiOpen] = useState(false);
  const [nearbyPois, setNearbyPois] = useState<TravelPoi[]>([]);
  const [isLoadingNearbyPois, setIsLoadingNearbyPois] = useState(false);
  const [nearbyPoiError, setNearbyPoiError] = useState<string | null>(null);
  const [isSubmittingPoiFeedback, setIsSubmittingPoiFeedback] = useState(false);
  const [isSubmittingPoiReport, setIsSubmittingPoiReport] = useState(false);
  const [hasCheckedRideRecovery, setHasCheckedRideRecovery] = useState(false);
  const claimedVoucherSpotIdsRef = useRef<Set<string>>(new Set());
  const claimingVoucherSpotIdsRef = useRef<Set<string>>(new Set());

  const {
    courses,
    selectedCourse,
    selectedPublicDiary,
    selectedSharedRouteStop,
    selectedSpot,
    selectedTravelPoi,
    sharedRouteStopCount,
    areSharedRouteStopsVisible,
    isMapLoading,
    activeTravelPoiCategory,
    activeRoutePath,
    voucherSpots,
    setActiveTravelPoiCategory,
    fetchCourses,
    handleSelectCourse,
    handleSelectSharedRoute,
    setTrackPoints,
    toggleSharedRouteStopsVisible,
    handleWebViewMessage,
    resetMapState,
    setSelectedPublicDiary,
    setSelectedSharedRouteStop,
    setSelectedSpot,
    setSelectedTravelPoi,
  } = useJourneyMap({ lang, token, webViewRef });

  const {
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
    setSelectedPhoto,
  } = useJourneyRide({
    currentLocation: riderLocation,
    lang,
    token,
    selectedCourse,
    selectedSpot,
    onTrackPointsChange: setTrackPoints,
    onCreateLocalMomentMarker: (marker) => {
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'ADD_LOCAL_MOMENT_MARKER',
        marker: {
          id: marker.id,
          lat: marker.location.lat,
          lng: marker.location.lng,
          photoUrl: marker.photoUrl,
          title: marker.title,
        },
      }));
    },
  });

  const { handlePanToMyLocation, rideStats } = useRiderLocation({
    activeJourneyId: activeJourney?.id,
    activeRoutePath,
    lang,
    onLocationChange: setRiderLocation,
    onTrackPointsChange: setTrackPoints,
    token,
    webViewRef,
  });

  const selectedSharedRoute = selectedDraft
    ? findSharedRouteById(selectedDraft.sourceRouteId)
    : undefined;
  const selectedServerDraft = selectedServerJourney && selectedServerRoute
    ? toImportedDraft(selectedServerJourney, selectedServerRoute)
    : null;
  const voucherGeofenceTargets = useMemo(() => (
    voucherSpots.map((spot) => ({
      id: spot.id,
      lat: spot.location.lat,
      lng: spot.location.lng,
      radiusMeters: 150,
    }))
  ), [voucherSpots]);

  const restoreJourneyTrackPoints = useCallback(async (journeyId: string) => {
    if (!token) return;

    try {
      const trackPoints = await getJourneyTrackPoints(token, journeyId);
      setTrackPoints(trackPoints.map((point) => ({
        lat: point.location.lat,
        lng: point.location.lng,
        is_off_route: point.is_off_route,
      })));
    } catch (err) {
      console.log('Failed to restore journey track points', err);
    }
  }, [setTrackPoints, token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (token) {
        void fetchCourses();
        return;
      }

      resetMapState();
      resetJourney();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchCourses, resetJourney, resetMapState, token]);

  useEffect(() => {
    if (!token || !activeJourney || !riderLocation || voucherGeofenceTargets.length === 0) return;

    const hit = findNearestGeofenceHit(riderLocation, voucherGeofenceTargets);
    if (!hit) return;

    const spotId = hit.target.id;
    if (claimedVoucherSpotIdsRef.current.has(spotId)) return;
    if (claimingVoucherSpotIdsRef.current.has(spotId)) return;

    const spot = voucherSpots.find((item) => item.id === spotId);
    if (!spot) return;

    claimingVoucherSpotIdsRef.current.add(spotId);
    void claimVoucher(token, spotId, riderLocation, hit.target.radiusMeters)
      .then((voucher) => {
        claimedVoucherSpotIdsRef.current.add(spotId);
        Alert.alert(
          lang === 'ko' ? '지역 바우처가 도착했어요' : 'Voucher unlocked',
          lang === 'ko'
            ? `${spot.name} 주변에서 사용할 수 있는 바우처를 지갑에 담았습니다.`
            : `${voucher.title_en || spot.name_en} has been added to your wallet.`,
        );
      })
      .catch((err) => {
        console.log('Voucher geofence claim failed', err);
      })
      .finally(() => {
        claimingVoucherSpotIdsRef.current.delete(spotId);
      });
  }, [activeJourney, lang, riderLocation, token, voucherGeofenceTargets, voucherSpots]);

  useEffect(() => {
    if (!token || hasCheckedRideRecovery) return;

    const timer = setTimeout(() => {
      void (async () => {
        setHasCheckedRideRecovery(true);
        const savedSession = await getActiveRideSession();
        if (!savedSession) return;

        let recoverableJourney = savedSession.journey;
        try {
          recoverableJourney = await getJourney(token, savedSession.journey.id);
        } catch (err) {
          console.log('Failed to refresh recoverable journey', err);
        }

        if (recoverableJourney.status === 'completed') {
          await clearActiveRideSession(recoverableJourney.id);
          return;
        }

        Alert.alert(
          lang === 'ko' ? '진행 중인 라이딩이 있어요' : 'Resume ride?',
          lang === 'ko'
            ? `"${recoverableJourney.title}" 기록을 이어서 진행할까요?`
            : `Continue recording "${recoverableJourney.title}"?`,
          [
            {
              text: lang === 'ko' ? '삭제' : 'Discard',
              style: 'destructive',
              onPress: () => {
                void handleDiscardRecoveredJourney(recoverableJourney);
              },
            },
            {
              text: lang === 'ko' ? '이어서 주행' : 'Resume',
              onPress: () => {
                void (async () => {
                  if (recoverableJourney.source_shared_route_id) {
                    try {
                      const publicRoute = await getPublicSharedRoute(
                        recoverableJourney.source_shared_route_id,
                        token,
                      );
                      const nextRoute = toSharedRoute(publicRoute);
                      setSelectedDraft(null);
                      setSelectedServerJourney(recoverableJourney);
                      setSelectedServerRoute(nextRoute);
                      setActiveDraftId(`journey-${recoverableJourney.id}`);
                      handleSelectSharedRoute(nextRoute);
                    } catch (err) {
                      console.log('Failed to restore source route for ride recovery', err);
                    }
                  }
                  await handleRecoverJourney(recoverableJourney);
                  await restoreJourneyTrackPoints(recoverableJourney.id);
                })();
              },
            },
          ],
        );
      })();
    }, 500);

    return () => clearTimeout(timer);
  }, [
    handleDiscardRecoveredJourney,
    handleRecoverJourney,
    handleSelectSharedRoute,
    hasCheckedRideRecovery,
    lang,
    restoreJourneyTrackPoints,
    token,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void getImportedRouteDrafts().then(setImportedDrafts);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const draftId = params.draftId;
    if (!draftId || importedDrafts.length === 0) return;

    const timer = setTimeout(() => {
      const draft = importedDrafts.find((item) => item.id === draftId);
      if (!draft) return;

      const route = findSharedRouteById(draft.sourceRouteId);
      if (!route) {
        Alert.alert('루트 없음', '가져온 루트 원본을 찾지 못했습니다.');
        return;
      }

      setSelectedDraft(draft);
      handleSelectSharedRoute(route);
    }, 0);

    return () => clearTimeout(timer);
  }, [handleSelectSharedRoute, importedDrafts, params.draftId]);

  useEffect(() => {
    const journeyId = params.journeyId;
    if (!journeyId || !token) return;

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const nextJourney = await getJourney(token, journeyId);
          if (!nextJourney.source_shared_route_id) {
            Alert.alert('원본 루트 없음', '이 Journey에는 가져온 공유 루트가 연결되어 있지 않습니다.');
            return;
          }

          const publicRoute = await getPublicSharedRoute(nextJourney.source_shared_route_id, token);
          const nextRoute = toSharedRoute(publicRoute);
          if (nextRoute.stops.length === 0) {
            Alert.alert('스팟 없음', '지도에 표시할 원본 루트 스팟이 없습니다.');
            return;
          }

          setSelectedDraft(null);
          setSelectedServerJourney(nextJourney);
          setSelectedServerRoute(nextRoute);
          setActiveDraftId(null);
          handleSelectSharedRoute(nextRoute);
        } catch (err: any) {
          Alert.alert('루트 준비 실패', err.message || '가져온 루트를 불러오지 못했습니다.');
        }
      })();
    }, 0);

    return () => clearTimeout(timer);
  }, [handleSelectSharedRoute, params.journeyId, token]);

  useEffect(() => {
    const publicDiaryId = params.publicDiaryId;
    if (!publicDiaryId || !token) return;

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const diary = await getPublicDiary(publicDiaryId);
          setSelectedSpot(null);
          setSelectedSharedRouteStop(null);
          setSelectedTravelPoi(null);
          setSelectedPublicDiary(diary);

          webViewRef.current?.postMessage(JSON.stringify({
            type: 'SET_DIARIES',
            diaries: [diary],
          }));

          if (diary.lat && diary.lng) {
            webViewRef.current?.postMessage(JSON.stringify({
              type: 'PAN_TO_LOCATION',
              lat: diary.lat,
              lng: diary.lng,
            }));
          }
        } catch (err: any) {
          Alert.alert('공개 일지 없음', err.message || '지도에서 열 공개 일지를 찾지 못했습니다.');
        }
      })();
    }, 0);

    return () => clearTimeout(timer);
  }, [
    params.publicDiaryId,
    setSelectedPublicDiary,
    setSelectedSharedRouteStop,
    setSelectedSpot,
    setSelectedTravelPoi,
    token,
  ]);

  const handleActualGoogleLogin = async (idToken: string) => {
    try {
      setIsGoogleLoginLoading(true);
      const data = await socialLogin('google', idToken);
      await signIn(data.access_token);

      Alert.alert(
        lang === 'ko' ? '로그인 성공' : 'Login Success',
        lang === 'ko' ? '구글 소셜 로그인에 성공했습니다.' : 'Google login successful!',
      );
    } catch (err: any) {
      Alert.alert(lang === 'ko' ? '로그인 실패' : 'Login Failed', err.message);
    } finally {
      setIsGoogleLoginLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const nonce = await createOAuthVerifier();
      const state = await createOAuthVerifier();
      const returnUrl = makeRedirectUri();
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_WEB_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(GOOGLE_AUTH_PROXY_URI)}` +
        `&response_type=id_token` +
        `&scope=openid%20profile%20email` +
        `&nonce=${encodeURIComponent(nonce)}` +
        `&state=${encodeURIComponent(state)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);

      if (result.type !== 'success' || !result.url) return;

      const returnedState = extractAuthParam(result.url, 'state');
      const idToken = extractAuthParam(result.url, 'id_token');

      if (returnedState !== state) {
        Alert.alert(
          lang === 'ko' ? '로그인 실패' : 'Login Failed',
          lang === 'ko' ? '로그인 응답 검증에 실패했습니다.' : 'Failed to verify the login response.',
        );
        return;
      }

      if (idToken) {
        await handleActualGoogleLogin(idToken);
        return;
      }

      Alert.alert(
        lang === 'ko' ? '로그인 실패' : 'Login Failed',
        lang === 'ko' ? '토큰을 받아오지 못했습니다.' : 'Failed to retrieve token.',
      );
    } catch (err: any) {
      Alert.alert(lang === 'ko' ? '오류' : 'Error', err.message);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setHasCheckedRideRecovery(false);
    resetJourney();
    Alert.alert(
      lang === 'ko' ? '로그아웃' : 'Logout',
      lang === 'ko' ? '정상적으로 로그아웃되었습니다.' : 'Logged out successfully.',
    );
  };

  const handleCloseImportedPlan = () => {
    setSelectedDraft(null);
    setSelectedServerJourney(null);
    setSelectedServerRoute(null);
    setActiveDraftId(null);
  };

  const handleStartImportedPlan = () => {
    if (!selectedDraft) return;
    setActiveDraftId(selectedDraft.id);
    Alert.alert(
      lang === 'ko' ? '출발 준비 완료' : 'Ready to ride',
      lang === 'ko'
        ? '이 루트를 기준으로 주행을 시작할 준비가 되었습니다. 실제 트랙 저장은 서버 Journey 루트에서 지원됩니다.'
        : 'This route is ready. Actual track recording is supported for server-imported journeys.',
    );
  };

  const handleStartServerImportedPlan = () => {
    if (!selectedServerJourney) return;
    setActiveDraftId(`journey-${selectedServerJourney.id}`);
    void handleStartExistingJourney(selectedServerJourney);
  };

  const handleCompleteImportedPlan = () => {
    setActiveDraftId(null);
    Alert.alert(
      lang === 'ko' ? '계획 주행 종료' : 'Ride ended',
      lang === 'ko'
        ? '계획 주행 상태를 종료했습니다.'
        : 'The planned ride state has ended.',
    );
  };

  const loadNearbyPois = async () => {
    if (!riderLocation) {
      Alert.alert(
        lang === 'ko' ? '현재 위치 대기 중' : 'Waiting for location',
        lang === 'ko'
          ? 'GPS 위치가 잡히면 주변 수리소, 식당, 숙소 정보를 볼 수 있습니다.'
          : 'Nearby repair, food, and lodging information will appear after GPS is ready.',
      );
      return;
    }

    setIsNearbyPoiOpen(true);
    setIsLoadingNearbyPois(true);
    setNearbyPoiError(null);

    try {
      const pois = await getNearbyTravelPois(
        riderLocation.lat,
        riderLocation.lng,
        8000,
        activeTravelPoiCategory,
        token,
      );
      setNearbyPois(pois);
    } catch (err: any) {
      setNearbyPoiError(
        err.message ||
          (lang === 'ko'
            ? '주변 여행 정보를 불러오지 못했습니다.'
            : 'Failed to load nearby travel information.'),
      );
    } finally {
      setIsLoadingNearbyPois(false);
    }
  };

  const handleTravelPoiFeedback = async (feedbackType: 'recommend' | 'caution') => {
    if (!token || !selectedTravelPoi) return;

    try {
      setIsSubmittingPoiFeedback(true);
      const result = await setTravelPoiFeedback(token, selectedTravelPoi.id, feedbackType);
      setSelectedTravelPoi(result.poi);
      setNearbyPois((prev) => prev.map((poi) => poi.id === result.poi.id ? result.poi : poi));
    } catch (err: any) {
      Alert.alert(
        lang === 'ko' ? '반응 저장 실패' : 'Feedback failed',
        err.message ||
          (lang === 'ko'
            ? 'POI 반응을 저장하지 못했습니다.'
            : 'Could not save your POI feedback.'),
      );
    } finally {
      setIsSubmittingPoiFeedback(false);
    }
  };

  const handleTravelPoiReport = async (reportType: TravelPoiReportType) => {
    if (!token || !selectedTravelPoi) return;

    try {
      setIsSubmittingPoiReport(true);
      await createTravelPoiReport(token, selectedTravelPoi.id, reportType);
      Alert.alert(
        lang === 'ko' ? '신고 접수 완료' : 'Report submitted',
        lang === 'ko'
          ? '운영자 검수 목록에 추가했습니다. 지도 정보 개선에 도움을 주셔서 고마워요.'
          : 'This POI has been added to the admin review queue. Thanks for helping improve the map.',
      );
    } catch (err: any) {
      Alert.alert(
        lang === 'ko' ? '신고 실패' : 'Report failed',
        err.message ||
          (lang === 'ko'
            ? 'POI 신고를 저장하지 못했습니다.'
            : 'Could not submit this POI report.'),
      );
    } finally {
      setIsSubmittingPoiReport(false);
    }
  };

  if (!isAuthChecked) {
    return (
      <View style={styles.authLoadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  if (!token) {
    return (
      <GoogleLoginScreen
        lang={lang}
        isLoading={isGoogleLoginLoading}
        onLoginPress={handleGoogleLogin}
        onToggleLanguage={() => setLang(prev => nextLanguage(prev))}
      />
    );
  }

  return (
    <View style={styles.container}>
      <MapPanel
        ref={webViewRef}
        mapUrl={MAP_URL}
        isLoading={isMapLoading}
        loadingLabel={lang === 'ko' ? '지도 로드 중...' : 'Loading map...'}
        canCaptureMoment={Boolean(activeJourney)}
        onMessage={handleWebViewMessage}
        onCaptureMoment={handleOpenLocationDiary}
        onOpenNearbyPois={loadNearbyPois}
        onPanToMyLocation={handlePanToMyLocation}
      />

      <JourneyHeader
        lang={lang}
        courses={courses}
        selectedCourse={selectedCourse}
        importedDrafts={importedDrafts}
        selectedDraft={selectedDraft}
        userProfile={userProfile}
        onToggleLanguage={() => setLang(prev => nextLanguage(prev))}
        onSelectCourse={(course) => {
          setSelectedDraft(null);
          setSelectedServerJourney(null);
          setSelectedServerRoute(null);
          setSelectedSharedRouteStop(null);
          setSelectedPublicDiary(null);
          setSelectedTravelPoi(null);
          setActiveDraftId(null);
          handleSelectCourse(course);
        }}
        onSelectDraft={(draft) => {
          const route = findSharedRouteById(draft.sourceRouteId);
          if (!route) return;
          setSelectedDraft(draft);
          setSelectedServerJourney(null);
          setSelectedServerRoute(null);
          setSelectedSharedRouteStop(null);
          setSelectedPublicDiary(null);
          setSelectedTravelPoi(null);
          handleSelectSharedRoute(route);
        }}
        onLogout={handleLogout}
      />

      <TravelPoiCategoryFilter
        lang={lang}
        activeCategory={activeTravelPoiCategory}
        onChangeCategory={(category) => {
          setSelectedTravelPoi(null);
          setActiveTravelPoiCategory(category);
        }}
      />

      {sharedRouteStopCount > 0 && (
        <TouchableOpacity
          style={[
            styles.sharedStopToggle,
            !areSharedRouteStopsVisible && styles.sharedStopToggleMuted,
          ]}
          activeOpacity={0.86}
          onPress={toggleSharedRouteStopsVisible}>
          <Text style={styles.sharedStopToggleText}>
            {lang === 'ko'
              ? `원본 스팟 ${areSharedRouteStopsVisible ? '표시중' : '숨김'}`
              : `Original stops ${areSharedRouteStopsVisible ? 'on' : 'off'}`}
          </Text>
          <Text style={styles.sharedStopToggleCount}>
            {sharedRouteStopCount}
          </Text>
        </TouchableOpacity>
      )}

      {activeJourney && (
        <View style={styles.rideHud}>
          <View style={styles.rideHudItem}>
            <Text style={styles.rideHudLabel}>
              {t(lang, { ko: '속도', en: 'Speed', ja: '速度' })}
            </Text>
            <Text style={styles.rideHudValue}>
              {rideStats.speedKmh !== null ? rideStats.speedKmh.toFixed(1) : '--'}
            </Text>
            <Text style={styles.rideHudUnit}>km/h</Text>
          </View>
          <View style={styles.rideHudDivider} />
          <View style={styles.rideHudItem}>
            <Text style={styles.rideHudLabel}>
              {t(lang, { ko: '거리', en: 'Distance', ja: '距離' })}
            </Text>
            <Text style={styles.rideHudValue}>{rideStats.distanceKm.toFixed(2)}</Text>
            <Text style={styles.rideHudUnit}>km</Text>
          </View>
          <View style={styles.rideHudDivider} />
          <View style={styles.rideHudItem}>
            <Text style={styles.rideHudLabel}>
              {t(lang, { ko: '시간', en: 'Time', ja: '時間' })}
            </Text>
            <Text style={styles.rideHudValue}>{formatElapsedTime(rideStats.elapsedSeconds)}</Text>
            <Text style={styles.rideHudUnit}>
              {rideStats.pendingTrackPointCount > 0
                ? lang === 'ko'
                  ? `대기 ${rideStats.pendingTrackPointCount}`
                  : lang === 'ja'
                    ? `待機 ${rideStats.pendingTrackPointCount}`
                    : `${rideStats.pendingTrackPointCount} pending`
                : lang === 'ko'
                  ? '기록중'
                  : lang === 'ja'
                    ? '記録中'
                    : 'recording'}
            </Text>
          </View>
        </View>
      )}

      {isNearbyPoiOpen ? (
        <NearbyTravelPoiPanel
          lang={lang}
          pois={nearbyPois}
          isLoading={isLoadingNearbyPois}
          error={nearbyPoiError}
          onClose={() => setIsNearbyPoiOpen(false)}
          onRetry={loadNearbyPois}
        />
      ) : selectedTravelPoi ? (
        <TravelPoiSheet
          lang={lang}
          poi={selectedTravelPoi}
          isSubmittingFeedback={isSubmittingPoiFeedback}
          isSubmittingReport={isSubmittingPoiReport}
          onClose={() => setSelectedTravelPoi(null)}
          onFeedback={handleTravelPoiFeedback}
          onReport={handleTravelPoiReport}
        />
      ) : selectedPublicDiary ? (
        <PublicDiarySheet
          lang={lang}
          diary={selectedPublicDiary}
          onClose={() => setSelectedPublicDiary(null)}
          onOpenMoments={() => router.push('/moments' as never)}
        />
      ) : selectedSharedRouteStop ? (
        <SharedRouteStopSheet
          lang={lang}
          stop={selectedSharedRouteStop}
          canWriteDiary={Boolean(activeJourney)}
          onClose={() => setSelectedSharedRouteStop(null)}
          onWriteDiary={() => {
            handleOpenPlannedStopDiary(
              selectedSharedRouteStop.location,
              selectedSharedRouteStop.title,
              selectedSharedRouteStop.id,
            );
            setSelectedSharedRouteStop(null);
          }}
        />
      ) : selectedServerDraft ? (
        <ImportedRoutePlanSheet
          lang={lang}
          draft={selectedServerDraft}
          route={selectedServerRoute ?? undefined}
          isActive={activeJourney?.id === selectedServerJourney?.id}
          onClose={handleCloseImportedPlan}
          onStart={handleStartServerImportedPlan}
          onComplete={handleCompleteJourney}
        />
      ) : selectedDraft ? (
        <ImportedRoutePlanSheet
          lang={lang}
          draft={selectedDraft}
          route={selectedSharedRoute}
          isActive={activeDraftId === selectedDraft.id}
          onClose={handleCloseImportedPlan}
          onStart={handleStartImportedPlan}
          onComplete={handleCompleteImportedPlan}
        />
      ) : selectedSpot && (
        <SpotBottomSheet
          lang={lang}
          spot={selectedSpot}
          hasActiveJourney={Boolean(activeJourney)}
          onClose={() => setSelectedSpot(null)}
          onStartJourney={handleStartJourney}
          onOpenDiary={handleOpenSpotDiary}
          onCompleteJourney={handleCompleteJourney}
        />
      )}

      <DiaryComposerModal
        visible={isDiaryModalOpen}
        lang={lang}
        selectedSpot={selectedSpot}
        diaryLocation={diaryLocation}
        diaryLocationMode={diaryLocationMode}
        diaryLocationLabel={diaryLocationLabel}
        diaryTitle={diaryTitle}
        diaryText={diaryText}
        selectedPhoto={selectedPhoto}
        isSubmitting={isSubmittingDiary}
        onDiaryTitleChange={setDiaryTitle}
        onDiaryTextChange={setDiaryText}
        onPhotoChange={setSelectedPhoto}
        onCancel={() => setIsDiaryModalOpen(false)}
        onSubmit={handleSaveDiary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f7',
  },
  authLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  sharedStopToggle: {
    position: 'absolute',
    top: 164,
    right: 14,
    minHeight: 38,
    maxWidth: 190,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 11,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 6,
  },
  sharedStopToggleMuted: {
    backgroundColor: '#475569',
  },
  sharedStopToggleText: {
    color: '#FFFFFF',
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '900',
  },
  sharedStopToggleCount: {
    minWidth: 22,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '900',
  },
  rideHud: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 112,
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  rideHudItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rideHudLabel: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 2,
  },
  rideHudValue: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },
  rideHudUnit: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 1,
  },
  rideHudDivider: {
    width: 1,
    height: 38,
    backgroundColor: 'rgba(226, 232, 240, 0.25)',
  },
});
