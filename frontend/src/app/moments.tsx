import { SharedRouteCard } from '@/components/routes/SharedRouteCard';
import { useAuthSession } from '@/context/AuthSessionContext';
import { SHARED_ROUTE_SAMPLES } from '@/data/shared-routes';
import { LANGUAGE_LABELS, momentsCopy, nextLanguage, t } from '@/i18n';
import {
  getPublicSharedRoutes,
  getRecentPublicDiaries,
  importPublicSharedRoute,
  mediaUrl,
} from '@/services/api';
import { importSharedRoute } from '@/services/imported-routes';
import type { AppLanguage, Diary, PublishedSharedRoute, SharedRoute } from '@/types/ridekorea';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type FeedMode = 'routes' | 'diaries';

function formatDate(value: string, lang: AppLanguage) {
  const locale = lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'ko-KR';
  return new Date(value).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  });
}

function toSharedRouteCardModel(route: PublishedSharedRoute, lang: AppLanguage): SharedRoute {
  const stops = [...route.stops].sort((a, b) => a.sort_order - b.sort_order);
  const coverImageUrl = stops.find((stop) => stop.photo_urls?.[0])?.photo_urls?.[0];

  return {
    id: route.id,
    title: route.title,
    authorName: route.author?.display_name || 'RideKorea Rider',
    summary: route.summary || t(lang, momentsCopy.defaultRouteSummary),
    startName: route.start_name || t(lang, momentsCopy.unknownStart),
    endName: route.end_name || t(lang, momentsCopy.unknownEnd),
    distanceKm: 0,
    durationHours: 0,
    stayedPlaces: [],
    likeCount: route.like_count,
    commentCount: route.comment_count,
    shareCount: route.share_count,
    likedByMe: route.liked_by_me,
    coverImageUrl: coverImageUrl ? mediaUrl(coverImageUrl) : undefined,
    tags: [
      t(lang, momentsCopy.riderShared),
      route.visibility === 'public' ? t(lang, momentsCopy.publicRoute) : t(lang, momentsCopy.draft),
    ],
    stops: stops.map((stop) => ({
      id: stop.id,
      title: stop.title,
      body: stop.body || '',
      type: 'note',
      location: stop.location || { lat: 0, lng: 0 },
      photoUrl: stop.photo_urls?.[0] ? mediaUrl(stop.photo_urls[0]) : undefined,
      createdAt: stop.created_at,
    })),
  };
}

export default function MomentsScreen() {
  const { token } = useAuthSession();
  const [lang, setLang] = useState<AppLanguage>('ko');
  const [feedMode, setFeedMode] = useState<FeedMode>('routes');
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [publicRoutes, setPublicRoutes] = useState<PublishedSharedRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMoments = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      setError(null);
      const [routesData, diaryData] = await Promise.all([
        getPublicSharedRoutes(30, token),
        getRecentPublicDiaries(40),
      ]);
      setPublicRoutes(routesData);
      setDiaries(diaryData);
    } catch (err: any) {
      setError(err.message || t(lang, momentsCopy.publicRecordLoadFailed));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [lang, token]);

  const handleImportRoute = useCallback(async (route: SharedRoute) => {
    try {
      const isSampleRoute = SHARED_ROUTE_SAMPLES.some((sample) => sample.id === route.id);
      if (isSampleRoute) {
        await importSharedRoute(route);
        Alert.alert(
          t(lang, momentsCopy.routeAddedTitle),
          `${route.title} ${t(lang, momentsCopy.routeAddedBody)}`,
          [
            { text: t(lang, momentsCopy.keepBrowsing), style: 'cancel' },
            { text: t(lang, momentsCopy.goToMyPath), onPress: () => router.push('/my-path' as never) },
          ],
        );
        return;
      }

      if (!token) {
        Alert.alert(
          t(lang, momentsCopy.loginRequiredTitle),
          t(lang, momentsCopy.loginRequiredBody),
        );
        return;
      }

      const journey = await importPublicSharedRoute(token, route.id);
      Alert.alert(
        t(lang, momentsCopy.routeAddedTitle),
        `${route.title} ${t(lang, momentsCopy.routeAddedBody)}`,
        [
          { text: t(lang, momentsCopy.keepBrowsing), style: 'cancel' },
          {
            text: t(lang, momentsCopy.openJourney),
            onPress: () => router.push(`/journeys/${journey.id}` as never),
          },
        ],
      );
    } catch (err: any) {
      Alert.alert(t(lang, momentsCopy.saveFailed), err.message || t(lang, momentsCopy.saveFailedBody));
    }
  }, [lang, token]);

  const handleOpenRoute = useCallback((route: SharedRoute) => {
    const isSampleRoute = SHARED_ROUTE_SAMPLES.some((sample) => sample.id === route.id);
    router.push((isSampleRoute ? `/routes/${route.id}` : `/shared-routes/${route.id}`) as never);
  }, []);

  const handleOpenDiaryOnMap = useCallback((diary: Diary) => {
    router.push(`/?publicDiaryId=${diary.id}` as never);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadMoments();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadMoments]);

  const isDiaryMode = feedMode === 'diaries';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => loadMoments('refresh')}
          enabled={isDiaryMode}
        />
      }>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.eyebrow}>Moments</Text>
          <TouchableOpacity style={styles.langButton} onPress={() => setLang(prev => nextLanguage(prev))}>
            <Text style={styles.langButtonText}>{LANGUAGE_LABELS[nextLanguage(lang)]}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>{t(lang, momentsCopy.title)}</Text>
        <Text style={styles.copy}>
          {t(lang, momentsCopy.copy)}
        </Text>
      </View>

      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segmentButton, feedMode === 'routes' && styles.segmentButtonActive]}
          onPress={() => setFeedMode('routes')}>
          <Text
            style={[
              styles.segmentButtonText,
              feedMode === 'routes' && styles.segmentButtonTextActive,
            ]}>
            {t(lang, momentsCopy.sharedRoutes)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentButton, feedMode === 'diaries' && styles.segmentButtonActive]}
          onPress={() => setFeedMode('diaries')}>
          <Text
            style={[
              styles.segmentButtonText,
              feedMode === 'diaries' && styles.segmentButtonTextActive,
            ]}>
            {t(lang, momentsCopy.publicDiaries)}
          </Text>
        </TouchableOpacity>
      </View>

      {feedMode === 'routes' ? (
        isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#0EA5E9" />
            <Text style={styles.emptyText}>{t(lang, momentsCopy.loadingRoutes)}</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t(lang, momentsCopy.routeLoadFailed)}</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadMoments()}>
              <Text style={styles.retryButtonText}>{t(lang, momentsCopy.retry)}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.feedList}>
            {publicRoutes.map((route) => (
              <SharedRouteCard
                key={route.id}
                route={toSharedRouteCardModel(route, lang)}
                onImport={handleImportRoute}
                onOpen={handleOpenRoute}
              />
            ))}
            {SHARED_ROUTE_SAMPLES.map((route) => (
              <SharedRouteCard
                key={route.id}
                route={route}
                onImport={handleImportRoute}
                onOpen={handleOpenRoute}
              />
            ))}
          </View>
        )
      ) : isLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <Text style={styles.emptyText}>{t(lang, momentsCopy.loadingDiaries)}</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{t(lang, momentsCopy.diaryLoadFailed)}</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadMoments()}>
            <Text style={styles.retryButtonText}>{t(lang, momentsCopy.retry)}</Text>
          </TouchableOpacity>
        </View>
      ) : diaries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{t(lang, momentsCopy.emptyDiariesTitle)}</Text>
          <Text style={styles.emptyText}>
            {t(lang, momentsCopy.emptyDiariesBody)}
          </Text>
        </View>
      ) : (
        <View style={styles.feedList}>
          {diaries.map((diary) => {
            const photoUrl = diary.photo_urls?.[0];
            const author = diary.user?.display_name || t(lang, momentsCopy.anonymousRider);

            return (
              <View key={diary.id} style={styles.feedCard}>
                {photoUrl && (
                  <Image source={{ uri: mediaUrl(photoUrl) }} style={styles.feedImage} />
                )}

                <View style={styles.feedBody}>
                  <View style={styles.feedMetaRow}>
                    <View style={styles.authorRow}>
                      {diary.user?.profile_photo_url ? (
                        <Image
                          source={{ uri: diary.user.profile_photo_url }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View style={styles.avatarFallback} />
                      )}
                      <Text style={styles.authorName} numberOfLines={1}>
                        {author}
                      </Text>
                    </View>
                    <Text style={styles.feedDate}>{formatDate(diary.created_at, lang)}</Text>
                  </View>

                  <Text style={styles.feedTitle} numberOfLines={2}>
                    {diary.title || t(lang, momentsCopy.untitledDiary)}
                  </Text>
                  <Text style={styles.feedText} numberOfLines={4}>
                    {diary.diary_text || t(lang, momentsCopy.emptyDiaryText)}
                  </Text>
                  {diary.lat && diary.lng && (
                    <Text style={styles.locationText}>
                      {diary.lat.toFixed(5)}, {diary.lng.toFixed(5)}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.mapButton}
                    onPress={() => handleOpenDiaryOnMap(diary)}>
                    <Text style={styles.mapButtonText}>{t(lang, momentsCopy.viewOnMap)}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
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
    paddingTop: 56,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  eyebrow: {
    color: '#0EA5E9',
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
    backgroundColor: '#E0F2FE',
  },
  langButtonText: {
    color: '#0369A1',
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
  segmentedControl: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    marginBottom: 18,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  segmentButton: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentButtonText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '900',
  },
  segmentButtonTextActive: {
    color: '#0F172A',
  },
  emptyState: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
  feedList: {
    gap: 14,
  },
  feedCard: {
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  feedImage: {
    width: '100%',
    height: 210,
    backgroundColor: '#E2E8F0',
  },
  feedBody: {
    padding: 14,
  },
  feedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  authorRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 8,
  },
  avatarFallback: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 8,
    backgroundColor: '#CBD5E1',
  },
  authorName: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  feedDate: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  feedTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 7,
  },
  feedText: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 21,
  },
  locationText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 10,
  },
  mapButton: {
    alignSelf: 'flex-start',
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    marginTop: 12,
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
