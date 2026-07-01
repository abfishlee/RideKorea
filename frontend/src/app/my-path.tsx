import { useAuthSession } from '@/context/AuthSessionContext';
import { LANGUAGE_LABELS, myPathCopy, nextLanguage, t } from '@/i18n';
import { getJourneyTrackPoints, getMyJourneys } from '@/services/api';
import { getImportedRouteDrafts, removeImportedRouteDraft } from '@/services/imported-routes';
import type { AppLanguage, ImportedRouteDraft, Journey, JourneyTrackPoint } from '@/types/ridekorea';
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

function formatDate(value: string | null | undefined, lang: AppLanguage) {
  if (!value) return t(lang, myPathCopy.noDate);
  const locale = lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'ko-KR';
  return new Date(value).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatPlannedDuration(hours: number, lang: AppLanguage) {
  if (hours <= 0) return t(lang, myPathCopy.noRecord);

  const roundedHours = Math.floor(hours);
  const minutes = Math.round((hours - roundedHours) * 60);
  const hourLabel = lang === 'ko' ? '시간' : lang === 'ja' ? '時間' : 'h';
  const minuteLabel = lang === 'ko' ? '분' : lang === 'ja' ? '分' : 'm';

  if (roundedHours <= 0) return `${minutes}${minuteLabel}`;
  if (minutes === 0) return `${roundedHours}${hourLabel}`;
  return `${roundedHours}${hourLabel} ${minutes}${minuteLabel}`;
}

function formatTrackDuration(totalSeconds: number, lang: AppLanguage) {
  if (totalSeconds <= 0) return t(lang, myPathCopy.noRecord);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const hourLabel = lang === 'ko' ? '시간' : lang === 'ja' ? '時間' : 'h';
  const minuteLabel = lang === 'ko' ? '분' : lang === 'ja' ? '分' : 'm';
  if (hours <= 0) return `${minutes}${minuteLabel}`;
  if (minutes <= 0) return `${hours}${hourLabel}`;
  return `${hours}${hourLabel} ${minutes}${minuteLabel}`;
}

function formatDistance(distanceKm: number, lang: AppLanguage) {
  if (distanceKm <= 0) return t(lang, myPathCopy.noRecord);
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

function statusLabel(status: string | undefined, lang: AppLanguage) {
  switch (status) {
    case 'completed':
      return t(lang, myPathCopy.completed);
    case 'riding':
      return t(lang, myPathCopy.riding);
    case 'paused':
      return t(lang, myPathCopy.paused);
    case 'planning':
      return t(lang, myPathCopy.planning);
    default:
      return t(lang, myPathCopy.record);
  }
}

function journeySourceLabel(journey: Journey, lang: AppLanguage) {
  return journey.source_shared_route_id ? t(lang, myPathCopy.importedRoutes) : statusLabel(journey.status, lang);
}

export default function MyPathScreen() {
  const { token, isAuthChecked } = useAuthSession();
  const [lang, setLang] = useState<AppLanguage>('ko');
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
      setError(err.message || t(lang, myPathCopy.loadFailedBody));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthChecked, lang, token]);

  const handleRemoveDraft = useCallback((draft: ImportedRouteDraft) => {
    Alert.alert(t(lang, myPathCopy.deleteDraftTitle), `${draft.title} ${t(lang, myPathCopy.deleteDraftBody)}`, [
      { text: t(lang, myPathCopy.cancel), style: 'cancel' },
      {
        text: t(lang, myPathCopy.delete),
        style: 'destructive',
        onPress: async () => {
          const nextDrafts = await removeImportedRouteDraft(draft.id);
          setDrafts(nextDrafts);
        },
      },
    ]);
  }, [lang]);

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
        <View style={styles.headerTopRow}>
          <Text style={styles.eyebrow}>My Path</Text>
          <TouchableOpacity style={styles.langButton} onPress={() => setLang(prev => nextLanguage(prev))}>
            <Text style={styles.langButtonText}>{LANGUAGE_LABELS[nextLanguage(lang)]}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>{t(lang, myPathCopy.title)}</Text>
        <Text style={styles.copy}>
          {t(lang, myPathCopy.copy)}
        </Text>
      </View>

      {!isAuthChecked || isLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.emptyText}>{t(lang, myPathCopy.loading)}</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{t(lang, myPathCopy.loadFailed)}</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadData()}>
            <Text style={styles.retryButtonText}>{t(lang, myPathCopy.retry)}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>{t(lang, myPathCopy.totalRoutes)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.completed}</Text>
              <Text style={styles.statLabel}>{t(lang, myPathCopy.completedRecords)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatDistance(stats.recordedDistanceKm, lang)}</Text>
              <Text style={styles.statLabel}>{t(lang, myPathCopy.recordedDistance)}</Text>
            </View>
          </View>

          {drafts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t(lang, myPathCopy.importedRoutes)}</Text>
                <Text style={styles.sectionMeta}>{t(lang, myPathCopy.startPlan)}</Text>
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
                        <Text style={styles.planBadgeText}>{t(lang, myPathCopy.plan)}</Text>
                      </View>
                    </View>

                    <Text style={styles.routeLine} numberOfLines={1}>
                      {draft.startName} to {draft.endName}
                    </Text>

                    <View style={styles.metaGrid}>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>{t(lang, myPathCopy.distance)}</Text>
                        <Text style={styles.metaValue}>{draft.distanceKm.toFixed(1)} km</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>{t(lang, myPathCopy.plannedTime)}</Text>
                        <Text style={styles.metaValue}>{formatPlannedDuration(draft.durationHours, lang)}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Text style={styles.metaLabel}>{t(lang, myPathCopy.stops)}</Text>
                        <Text style={styles.metaValue}>{draft.stopCount.toLocaleString(lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : 'ko-KR')}</Text>
                      </View>
                    </View>

                    <View style={styles.draftFooter}>
                      <Text style={styles.importedDate}>
                        {formatDate(draft.importedAt, lang)} {t(lang, myPathCopy.imported)}
                      </Text>
                      <TouchableOpacity
                        style={styles.prepareButton}
                        onPress={() => router.push(`/?draftId=${draft.id}` as never)}>
                        <Text style={styles.prepareButtonText}>{t(lang, myPathCopy.prepareInJourney)}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveDraft(draft)}>
                        <Text style={styles.removeButtonText}>{t(lang, myPathCopy.delete)}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {!token ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{t(lang, myPathCopy.loginRequiredTitle)}</Text>
              <Text style={styles.emptyText}>
                {t(lang, myPathCopy.loginRequiredBody)}
              </Text>
            </View>
          ) : journeys.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{t(lang, myPathCopy.emptyJourneyTitle)}</Text>
              <Text style={styles.emptyText}>
                {t(lang, myPathCopy.emptyJourneyBody)}
              </Text>
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t(lang, myPathCopy.myRideRecords)}</Text>
                <Text style={styles.sectionMeta}>{t(lang, myPathCopy.detailedTimeline)}</Text>
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
                          <Text style={styles.statusText}>{journeySourceLabel(journey, lang)}</Text>
                        </View>
                      </View>

                      <View style={styles.summaryBadgeRow}>
                        <View style={styles.summaryBadge}>
                          <Text style={styles.summaryBadgeValue}>{formatDistance(summary.distanceKm, lang)}</Text>
                          <Text style={styles.summaryBadgeLabel}>{t(lang, myPathCopy.distance)}</Text>
                        </View>
                        <View style={styles.summaryBadge}>
                          <Text style={styles.summaryBadgeValue}>
                            {formatTrackDuration(summary.durationSeconds, lang)}
                          </Text>
                          <Text style={styles.summaryBadgeLabel}>{t(lang, myPathCopy.time)}</Text>
                        </View>
                        <View style={[styles.summaryBadge, hasTrack && styles.summaryBadgeReady]}>
                          <Text style={styles.summaryBadgeValue}>
                            {summary.pointCount.toLocaleString(lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : 'ko-KR')}
                          </Text>
                          <Text style={styles.summaryBadgeLabel}>GPS</Text>
                        </View>
                      </View>

                      <View style={styles.metaGrid}>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>{t(lang, myPathCopy.createdAt)}</Text>
                          <Text style={styles.metaValue}>{formatDate(journey.created_at, lang)}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>{t(lang, myPathCopy.completedAt)}</Text>
                          <Text style={styles.metaValue}>{formatDate(journey.completed_at, lang)}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>{t(lang, myPathCopy.diaries)}</Text>
                          <Text style={styles.metaValue}>{diaries.length.toLocaleString(lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : 'ko-KR')}</Text>
                        </View>
                      </View>

                      {summary.offRouteCount > 0 && (
                        <Text style={styles.offRouteHint}>
                          {summary.offRouteCount.toLocaleString(lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : 'ko-KR')} {t(lang, myPathCopy.offRouteHint)}
                        </Text>
                      )}

                      <View style={styles.previewPanel}>
                        <Text style={styles.previewLabel}>{t(lang, myPathCopy.recentTimeline)}</Text>
                        <Text style={styles.previewText} numberOfLines={2}>
                          {firstDiary?.title || firstDiary?.diary_text || t(lang, myPathCopy.noDiaryYet)}
                        </Text>
                      </View>

                      {journey.source_shared_route_id && (
                        <TouchableOpacity
                          style={styles.prepareServerButton}
                          onPress={(event) => {
                            event.stopPropagation();
                            router.push(`/?journeyId=${journey.id}` as never);
                          }}>
                          <Text style={styles.prepareServerButtonText}>{t(lang, myPathCopy.prepareInJourney)}</Text>
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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  eyebrow: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  langButton: {
    minWidth: 40,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
  },
  langButtonText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '900',
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
