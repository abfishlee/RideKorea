import { useAuthSession } from '@/context/AuthSessionContext';
import {
  getJourney,
  getJourneyTrackPoints,
  getPublicSharedRoute,
  mediaUrl,
  publishJourneyAsSharedRoute,
  updateSpotDiaryVisibility,
} from '@/services/api';
import type {
  Diary,
  Journey,
  JourneyTrackPoint,
  PublishedSharedRoute,
  PublishedSharedRouteStop,
} from '@/types/ridekorea';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

function formatDateTime(value?: string | null) {
  if (!value) return '기록 없음';
  return new Date(value).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKmBetween(from: JourneyTrackPoint, to: JourneyTrackPoint) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.location.lat - from.location.lat);
  const dLng = toRadians(to.location.lng - from.location.lng);
  const lat1 = toRadians(from.location.lat);
  const lat2 = toRadians(to.location.lat);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(distanceKm: number) {
  if (distanceKm <= 0) return '기록 없음';
  if (distanceKm < 10) return `${distanceKm.toFixed(2)} km`;
  return `${distanceKm.toFixed(1)} km`;
}

function formatDurationSeconds(totalSeconds: number) {
  if (totalSeconds <= 0) return '기록 없음';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours <= 0) return `${minutes}분`;
  if (minutes <= 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}

function statusLabel(status?: string) {
  switch (status) {
    case 'completed':
      return '완료';
    case 'riding':
      return '진행 중';
    case 'paused':
      return '일시정지';
    case 'planning':
      return '준비 중';
    default:
      return '기록';
  }
}

function sortDiaries(diaries: Diary[]) {
  return [...diaries].sort((a, b) => {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

function sortStops(stops: PublishedSharedRouteStop[]) {
  return [...stops].sort((a, b) => a.sort_order - b.sort_order);
}

function routeStopTitle(stop: PublishedSharedRouteStop) {
  return stop.title || '제목 없는 스팟';
}

export default function JourneyDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { token, isAuthChecked } = useAuthSession();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [sourceRoute, setSourceRoute] = useState<PublishedSharedRoute | null>(null);
  const [trackPoints, setTrackPoints] = useState<JourneyTrackPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedRouteId, setPublishedRouteId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timeline = useMemo(() => sortDiaries(journey?.diaries || []), [journey?.diaries]);
  const sourceRouteStops = useMemo(() => sortStops(sourceRoute?.stops || []), [sourceRoute?.stops]);
  const sourceRouteCover = useMemo(() => {
    const photoUrl = sourceRouteStops.find((stop) => stop.photo_urls?.[0])?.photo_urls?.[0];
    return photoUrl ? mediaUrl(photoUrl) : null;
  }, [sourceRouteStops]);
  const offRouteCount = useMemo(
    () => trackPoints.filter((point) => point.is_off_route).length,
    [trackPoints],
  );
  const publicDiaryCount = useMemo(
    () => timeline.filter((diary) => diary.visibility === 'public').length,
    [timeline],
  );
  const offRouteRate = useMemo(() => {
    if (trackPoints.length === 0) return 0;
    return Math.round((offRouteCount / trackPoints.length) * 100);
  }, [offRouteCount, trackPoints.length]);
  const rideSummary = useMemo(() => {
    if (trackPoints.length === 0) {
      return {
        distanceKm: 0,
        durationSeconds: 0,
        averageSpeedKmh: 0,
        savedPointCount: 0,
        hasEnoughTrack: false,
      };
    }

    const sortedPoints = [...trackPoints].sort((a, b) => (
      new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    ));
    const distanceKm = sortedPoints.reduce((sum, point, index) => {
      if (index === 0) return sum;
      const segmentKm = distanceKmBetween(sortedPoints[index - 1], point);
      return segmentKm < 1 ? sum + segmentKm : sum;
    }, 0);
    const firstRecordedAt = new Date(sortedPoints[0].recorded_at).getTime();
    const lastRecordedAt = new Date(sortedPoints[sortedPoints.length - 1].recorded_at).getTime();
    const durationSeconds = Math.max(0, Math.floor((lastRecordedAt - firstRecordedAt) / 1000));
    const averageSpeedKmh = durationSeconds > 0
      ? distanceKm / (durationSeconds / 3600)
      : 0;

    return {
      distanceKm,
      durationSeconds,
      averageSpeedKmh,
      savedPointCount: sortedPoints.length,
      hasEnoughTrack: sortedPoints.length >= 2,
    };
  }, [trackPoints]);
  const diariesBySourceStop = useMemo(() => {
    return timeline.reduce<Record<string, Diary[]>>((acc, diary) => {
      const stopId = diary.source_shared_route_stop_id;
      if (!stopId) return acc;
      acc[stopId] = [...(acc[stopId] || []), diary];
      return acc;
    }, {});
  }, [timeline]);
  const matchedDiaryCount = useMemo(
    () => Object.values(diariesBySourceStop).reduce((sum, diaries) => sum + diaries.length, 0),
    [diariesBySourceStop],
  );
  const matchedStopRate = useMemo(() => {
    if (sourceRouteStops.length === 0) return 0;
    return Math.round((matchedDiaryCount / sourceRouteStops.length) * 100);
  }, [matchedDiaryCount, sourceRouteStops.length]);

  const loadJourney = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (!isAuthChecked) return;
    if (!token || !params.id) {
      setIsLoading(false);
      return;
    }

    if (mode === 'refresh') {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      setError(null);
      const [nextJourney, nextTrackPoints] = await Promise.all([
        getJourney(token, params.id),
        getJourneyTrackPoints(token, params.id),
      ]);
      setJourney(nextJourney);
      setTrackPoints(nextTrackPoints);

      if (nextJourney.source_shared_route_id) {
        try {
          const nextSourceRoute = await getPublicSharedRoute(
            nextJourney.source_shared_route_id,
            token,
          );
          setSourceRoute(nextSourceRoute);
        } catch {
          setSourceRoute(null);
        }
      } else {
        setSourceRoute(null);
      }
    } catch (err: any) {
      setError(err.message || '여정 기록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthChecked, params.id, token]);

  const handlePublishDraft = useCallback(async () => {
    if (!token || !journey) return;
    if (timeline.length === 0) {
      setPublishError('공유 루트 초안을 만들려면 먼저 하나 이상의 일지를 남겨야 합니다.');
      return;
    }

    setIsPublishing(true);
    try {
      setPublishError(null);
      const route = await publishJourneyAsSharedRoute(token, journey.id);
      setPublishedRouteId(route.id);
      router.push(`/shared-routes/${route.id}` as never);
    } catch (err: any) {
      setPublishError(err.message || '공유 루트 초안을 만들지 못했습니다.');
    } finally {
      setIsPublishing(false);
    }
  }, [journey, timeline.length, token]);

  const handleToggleDiaryVisibility = useCallback(async (diary: Diary) => {
    if (!token || !journey) return;
    const nextVisibility = diary.visibility === 'public' ? 'private' : 'public';

    setUpdatingVisibilityId(diary.id);
    try {
      const updatedDiary = await updateSpotDiaryVisibility(token, diary.id, nextVisibility);
      setJourney({
        ...journey,
        diaries: (journey.diaries || []).map((item) => (
          item.id === updatedDiary.id ? updatedDiary : item
        )),
      });
    } catch (err: any) {
      setPublishError(err.message || '일지 공개 상태를 바꾸지 못했습니다.');
    } finally {
      setUpdatingVisibilityId(null);
    }
  }, [journey, token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadJourney();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadJourney]);

  if (!isAuthChecked || isLoading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>여정 기록을 불러오는 중입니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => loadJourney('refresh')} />
      }>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>뒤로</Text>
      </TouchableOpacity>

      {!token ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>로그인이 필요합니다</Text>
          <Text style={styles.emptyText}>Journey 탭에서 로그인한 뒤 다시 확인해 주세요.</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>기록을 불러오지 못했습니다</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadJourney()}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : journey ? (
        <>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Journey Timeline</Text>
            <Text style={styles.title}>{journey.title}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{statusLabel(journey.status)}</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{timeline.length}</Text>
              <Text style={styles.statLabel}>일지</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{trackPoints.length}</Text>
              <Text style={styles.statLabel}>트랙 포인트</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{offRouteCount}</Text>
              <Text style={styles.statLabel}>이탈 포인트</Text>
            </View>
          </View>

          <View style={styles.rideSummaryPanel}>
            <View style={styles.rideSummaryHeader}>
              <View>
                <Text style={styles.rideSummaryEyebrow}>Ride Summary</Text>
                <Text style={styles.rideSummaryTitle}>주행 기록 요약</Text>
              </View>
              <View
                style={[
                  styles.syncBadge,
                  rideSummary.hasEnoughTrack ? styles.syncBadgeReady : styles.syncBadgeMuted,
                ]}>
                <Text
                  style={[
                    styles.syncBadgeText,
                    rideSummary.hasEnoughTrack ? styles.syncBadgeTextReady : styles.syncBadgeTextMuted,
                  ]}>
                  {rideSummary.hasEnoughTrack ? '저장됨' : '기록 대기'}
                </Text>
              </View>
            </View>
            <View style={styles.rideSummaryGrid}>
              <View style={styles.rideSummaryMetric}>
                <Text style={styles.rideSummaryLabel}>거리</Text>
                <Text style={styles.rideSummaryValue}>
                  {formatDistance(rideSummary.distanceKm)}
                </Text>
              </View>
              <View style={styles.rideSummaryMetric}>
                <Text style={styles.rideSummaryLabel}>시간</Text>
                <Text style={styles.rideSummaryValue}>
                  {formatDurationSeconds(rideSummary.durationSeconds)}
                </Text>
              </View>
              <View style={styles.rideSummaryMetric}>
                <Text style={styles.rideSummaryLabel}>평균 속도</Text>
                <Text style={styles.rideSummaryValue}>
                  {rideSummary.averageSpeedKmh > 0
                    ? `${rideSummary.averageSpeedKmh.toFixed(1)} km/h`
                    : '기록 없음'}
                </Text>
              </View>
              <View style={styles.rideSummaryMetric}>
                <Text style={styles.rideSummaryLabel}>저장 포인트</Text>
                <Text style={styles.rideSummaryValue}>
                  {rideSummary.savedPointCount.toLocaleString('ko-KR')}개
                </Text>
              </View>
            </View>
            <Text style={styles.rideSummaryHint}>
              GPS가 크게 튄 구간은 거리 계산에서 제외해 실제 라이딩 감각에 가깝게 계산합니다.
            </Text>
          </View>

          <View style={styles.datePanel}>
            <View>
              <Text style={styles.dateLabel}>시작</Text>
              <Text style={styles.dateValue}>{formatDateTime(journey.started_at)}</Text>
            </View>
            <View>
              <Text style={styles.dateLabel}>완료</Text>
              <Text style={styles.dateValue}>{formatDateTime(journey.completed_at)}</Text>
            </View>
          </View>

          <View style={styles.insightPanel}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightTitle}>공유 준비 상태</Text>
              <Text style={styles.insightMeta}>
                공개 일지 {publicDiaryCount}/{timeline.length}
              </Text>
            </View>
            <View style={styles.insightRows}>
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>원본 스팟 기록률</Text>
                <Text style={styles.insightValue}>
                  {sourceRouteStops.length > 0 ? `${matchedStopRate}%` : '원본 없음'}
                </Text>
              </View>
              <View style={styles.insightBarTrack}>
                <View
                  style={[
                    styles.insightBarFill,
                    { width: `${sourceRouteStops.length > 0 ? matchedStopRate : 0}%` },
                  ]}
                />
              </View>
              <View style={styles.insightRow}>
                <Text style={styles.insightLabel}>루트 이탈 비율</Text>
                <Text style={styles.insightValue}>
                  {trackPoints.length > 0 ? `${offRouteRate}%` : '기록 없음'}
                </Text>
              </View>
            </View>
            <Text style={styles.insightHint}>
              공개 루트로 발행하기 전, 보여주고 싶은 일지는 공개로 전환하고 민감한 위치는 비공개로 남겨두세요.
            </Text>
          </View>

          {sourceRoute && (
            <View style={styles.sourceRoutePanel}>
              <View style={styles.sourceRouteHeader}>
                <View style={styles.sourceRouteTitleBlock}>
                  <Text style={styles.sourceRouteEyebrow}>가져온 공유 루트</Text>
                  <Text style={styles.sourceRouteTitle} numberOfLines={2}>
                    {sourceRoute.title}
                  </Text>
                  <Text style={styles.sourceRouteAuthor} numberOfLines={1}>
                    {sourceRoute.author?.display_name || 'RideKorea Rider'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.sourceRouteButton}
                  onPress={() => router.push(`/shared-routes/${sourceRoute.id}` as never)}>
                  <Text style={styles.sourceRouteButtonText}>원본 보기</Text>
                </TouchableOpacity>
              </View>

              {sourceRouteCover && (
                <Image source={{ uri: sourceRouteCover }} style={styles.sourceRouteImage} />
              )}

              <Text style={styles.sourceRouteSummary} numberOfLines={3}>
                {sourceRoute.summary || '공유 루트의 스팟과 메모를 참고해 출발 전 계획을 세워보세요.'}
              </Text>

              <View style={styles.sourceRouteLine}>
                <Text style={styles.sourceRoutePoint} numberOfLines={1}>
                  {sourceRoute.start_name || '출발지 미정'}
                </Text>
                <View style={styles.sourceRouteDivider} />
                <Text style={styles.sourceRoutePoint} numberOfLines={1}>
                  {sourceRoute.end_name || '도착지 미정'}
                </Text>
              </View>
            </View>
          )}

          {sourceRouteStops.length > 0 && (
            <View style={styles.sourceRoutePanel}>
              <View style={styles.matchedHeader}>
                <View>
                  <Text style={styles.sourceRouteEyebrow}>원본 스팟별 내 기록</Text>
                  <Text style={styles.sourceRouteTitle}>
                    {matchedDiaryCount}/{sourceRouteStops.length}개 기록됨
                  </Text>
                </View>
              </View>
              <View style={styles.planStopList}>
                {sourceRouteStops.map((stop, index) => {
                  const diaries = diariesBySourceStop[stop.id] || [];
                  const stopPhoto = stop.photo_urls?.[0];
                  return (
                    <View key={stop.id} style={styles.planStopItem}>
                      <View style={styles.planStopNumber}>
                        <Text style={styles.planStopNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.planStopCopy}>
                        <Text style={styles.planStopTitle} numberOfLines={1}>
                          {routeStopTitle(stop)}
                        </Text>
                        {!!stop.body && (
                          <Text style={styles.planStopBody} numberOfLines={2}>
                            {stop.body}
                          </Text>
                        )}
                        {stopPhoto && (
                          <Image source={{ uri: mediaUrl(stopPhoto) }} style={styles.stopThumb} />
                        )}
                        {diaries.length > 0 ? (
                          <View style={styles.myDiaryStack}>
                            {diaries.map((diary) => (
                              <View key={diary.id} style={styles.myDiaryCard}>
                                <Text style={styles.myDiaryLabel}>내 기록</Text>
                                <Text style={styles.myDiaryTitle} numberOfLines={1}>
                                  {diary.title || '제목 없는 기록'}
                                </Text>
                                {!!diary.diary_text && (
                                  <Text style={styles.myDiaryBody} numberOfLines={2}>
                                    {diary.diary_text}
                                  </Text>
                                )}
                              </View>
                            ))}
                          </View>
                        ) : (
                          <Text style={styles.noDiaryText}>아직 이 스팟에 남긴 내 기록이 없습니다.</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.publishPanel}>
            <View style={styles.publishCopy}>
              <Text style={styles.publishTitle}>공유 루트 발행 준비</Text>
              <Text style={styles.publishText}>
                {publishError
                  ? publishError
                  : publishedRouteId
                    ? '공유 루트 초안이 생성되었습니다. 미리보기에서 공개 전 내용을 확인할 수 있습니다.'
                    : '제목이 있는 사진 기록들이 공유 루트의 타임라인 재료가 됩니다.'}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.publishButton,
                isPublishing && styles.publishButtonDisabled,
              ]}
              disabled={isPublishing}
              onPress={
                publishedRouteId
                  ? () => router.push(`/shared-routes/${publishedRouteId}` as never)
                  : handlePublishDraft
              }>
              <Text style={styles.publishButtonText}>
                {publishedRouteId ? '미리보기' : isPublishing ? '생성 중' : '초안 만들기'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timelineSection}>
            <Text style={styles.sectionTitle}>라이딩 타임라인</Text>
            {timeline.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>아직 일지가 없습니다</Text>
                <Text style={styles.emptyText}>
                  Journey 화면에서 주행 중 기록 버튼을 눌러 사진과 메모를 남겨보세요.
                </Text>
              </View>
            ) : (
              <View style={styles.timelineList}>
                {timeline.map((diary, index) => {
                  const photoUrl = diary.photo_urls?.[0];
                  const sourceStop = sourceRouteStops.find(
                    (stop) => stop.id === diary.source_shared_route_stop_id,
                  );
                  return (
                    <View key={diary.id} style={styles.timelineItem}>
                      <View style={styles.timelineRail}>
                        <View style={styles.timelineDot} />
                        {index < timeline.length - 1 && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.timelineCard}>
                        <Text style={styles.timelineTime}>{formatDateTime(diary.created_at)}</Text>
                        {sourceStop && (
                          <Text style={styles.sourceStopBadge}>
                            원본 스팟: {routeStopTitle(sourceStop)}
                          </Text>
                        )}
                        <Text style={styles.timelineTitle}>
                          {diary.title || '제목 없는 기록'}
                        </Text>
                        <View style={styles.visibilityRow}>
                          <Text
                            style={[
                              styles.visibilityBadge,
                              diary.visibility === 'public'
                                ? styles.publicBadge
                                : styles.privateBadge,
                            ]}>
                            {diary.visibility === 'public' ? '공개' : '비공개'}
                          </Text>
                          <TouchableOpacity
                            style={styles.visibilityButton}
                            disabled={updatingVisibilityId === diary.id}
                            onPress={() => handleToggleDiaryVisibility(diary)}>
                            <Text style={styles.visibilityButtonText}>
                              {updatingVisibilityId === diary.id
                                ? '변경 중'
                                : diary.visibility === 'public'
                                  ? '비공개로 전환'
                                  : '공개하기'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        {!!diary.diary_text && (
                          <Text style={styles.timelineBody}>{diary.diary_text}</Text>
                        )}
                        {photoUrl && (
                          <Image source={{ uri: mediaUrl(photoUrl) }} style={styles.timelineImage} />
                        )}
                        {diary.lat && diary.lng && (
                          <Text style={styles.locationText}>
                            {diary.lat.toFixed(5)}, {diary.lng.toFixed(5)}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>여정을 찾을 수 없습니다</Text>
          <Text style={styles.emptyText}>My Path에서 다시 선택해 주세요.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    paddingTop: 54,
    paddingBottom: 38,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  backButtonText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  header: {
    marginBottom: 16,
  },
  eyebrow: {
    color: '#1E3A8A',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#0F172A',
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 34,
    marginBottom: 10,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '900',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    minHeight: 72,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
  },
  statValue: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },
  rideSummaryPanel: {
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 14,
    marginBottom: 14,
  },
  rideSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  rideSummaryEyebrow: {
    color: '#1E3A8A',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  rideSummaryTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
  },
  syncBadge: {
    minHeight: 30,
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
  },
  syncBadgeReady: {
    backgroundColor: '#DCFCE7',
  },
  syncBadgeMuted: {
    backgroundColor: '#F1F5F9',
  },
  syncBadgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  syncBadgeTextReady: {
    color: '#166534',
  },
  syncBadgeTextMuted: {
    color: '#64748B',
  },
  rideSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  rideSummaryMetric: {
    width: '48%',
    minHeight: 72,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rideSummaryLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 5,
  },
  rideSummaryValue: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  rideSummaryHint: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 12,
  },
  datePanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
  },
  dateLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  dateValue: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '900',
  },
  insightPanel: {
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 14,
    marginBottom: 14,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  insightTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  insightMeta: {
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '900',
  },
  insightRows: {
    gap: 8,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  insightLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },
  insightValue: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
  },
  insightBarTrack: {
    height: 7,
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  insightBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#38BDF8',
  },
  insightHint: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 10,
  },
  sourceRoutePanel: {
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 14,
    marginBottom: 14,
  },
  sourceRouteHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  sourceRouteTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  sourceRouteEyebrow: {
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 5,
  },
  sourceRouteTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
  },
  sourceRouteAuthor: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  sourceRouteButton: {
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
  },
  sourceRouteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  sourceRouteImage: {
    width: '100%',
    height: 162,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  sourceRouteSummary: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  sourceRouteLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  sourceRoutePoint: {
    flex: 1,
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
  },
  sourceRouteDivider: {
    width: 28,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#38BDF8',
  },
  matchedHeader: {
    marginBottom: 12,
  },
  planStopList: {
    gap: 9,
  },
  planStopItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    padding: 10,
  },
  planStopNumber: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
  },
  planStopNumberText: {
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '900',
  },
  planStopCopy: {
    flex: 1,
    minWidth: 0,
  },
  planStopTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 3,
  },
  planStopBody: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
  },
  stopThumb: {
    width: '100%',
    height: 104,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    marginTop: 8,
  },
  myDiaryStack: {
    gap: 8,
    marginTop: 10,
  },
  myDiaryCard: {
    borderRadius: 8,
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 10,
  },
  myDiaryLabel: {
    color: '#0369A1',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 4,
  },
  myDiaryTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  myDiaryBody: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 17,
  },
  noDiaryText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
  },
  publishPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 8,
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 14,
    marginBottom: 22,
  },
  publishCopy: {
    flex: 1,
    minWidth: 0,
  },
  publishTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  publishText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  publishButton: {
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
  },
  publishButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  timelineSection: {
    marginTop: 2,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 14,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineList: {
    gap: 0,
  },
  timelineRail: {
    width: 28,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1E3A8A',
    marginTop: 8,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 140,
    backgroundColor: '#BFDBFE',
  },
  timelineCard: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
  },
  timelineTime: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  sourceStopBadge: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: '#E0F2FE',
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  timelineTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 7,
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 9,
  },
  visibilityBadge: {
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '900',
  },
  publicBadge: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  privateBadge: {
    backgroundColor: '#F1F5F9',
    color: '#475569',
  },
  visibilityButton: {
    minHeight: 32,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
  },
  visibilityButtonText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '900',
  },
  timelineBody: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 10,
  },
  timelineImage: {
    width: '100%',
    height: 170,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    marginBottom: 10,
  },
  locationText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyState: {
    minHeight: 210,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 22,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 42,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    marginTop: 14,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
