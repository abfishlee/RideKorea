import type { AppLanguage, TravelPoi } from '@/types/ridekorea';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NearbyTravelPoiPanelProps {
  lang: AppLanguage;
  pois: TravelPoi[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}

const CATEGORY_META: Record<string, { ko: string; en: string; color: string; background: string }> = {
  repair: { ko: '수리', en: 'Repair', color: '#B45309', background: '#FEF3C7' },
  food: { ko: '맛집', en: 'Food', color: '#BE123C', background: '#FFE4E6' },
  lodging: { ko: '숙소', en: 'Lodging', color: '#6D28D9', background: '#EDE9FE' },
  scenic: { ko: '경치', en: 'Scenic', color: '#047857', background: '#D1FAE5' },
  transport: { ko: '교통', en: 'Transport', color: '#1D4ED8', background: '#DBEAFE' },
  culture: { ko: '문화', en: 'Culture', color: '#0F766E', background: '#CCFBF1' },
};

function getPoiName(poi: TravelPoi, isKo: boolean) {
  return isKo ? poi.name : poi.name_en || poi.name;
}

function getPoiDescription(poi: TravelPoi, isKo: boolean) {
  return isKo ? poi.description : poi.description_en || poi.description;
}

function getCategoryLabel(category: string, isKo: boolean) {
  const meta = CATEGORY_META[category] || CATEGORY_META.scenic;
  return isKo ? meta.ko : meta.en;
}

export function NearbyTravelPoiPanel({
  lang,
  pois,
  isLoading,
  error,
  onClose,
  onRetry,
}: NearbyTravelPoiPanelProps) {
  const isKo = lang === 'ko';

  return (
    <View style={styles.sheet}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.badge}>{isKo ? '주변 여행 정보' : 'Nearby travel info'}</Text>
          <Text style={styles.title}>
            {isKo ? '지금 필요한 장소를 빠르게 확인하세요' : 'Find rider-friendly places nearby'}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>x</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color="#1D4ED8" />
          <Text style={styles.stateText}>
            {isKo ? '현재 위치 주변 정보를 불러오는 중입니다.' : 'Loading nearby rider information.'}
          </Text>
        </View>
      ) : error ? (
        <View style={styles.stateBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryButtonText}>{isKo ? '다시 시도' : 'Retry'}</Text>
          </TouchableOpacity>
        </View>
      ) : pois.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>
            {isKo
              ? '아직 이 주변에 등록된 여행 정보가 없습니다.'
              : 'No travel information has been added around here yet.'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.poiList} showsVerticalScrollIndicator={false}>
          {pois.map((poi) => {
            const meta = CATEGORY_META[poi.category] || CATEGORY_META.scenic;
            const description = getPoiDescription(poi, isKo);

            return (
              <View key={poi.id} style={styles.poiCard}>
                <View style={styles.poiTopRow}>
                  <Text style={styles.poiName} numberOfLines={1}>
                    {getPoiName(poi, isKo)}
                  </Text>
                  <View style={[styles.categoryChip, { backgroundColor: meta.background }]}>
                    <Text style={[styles.categoryText, { color: meta.color }]}>
                      {getCategoryLabel(poi.category, isKo)}
                    </Text>
                  </View>
                </View>

                {description ? (
                  <Text style={styles.poiDescription} numberOfLines={2}>
                    {description}
                  </Text>
                ) : null}

                <View style={styles.metaRow}>
                  {poi.address ? (
                    <Text style={styles.metaText} numberOfLines={1}>
                      {poi.address}
                    </Text>
                  ) : null}
                  {poi.phone ? <Text style={styles.phoneText}>{poi.phone}</Text> : null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 15,
    right: 15,
    bottom: 24,
    maxHeight: '62%',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  badge: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 4,
  },
  title: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 23,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  closeButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '900',
  },
  stateBox: {
    minHeight: 118,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    padding: 18,
  },
  stateText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 20,
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    color: '#BE123C',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 20,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#1D4ED8',
    marginTop: 12,
    paddingHorizontal: 18,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  poiList: {
    maxHeight: 390,
  },
  poiCard: {
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 9,
  },
  poiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 7,
  },
  poiName: {
    flex: 1,
    minWidth: 0,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },
  categoryChip: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '900',
  },
  poiDescription: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  metaRow: {
    gap: 4,
  },
  metaText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
  },
  phoneText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '900',
  },
});
