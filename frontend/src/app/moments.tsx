import { SharedRouteCard } from '@/components/routes/SharedRouteCard';
import { useAuthSession } from '@/context/AuthSessionContext';
import { SHARED_ROUTE_SAMPLES } from '@/data/shared-routes';
import {
  getPublicSharedRoutes,
  getRecentPublicDiaries,
  importPublicSharedRoute,
  mediaUrl,
} from '@/services/api';
import { importSharedRoute } from '@/services/imported-routes';
import type { Diary, PublishedSharedRoute, SharedRoute } from '@/types/ridekorea';
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

function toSharedRouteCardModel(route: PublishedSharedRoute): SharedRoute {
  const stops = [...route.stops].sort((a, b) => a.sort_order - b.sort_order);
  const coverImageUrl = stops.find((stop) => stop.photo_urls?.[0])?.photo_urls?.[0];

  return {
    id: route.id,
    title: route.title,
    authorName: route.author?.display_name || 'RideKorea Rider',
    summary: route.summary || '라이더가 직접 남긴 사진과 메모로 구성한 공유 루트입니다.',
    startName: route.start_name || '출발지 미정',
    endName: route.end_name || '도착지 미정',
    distanceKm: 0,
    durationHours: 0,
    stayedPlaces: [],
    likeCount: route.like_count,
    commentCount: route.comment_count,
    shareCount: route.share_count,
    likedByMe: route.liked_by_me,
    coverImageUrl: coverImageUrl ? mediaUrl(coverImageUrl) : undefined,
    tags: ['라이더 공유', route.visibility === 'public' ? '공개 루트' : '초안'],
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
      setError(err.message || '공개 기록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  const handleImportRoute = useCallback(async (route: SharedRoute) => {
    try {
      const isSampleRoute = SHARED_ROUTE_SAMPLES.some((sample) => sample.id === route.id);
      if (isSampleRoute) {
        await importSharedRoute(route);
        Alert.alert(
          '루트 추가 완료',
          `${route.title} 루트를 My Path의 Journey 계획으로 저장했습니다.`,
          [
            { text: '계속 보기', style: 'cancel' },
            { text: 'My Path로 이동', onPress: () => router.push('/my-path' as never) },
          ],
        );
        return;
      }

      if (!token) {
        Alert.alert(
          '로그인이 필요합니다',
          '공개 루트를 내 Journey 계획으로 가져오려면 먼저 Google 로그인을 완료해 주세요.',
        );
        return;
      }

      const journey = await importPublicSharedRoute(token, route.id);
      Alert.alert(
        '루트 추가 완료',
        `${route.title} 루트를 내 Journey 계획으로 저장했습니다.`,
        [
          { text: '계속 보기', style: 'cancel' },
          {
            text: 'Journey 열기',
            onPress: () => router.push(`/journeys/${journey.id}` as never),
          },
        ],
      );
    } catch (err: any) {
      Alert.alert('저장 실패', err.message || '루트 초안을 저장하지 못했습니다.');
    }
  }, [token]);

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
        <Text style={styles.eyebrow}>Moments</Text>
        <Text style={styles.title}>라이더들이 남긴 한국 종단의 조각들</Text>
        <Text style={styles.copy}>
          공식 코스만으로 부족한 수리점, 동선, 맛집, 교통 정보를 실제 라이더의 루트와 일지로 확인합니다.
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
            공유 루트
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
            공개 일지
          </Text>
        </TouchableOpacity>
      </View>

      {feedMode === 'routes' ? (
        isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#0EA5E9" />
            <Text style={styles.emptyText}>공유 루트를 불러오는 중입니다.</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>공유 루트를 불러오지 못했습니다</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadMoments()}>
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.feedList}>
            {publicRoutes.map((route) => (
              <SharedRouteCard
                key={route.id}
                route={toSharedRouteCardModel(route)}
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
          <Text style={styles.emptyText}>공개 기록을 불러오는 중입니다.</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>피드를 불러오지 못했습니다</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadMoments()}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : diaries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>아직 공개된 라이딩 기록이 없습니다</Text>
          <Text style={styles.emptyText}>
            Journey에서 스팟을 인증하고 일지를 공개하면 여기에 모입니다.
          </Text>
        </View>
      ) : (
        <View style={styles.feedList}>
          {diaries.map((diary) => {
            const photoUrl = diary.photo_urls?.[0];
            const author = diary.user?.display_name || 'Anonymous Rider';

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
                    <Text style={styles.feedDate}>{formatDate(diary.created_at)}</Text>
                  </View>

                  <Text style={styles.feedTitle} numberOfLines={2}>
                    {diary.title || '제목 없는 라이딩 기록'}
                  </Text>
                  <Text style={styles.feedText} numberOfLines={4}>
                    {diary.diary_text || '아직 본문이 없는 공개 기록입니다.'}
                  </Text>
                  {diary.lat && diary.lng && (
                    <Text style={styles.locationText}>
                      {diary.lat.toFixed(5)}, {diary.lng.toFixed(5)}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.mapButton}
                    onPress={() => handleOpenDiaryOnMap(diary)}>
                    <Text style={styles.mapButtonText}>지도에서 보기</Text>
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
  eyebrow: {
    color: '#0EA5E9',
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
