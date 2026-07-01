import type { AppLanguage, TravelPoi, TravelPoiReportType } from '@/types/ridekorea';
import React from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TravelPoiSheetProps {
  lang: AppLanguage;
  poi: TravelPoi;
  isSubmittingFeedback?: boolean;
  isSubmittingReport?: boolean;
  onClose: () => void;
  onFeedback?: (feedbackType: 'recommend' | 'caution') => void;
  onReport?: (reportType: TravelPoiReportType) => void;
}

const CATEGORY_LABELS: Record<string, { ko: string; en: string; color: string; background: string }> = {
  repair: { ko: '수리', en: 'Repair', color: '#B45309', background: '#FEF3C7' },
  food: { ko: '맛집', en: 'Food', color: '#BE123C', background: '#FFE4E6' },
  lodging: { ko: '숙소', en: 'Lodging', color: '#6D28D9', background: '#EDE9FE' },
  scenic: { ko: '경치', en: 'Scenic', color: '#047857', background: '#D1FAE5' },
  transport: { ko: '교통', en: 'Transport', color: '#1D4ED8', background: '#DBEAFE' },
  culture: { ko: '문화', en: 'Culture', color: '#0F766E', background: '#CCFBF1' },
};

function getName(poi: TravelPoi, isKo: boolean) {
  return isKo ? poi.name : poi.name_en || poi.name;
}

function getDescription(poi: TravelPoi, isKo: boolean) {
  return isKo ? poi.description : poi.description_en || poi.description;
}

function getBikePolicy(poi: TravelPoi, isKo: boolean) {
  return isKo ? poi.bike_policy : poi.bike_policy_en || poi.bike_policy;
}

function getPackingNotes(poi: TravelPoi, isKo: boolean) {
  return isKo ? poi.packing_notes : poi.packing_notes_en || poi.packing_notes;
}

function getSearchText(poi: TravelPoi, isKo: boolean) {
  return poi.address || getName(poi, isKo);
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

async function openUrl(url: string, isKo: boolean) {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      throw new Error('Unsupported URL');
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      isKo ? '열 수 없음' : 'Cannot open',
      isKo ? '이 기기에서 해당 동작을 실행할 수 없습니다.' : 'This action is not available on this device.',
    );
  }
}

export function TravelPoiSheet({
  lang,
  poi,
  isSubmittingFeedback = false,
  isSubmittingReport = false,
  onClose,
  onFeedback,
  onReport,
}: TravelPoiSheetProps) {
  const isKo = lang === 'ko';
  const category = CATEGORY_LABELS[poi.category] || CATEGORY_LABELS.scenic;
  const description = getDescription(poi, isKo);
  const isTransport = poi.category === 'transport';
  const poiName = getName(poi, isKo);
  const searchText = getSearchText(poi, isKo);
  const encodedSearchText = encodeURIComponent(searchText);
  const encodedPoiName = encodeURIComponent(poiName);
  const lat = poi.location.lat;
  const lng = poi.location.lng;
  const retrievedDate = formatDate(poi.retrieved_at);
  const sourceLabel = poi.attribution || poi.source_name || poi.source;
  const hasProvenance = Boolean(sourceLabel || poi.license_type || retrievedDate || poi.source_url);
  const bikePolicy = getBikePolicy(poi, isKo);
  const packingNotes = getPackingNotes(poi, isKo);

  const handleCall = () => {
    if (!poi.phone) return;
    void openUrl(`tel:${poi.phone.replace(/[^\d+]/g, '')}`, isKo);
  };

  const handleOpenMap = () => {
    void openUrl(`https://map.kakao.com/link/map/${encodedPoiName},${lat},${lng}`, isKo);
  };

  const handleOpenDirections = () => {
    void openUrl(`https://map.kakao.com/link/to/${encodedPoiName},${lat},${lng}`, isKo);
  };

  const handleSearchAddress = () => {
    void openUrl(`https://map.kakao.com/?q=${encodedSearchText}`, isKo);
  };

  const handleOpenSource = () => {
    if (!poi.source_url) return;
    void openUrl(poi.source_url, isKo);
  };

  const handleOpenBooking = () => {
    if (!poi.booking_url) return;
    void openUrl(poi.booking_url, isKo);
  };

  return (
    <View style={styles.sheet}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <View style={[styles.badge, { backgroundColor: category.background }]}>
            <Text style={[styles.badgeText, { color: category.color }]}>
              {isKo ? category.ko : category.en}
            </Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {poiName}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>x</Text>
        </TouchableOpacity>
      </View>

      {description ? (
        <Text style={styles.description}>
          {description}
        </Text>
      ) : (
        <Text style={styles.descriptionMuted}>
          {isKo ? '아직 상세 설명이 없습니다.' : 'No detailed description yet.'}
        </Text>
      )}

      {isTransport && (
        <View style={styles.transportGuideBox}>
          <Text style={styles.transportGuideTitle}>
            {isKo ? '자전거 이동 체크' : 'Bike transfer check'}
          </Text>
          {poi.transport_mode || poi.route_name ? (
            <Text style={styles.transportGuideMeta}>
              {[poi.transport_mode, poi.route_name].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
          <Text style={styles.transportGuideText}>
            {bikePolicy ||
              (isKo
                ? '출발 전 항공, 철도, 버스 규정을 다시 확인하세요. 포장 규격과 탑승 가능 시간은 노선별로 달라질 수 있습니다.'
                : 'Before travel, re-check airline, rail, and bus rules. Packing size and boarding rules can vary by route.')}
          </Text>
          {poi.packing_required !== null && poi.packing_required !== undefined ? (
            <Text style={styles.transportGuideMeta}>
              {poi.packing_required
                ? (isKo ? '자전거 포장 필요' : 'Bike packing required')
                : (isKo ? '포장 조건 확인 필요' : 'Check packing conditions')}
            </Text>
          ) : null}
          {packingNotes ? (
            <Text style={styles.transportGuideText}>
              {packingNotes}
            </Text>
          ) : null}
          {poi.booking_url ? (
            <TouchableOpacity activeOpacity={0.86} onPress={handleOpenBooking}>
              <Text style={styles.transportGuideLink}>
                {isKo ? '공식 안내 보기' : 'Open official guide'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      <View style={styles.infoBox}>
        {poi.address ? (
          <Text style={styles.infoText} numberOfLines={2}>
            {poi.address}
          </Text>
        ) : null}
        {poi.phone ? <Text style={styles.phoneText}>{poi.phone}</Text> : null}
        <Text style={styles.coordinateText}>
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </Text>
      </View>

      <View style={styles.actionGrid}>
        {poi.phone && (
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.86} onPress={handleCall}>
            <Text style={styles.actionButtonText}>{isKo ? '전화' : 'Call'}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.86} onPress={handleOpenMap}>
          <Text style={styles.actionButtonText}>{isKo ? '지도' : 'Map'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.86} onPress={handleOpenDirections}>
          <Text style={styles.actionButtonText}>{isKo ? '길찾기' : 'Directions'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.86} onPress={handleSearchAddress}>
          <Text style={styles.actionButtonText}>{isKo ? '주소검색' : 'Search'}</Text>
        </TouchableOpacity>
      </View>

      {onFeedback && (
        <View style={styles.feedbackRow}>
          <TouchableOpacity
            style={[
              styles.feedbackButton,
              poi.my_feedback === 'recommend' && styles.recommendButtonActive,
            ]}
            activeOpacity={0.86}
            disabled={isSubmittingFeedback}
            onPress={() => onFeedback('recommend')}>
            <Text
              style={[
                styles.feedbackButtonText,
                poi.my_feedback === 'recommend' && styles.feedbackButtonTextActive,
              ]}>
              {isKo ? `추천 ${poi.recommend_count}` : `Recommend ${poi.recommend_count}`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.feedbackButton,
              poi.my_feedback === 'caution' && styles.cautionButtonActive,
            ]}
            activeOpacity={0.86}
            disabled={isSubmittingFeedback}
            onPress={() => onFeedback('caution')}>
            <Text
              style={[
                styles.feedbackButtonText,
                poi.my_feedback === 'caution' && styles.feedbackButtonTextActive,
              ]}>
              {isKo ? `주의 ${poi.caution_count}` : `Caution ${poi.caution_count}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {onReport && (
        <View style={styles.reportBox}>
          <Text style={styles.reportTitle}>
            {isKo ? '정보가 틀렸나요?' : 'Is this information wrong?'}
          </Text>
          <View style={styles.reportRow}>
            <TouchableOpacity
              style={styles.reportButton}
              activeOpacity={0.86}
              disabled={isSubmittingReport}
              onPress={() => onReport('closed')}>
              <Text style={styles.reportButtonText}>{isKo ? '폐업' : 'Closed'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reportButton}
              activeOpacity={0.86}
              disabled={isSubmittingReport}
              onPress={() => onReport('wrong_location')}>
              <Text style={styles.reportButtonText}>{isKo ? '위치오류' : 'Location'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reportButtonDanger}
              activeOpacity={0.86}
              disabled={isSubmittingReport}
              onPress={() => onReport('danger')}>
              <Text style={styles.reportButtonText}>{isKo ? '위험' : 'Danger'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {hasProvenance && (
        <View style={styles.provenanceBox}>
          <Text style={styles.provenanceTitle}>
            {isKo ? '데이터 출처' : 'Data source'}
          </Text>
          {sourceLabel ? (
            <Text style={styles.provenanceText} numberOfLines={2}>
              {sourceLabel}
            </Text>
          ) : null}
          <View style={styles.provenanceMetaRow}>
            {poi.license_type ? (
              <Text style={styles.provenanceMeta}>
                {poi.license_type}
              </Text>
            ) : null}
            {retrievedDate ? (
              <Text style={styles.provenanceMeta}>
                {isKo ? `확인 ${retrievedDate}` : `Checked ${retrievedDate}`}
              </Text>
            ) : null}
          </View>
          {poi.source_url ? (
            <TouchableOpacity activeOpacity={0.86} onPress={handleOpenSource}>
              <Text style={styles.sourceLink}>
                {isKo ? '원문 보기' : 'Open source'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
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
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginBottom: 7,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
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
  description: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
  descriptionMuted: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  transportGuideBox: {
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 12,
    marginBottom: 12,
  },
  transportGuideTitle: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 5,
  },
  transportGuideMeta: {
    color: '#1E3A8A',
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 17,
    marginBottom: 5,
  },
  transportGuideText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 6,
  },
  transportGuideLink: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },
  infoBox: {
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 5,
  },
  infoText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
  },
  phoneText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '900',
  },
  coordinateText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    minHeight: 40,
    minWidth: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  feedbackRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  feedbackButton: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recommendButtonActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  cautionButtonActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  feedbackButtonText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '900',
  },
  feedbackButtonTextActive: {
    color: '#0F172A',
  },
  reportBox: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 12,
    paddingTop: 12,
  },
  reportTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 8,
  },
  reportRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reportButton: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    backgroundColor: '#475569',
    paddingHorizontal: 10,
  },
  reportButtonDanger: {
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    backgroundColor: '#BE123C',
    paddingHorizontal: 10,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  provenanceBox: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 12,
    paddingTop: 12,
    gap: 5,
  },
  provenanceTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
  },
  provenanceText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  provenanceMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  provenanceMeta: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
  },
  sourceLink: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },
});
