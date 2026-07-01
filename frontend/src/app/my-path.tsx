import { useAuthSession } from '@/context/AuthSessionContext';
import { getJourneyTrackPoints, getMyJourneys } from '@/services/api';
import { getImportedRouteDrafts, removeImportedRouteDraft } from '@/services/imported-routes';
import type { ImportedRouteDraft, Journey, JourneyTrackPoint } from '@/types/ridekorea';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface JourneyListSummary {
  distanceKm: number;
  durationSeconds: number;
  pointCount: number;
  offRouteCount: number;
}

function formatDate(value?: string | null) {
  if (!value) return '날짜 없음';
  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatPlannedDuration(hours: number) {
  if (hours <= 0) return '기록 없음';

  const roundedHours = Math.floor(hours);
  const minutes = Math.round((hours - roundedHours) * 60);

  if (roundedHours <= 0) return `${minutes}분`;
  if (minutes === 0) return `${roundedHours}시간`;
  return `${roundedHours}시간 ${minutes}분`;
}

function formatTrackDuration(totalSeconds: number) {
  if (totalSeconds <= 0) return '기록 없음';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours <= 0) return `${minutes}분`;
  if (minutes <= 0) return `${hours}시간`;
  return `${hours}시간 ${minutes}분`;
}

function formatDistance(distanceKm: number) {
  if (distanceKm <= 0) return '기록 없음';
  if (distanceKm < 10) return `${distanceKm.toFixed(2)} km`;
  return `${distanceKm.toFixed(1)} km`;
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

function summarizeTrack(points: JourneyTrackPoint[]): JourneyListSummary {
  if (points.length === 0) {
    return {
      distanceKm: 0,
      durationSeconds: 0,
      pointCount: 0,
      offRouteCount: 0,
    };
  }

  const sortedPoints = [...points].sort((a, b) => (
    new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  ));
  const distanceKm = sortedPoints.reduce((sum, point, index) => {
    if (index === 0) return sum;
    const segmentKm = distanceKmBetween(sortedPoints[index - 1], point);
    return segmentKm < 1 ? sum + segmentKm : sum;
  }, 0);
  const firstTime = new Date(sortedPoints[0].recorded_at).getTime();
  const lastTime = new Date(sortedPoints[sortedPoints.length - 1].recorded_at).getTime();

  return {
    distanceKm,
    durationSeconds: Math.max(0, Math.floor((lastTime - firstTime) / 1000)),
    pointCount: sortedPoints.length,
    offRouteCount: sortedPoints.filter((point) => point.is_off_route).length,
  };
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

function journeySourceLabel(journey: Journey) {
  return journey.source_shared_route_id ? '가져온 루트' : statusLabel(journey.status);
}

export default function MyPathScreen() {
  const { token, isAuthChecked } = useAuthSession();
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [drafts, setDrafts] = useState<ImportedRouteDraft[]>([]);
  const [journeySummaries, setJourneySummaries] = useState<Record<string, JourneyListSummary>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const completed = journeys.filter((journey) => journey.status === 'completed').length;
    const diaries = journeys.reduce((sum, journey) => sum + (journey.diaries?.length || 0), 0);
    const importedJourneys = journeys.filter((journey) => journey.source_shared_route_id).length;
    const recordedDistanceKm = Object.values(journeySummaries).reduce(
      (sum, summary) => sum + summary.distanceKm,
      0,
    );

    return {
      total: journeys.length + drafts.length,
      completed,
      plans: drafts.length + importedJourneys,
      diaries,
      recordedDistanceKm,
    };
  }, [drafts.length, journeySummaries, journeys]);

  const loadData = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (!isAuthChecked) return;
    if (mode === 'refresh') {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      setError(null);
      const importedDrafts = await getImportedRouteDrafts();
      setDrafts(importedDrafts);

      if (!token) {
        setJourneys([]);
        setJourneySummaries({});
        return;
      }

      const data = await getMyJourneys(token);
      setJourneys(data);

      const summaries = await Promise.all(
        data.map(async (journey) => {
          try {
            const points = await getJourneyTrackPoints(token, journey.id);
            return [journey.id, summarizeTrack(points)] as const;
          } catch {
            return [journey.id, summarizeTrack([])] as const;
          }
        }),
      );
      setJourneySummaries(Object.fromEntries(summaries));
    } catch (err: any) {
      setError(err.message || '내 종주 기록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthChecked, token]);

  const handleRemoveDraft = useCallback((draft: ImportedRouteDraft) => {
    Alert.alert('초안 삭제', `${draft.title} 루트 초안을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          const nextDrafts = await removeImportedRouteDraft(draft.id);
          setDrafts(nextDrafts);
        },
      },
    ]);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadData]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => loadData('refresh')} />
      }>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>My Path</Text>
        <Text style={styles.title}>준비 중인 길과 내가 남긴 기록</Text>
        <Text style={styles.copy}>
          가져온 공유 루트, 진행 중인 종주, 완료한 기록을 한곳에서 확인합니다.
        </Text>
      </View>

      {!isAuthChecked || isLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.emptyText}>내 기록을 불러오는 중입니다.</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>기록을 불러오지 못했습니다</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadData()}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>전체 경로</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.completed}</Text>
              <Text style={styles.statLabel}>완료 기록</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatDistance(stats.recordedDistanceKm)}</Text>
              <Text style={styles.statLabel}>기록 거리</Text>
            </View>
          </View>

          {drafts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>가져온 루트</Text>
                <Text style={styles.sectionMeta}>출발 전 계획</Text>
              </View>

              <View style={styles.list}>
                {drafts.map((draft) => (
                  <View key={draft.id} style={styles.draftCard}>
                    <View style={styles.cardTopRow}>
                      <View style={styles.cardTitleBlock}>
                        <Text style={styles.journeyTitle} numberOfLines={2}>
                          {draft.title}
                        </Text>
                        <Text style={styles.draftAuthor}>from {draft.authorName}</Text>
                      </View>
                      <View style={styles.planBadge}>
                        <Text style={styles.planBadgeText}>계획</Text>
                      </View>
                    </View>

                    <Text style={styles.routeLine} numberOfLines={1}>
                      {draft.startName} to {draft.endName}
                    </Text>

                    <View style={styles.metaGrid}>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>거리</Text>
                        <Text style={styles.metaValue}>{draft.distanceKm.toFixed(1)} km</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>예상 시간</Text>
                        <Text style={styles.metaValue}>{formatPlannedDuration(draft.durationHours)}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>스팟</Text>
                        <Text style={styles.metaValue}>{draft.stopCount}개</Text>
                      </View>
                    </View>

                    <View style={styles.draftFooter}>
                      <Text style={styles.importedDate}>
                        {formatDate(draft.importedAt)} 가져옴
                      </Text>
                      <TouchableOpacity
                        style={styles.prepareButton}
                        onPress={() => router.push(`/?draftId=${draft.id}` as never)}>
                        <Text style={styles.prepareButtonText}>Journey에서 준비</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveDraft(draft)}>
                        <Text style={styles.removeButtonText}>삭제</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {!token ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>로그인이 필요합니다</Text>
              <Text style={styles.emptyText}>
                Journey 탭에서 Google 로그인을 완료하면 실제 종주 기록을 볼 수 있습니다.
              </Text>
            </View>
          ) : journeys.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>아직 시작한 종주가 없습니다</Text>
              <Text style={styles.emptyText}>
                Journey 탭에서 코스를 선택하고 종주 기록을 시작해보세요.
              </Text>
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>내 주행 기록</Text>
                <Text style={styles.sectionMeta}>상세 타임라인</Text>
              </View>

              <View style={styles.list}>
                {journeys.map((journey) => {
                  const diaries = journey.diaries || [];
                  const firstDiary = diaries[0];
                  const summary = journeySummaries[journey.id] || summarizeTrack([]);
                  const hasTrack = summary.pointCount > 0;

                  return (
                    <TouchableOpacity
                      key={journey.id}
                      style={styles.journeyCard}
                      activeOpacity={0.86}
                      onPress={() => router.push(`/journeys/${journey.id}` as never)}>
                      <View style={styles.cardTopRow}>
                        <Text style={styles.journeyTitle} numberOfLines={1}>
                          {journey.title}
                        </Text>
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusText}>{journeySourceLabel(journey)}</Text>
                        </View>
                      </View>

                      <View style={styles.summaryBadgeRow}>
                        <View style={styles.summaryBadge}>
                          <Text style={styles.summaryBadgeValue}>{formatDistance(summary.distanceKm)}</Text>
                          <Text style={styles.summaryBadgeLabel}>거리</Text>
                        </View>
                        <View style={styles.summaryBadge}>
                          <Text style={styles.summaryBadgeValue}>
                            {formatTrackDuration(summary.durationSeconds)}
                          </Text>
                          <Text style={styles.summaryBadgeLabel}>시간</Text>
                        </View>
                        <View style={[styles.summaryBadge, hasTrack && styles.summaryBadgeReady]}>
                          <Text style={styles.summaryBadgeValue}>
                            {summary.pointCount.toLocaleString('ko-KR')}개
                          </Text>
                          <Text style={styles.summaryBadgeLabel}>GPS</Text>
                        </View>
                      </View>

                      <View style={styles.metaGrid}>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>생성일</Text>
                          <Text style={styles.metaValue}>{formatDate(journey.created_at)}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>완료일</Text>
                          <Text style={styles.metaValue}>{formatDate(journey.completed_at)}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>일지</Text>
                          <Text style={styles.metaValue}>{diaries.length}개</Text>
                        </View>
                      </View>

                      {summary.offRouteCount > 0 && (
                        <Text style={styles.offRouteHint}>
                          루트 이탈 포인트 {summary.offRouteCount.toLocaleString('ko-KR')}개가 기록되었습니다.
                        </Text>
                      )}

                      <View style={styles.previewPanel}>
                        <Text style={styles.previewLabel}>최근 타임라인</Text>
                        <Text style={styles.previewText} numberOfLines={2}>
                          {firstDiary?.title || firstDiary?.diary_text || '아직 기록된 일지가 없습니다.'}
                        </Text>
                      </View>

                      {journey.source_shared_route_id && (
                        <TouchableOpacity
                          style={styles.prepareServerButton}
                          onPress={(event) => {
                            event.stopPropagation();
                            router.push(`/?journeyId=${journey.id}` as never);
                          }}>
                          <Text style={styles.prepareServerButtonText}>Journey에서 준비</Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </>
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
    paddingTop: 56,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 20,
  },
  eyebrow: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#0F172A',
    fontSize: 25,
    fontWeight: '900',
    lineHeight: 32,
    marginBottom: 8,
  },
  copy: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    minHeight: 76,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  statValue: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
  },
  sectionMeta: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
  },
  list: {
    gap: 12,
  },
  draftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 14,
  },
  journeyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  cardTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  journeyTitle: {
    flex: 1,
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 21,
  },
  draftAuthor: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  planBadge: {
    backgroundColor: '#E0F2FE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  planBadgeText: {
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '900',
  },
  statusBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '900',
  },
  routeLine: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 12,
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  summaryBadge: {
    flex: 1,
    minHeight: 58,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
  },
  summaryBadgeReady: {
    borderColor: '#BAE6FD',
    backgroundColor: '#ECFEFF',
  },
  summaryBadgeValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 3,
  },
  summaryBadgeLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '900',
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  metaItem: {
    flex: 1,
    minWidth: 0,
  },
  metaLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 3,
  },
  metaValue: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
  },
  offRouteHint: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
    marginBottom: 10,
  },
  draftFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  importedDate: {
    flex: 1,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },
  prepareButton: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
  },
  prepareButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  removeButton: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
  },
  removeButtonText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '900',
  },
  previewPanel: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  previewLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 5,
  },
  previewText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
  },
  prepareServerButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0F172A',
    marginTop: 12,
  },
  prepareServerButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
