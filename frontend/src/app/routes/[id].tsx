import React, { useMemo } from 'react';
import {
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SHARED_ROUTE_SAMPLES } from '@/data/shared-routes';
import { importSharedRoute } from '@/services/imported-routes';
import type { SharedRoute, SharedRouteStopType } from '@/types/ridekorea';

const STOP_LABELS: Record<SharedRouteStopType, string> = {
  photo: '사진',
  repair: '수리',
  food: '식사',
  lodging: '숙박',
  scenic: '경치',
  transport: '교통',
  note: '메모',
};

function formatDuration(hours: number) {
  const roundedHours = Math.floor(hours);
  const minutes = Math.round((hours - roundedHours) * 60);

  if (minutes === 0) {
    return `${roundedHours}시간`;
  }

  return `${roundedHours}시간 ${minutes}분`;
}

function formatStopTime(value: string) {
  return new Date(value).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function importRoute(route: SharedRoute) {
  try {
    await importSharedRoute(route);
    Alert.alert(
      '내 루트에 추가됨',
      `${route.title} 루트를 My Path의 계획 초안에 저장했습니다.`,
      [
        { text: '계속 보기', style: 'cancel' },
        { text: 'My Path로 이동', onPress: () => router.push('/my-path' as never) },
      ],
    );
  } catch (err: any) {
    Alert.alert('저장 실패', err.message || '루트 초안을 저장하지 못했습니다.');
  }
}

export default function SharedRouteDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const route = useMemo(
    () => SHARED_ROUTE_SAMPLES.find((item) => item.id === params.id),
    [params.id],
  );

  if (!route) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundTitle}>루트를 찾을 수 없습니다</Text>
        <Text style={styles.notFoundText}>공유 목록으로 돌아가 다시 선택해 주세요.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <ImageBackground
          source={{ uri: route.coverImageUrl }}
          style={styles.hero}
          imageStyle={styles.heroImage}>
          <View style={styles.heroOverlay}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>

            <View style={styles.heroContent}>
              <Text style={styles.author}>
                {route.authorName}
                {route.authorCountry ? ` · ${route.authorCountry}` : ''}
              </Text>
              <Text style={styles.title}>{route.title}</Text>
              <Text style={styles.routeLine} numberOfLines={1}>
                {route.startName} to {route.endName}
              </Text>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.section}>
          <Text style={styles.summary}>{route.summary}</Text>

          <View style={styles.metricGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{route.distanceKm.toFixed(1)} km</Text>
              <Text style={styles.metricLabel}>총 거리</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{formatDuration(route.durationHours)}</Text>
              <Text style={styles.metricLabel}>라이딩 시간</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{route.stops.length}개</Text>
              <Text style={styles.metricLabel}>기록 스팟</Text>
            </View>
          </View>

          <View style={styles.socialRow}>
            <Text style={styles.socialText}>추천 {route.likeCount}</Text>
            <Text style={styles.socialText}>댓글 {route.commentCount}</Text>
            <Text style={styles.socialText}>공유 {route.shareCount}</Text>
          </View>
        </View>

        <View style={styles.mapPreview}>
          <View style={styles.mapHeader}>
            <Text style={styles.sectionTitle}>루트 감각</Text>
            <Text style={styles.mapDistance}>{route.distanceKm.toFixed(1)} km</Text>
          </View>
          <View style={styles.pathRail}>
            <View style={styles.pathDot} />
            <View style={styles.pathLine} />
            <View style={[styles.pathDot, styles.pathDotEnd]} />
          </View>
          <View style={styles.pathLabels}>
            <Text style={styles.pathLabel} numberOfLines={1}>
              {route.startName}
            </Text>
            <Text style={styles.pathLabel} numberOfLines={1}>
              {route.endName}
            </Text>
          </View>
        </View>

        {route.stayedPlaces.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>머문 곳</Text>
            <View style={styles.stayList}>
              {route.stayedPlaces.map((place) => (
                <View key={place} style={styles.stayItem}>
                  <Text style={styles.stayText}>{place}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>라이딩 기록</Text>
          <Text style={styles.sectionCopy}>
            출발부터 도착까지 실제로 도움이 되는 순간만 모았습니다.
          </Text>

          <View style={styles.timeline}>
            {route.stops.map((stop, index) => (
              <View key={stop.id} style={styles.timelineItem}>
                <View style={styles.timelineRail}>
                  <View style={styles.timelineDot} />
                  {index < route.stops.length - 1 && <View style={styles.timelineLine} />}
                </View>

                <View style={styles.timelineContent}>
                  <View style={styles.stopMetaRow}>
                    <Text style={styles.stopType}>{STOP_LABELS[stop.type]}</Text>
                    <Text style={styles.stopTime}>{formatStopTime(stop.createdAt)}</Text>
                  </View>
                  <Text style={styles.stopTitle}>{stop.title}</Text>
                  <Text style={styles.stopBody}>{stop.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.tags}>
          {route.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomCopy}>
          <Text style={styles.bottomTitle}>이 루트로 준비하기</Text>
          <Text style={styles.bottomMeta}>{route.startName} 출발</Text>
        </View>
        <TouchableOpacity style={styles.bottomButton} onPress={() => importRoute(route)}>
          <Text style={styles.bottomButtonText}>가져오기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 112,
  },
  hero: {
    height: 360,
    backgroundColor: '#CBD5E1',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 54,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  backButtonText: {
    color: '#0F172A',
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 34,
  },
  heroContent: {
    gap: 8,
  },
  author: {
    color: '#E0F2FE',
    fontSize: 13,
    fontWeight: '900',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
  },
  routeLine: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '800',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  summary: {
    color: '#334155',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    minHeight: 76,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
  },
  metricValue: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 5,
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  socialText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '800',
  },
  mapPreview: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
  },
  mapDistance: {
    color: '#0369A1',
    fontSize: 13,
    fontWeight: '900',
  },
  pathRail: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  pathDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0284C7',
  },
  pathDotEnd: {
    backgroundColor: '#10B981',
  },
  pathLine: {
    flex: 1,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#38BDF8',
  },
  pathLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 18,
    marginTop: 10,
  },
  pathLabel: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  stayList: {
    gap: 8,
    marginTop: 12,
  },
  stayItem: {
    minHeight: 46,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
  },
  stayText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionCopy: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 14,
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineRail: {
    width: 28,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0EA5E9',
    marginTop: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 92,
    backgroundColor: '#BAE6FD',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 22,
  },
  stopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  stopType: {
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '900',
  },
  stopTime: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
  },
  stopTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 5,
  },
  stopBody: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  tag: {
    borderRadius: 999,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '800',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  bottomCopy: {
    flex: 1,
    minWidth: 0,
  },
  bottomTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  bottomMeta: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },
  bottomButton: {
    minWidth: 112,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0F172A',
    paddingHorizontal: 18,
  },
  bottomButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  notFoundTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  notFoundText: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
    textAlign: 'center',
  },
  primaryButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0F172A',
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
