import { journeyCopy, t } from '@/i18n';
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

const CATEGORY_LABELS: Record<string, { ko: string; en: string; ja: string; color: string; background: string }> = {
  repair: { ko: '수리', en: 'Repair', ja: '修理', color: '#B45309', background: '#FEF3C7' },
  food: { ko: '맛집', en: 'Food', ja: '食事', color: '#BE123C', background: '#FFE4E6' },
  lodging: { ko: '숙소', en: 'Lodging', ja: '宿泊', color: '#6D28D9', background: '#EDE9FE' },
  scenic: { ko: '경치', en: 'Scenic', ja: '景色', color: '#047857', background: '#D1FAE5' },
  transport: { ko: '교통', en: 'Transport', ja: '交通', color: '#1D4ED8', background: '#DBEAFE' },
  culture: { ko: '문화', en: 'Culture', ja: '文化', color: '#0F766E', background: '#CCFBF1' },
};

function getName(poi: TravelPoi, lang: AppLanguage) {
  return lang === 'ko' ? poi.name : poi.name_en || poi.name;
}

function getDescription(poi: TravelPoi, lang: AppLanguage) {
  return lang === 'ko' ? poi.description : poi.description_en || poi.description;
}

function getBikePolicy(poi: TravelPoi, lang: AppLanguage) {
  return lang === 'ko' ? poi.bike_policy : poi.bike_policy_en || poi.bike_policy;
}

function getPackingNotes(poi: TravelPoi, lang: AppLanguage) {
  return lang === 'ko' ? poi.packing_notes : poi.packing_notes_en || poi.packing_notes;
}

function getSearchText(poi: TravelPoi, lang: AppLanguage) {
  return poi.address || getName(poi, lang);
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

async function openUrl(url: string, lang: AppLanguage) {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      throw new Error('Unsupported URL');
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      t(lang, journeyCopy.cannotOpenTitle),
      t(lang, journeyCopy.cannotOpenBody),
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
  const category = CATEGORY_LABELS[poi.category] || CATEGORY_LABELS.scenic;
  const copy = (item: Record<AppLanguage, string>) => t(lang, item);
  const categoryLabel = category[lang] || category.en;
  const description = getDescription(poi, lang);
  const isTransport = poi.category === 'transport';
  const poiName = getName(poi, lang);
  const searchText = getSearchText(poi, lang);
  const encodedSearchText = encodeURIComponent(searchText);
  const encodedPoiName = encodeURIComponent(poiName);
  const lat = poi.location.lat;
  const lng = poi.location.lng;
  const retrievedDate = formatDate(poi.retrieved_at);
  const sourceLabel = poi.attribution || poi.source_name || poi.source;
  const hasProvenance = Boolean(sourceLabel || poi.license_type || retrievedDate || poi.source_url);
  const bikePolicy = getBikePolicy(poi, lang);
  const packingNotes = getPackingNotes(poi, lang);

  const handleCall = () => {
    if (!poi.phone) return;
    void openUrl(`tel:${poi.phone.replace(/[^\d+]/g, '')}`, lang);
  };

  const handleOpenMap = () => {
    void openUrl(`https://map.kakao.com/link/map/${encodedPoiName},${lat},${lng}`, lang);
  };

  const handleOpenDirections = () => {
    void openUrl(`https://map.kakao.com/link/to/${encodedPoiName},${lat},${lng}`, lang);
  };

  const handleSearchAddress = () => {
    void openUrl(`https://map.kakao.com/?q=${encodedSearchText}`, lang);
  };

  const handleOpenSource = () => {
    if (!poi.source_url) return;
    void openUrl(poi.source_url, lang);
  };

  const handleOpenBooking = () => {
    if (!poi.booking_url) return;
    void openUrl(poi.booking_url, lang);
  };

  return (
    <View style={styles.sheet}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <View style={[styles.badge, { backgroundColor: category.background }]}>
            <Text style={[styles.badgeText, { color: category.color }]}>
              {categoryLabel}
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
          {copy(journeyCopy.noPoiDescription)}
        </Text>
      )}

      {isTransport && (
        <View style={styles.transportGuideBox}>
          <Text style={styles.transportGuideTitle}>
            {copy(journeyCopy.bikeTransferCheck)}
          </Text>
          {poi.transport_mode || poi.route_name ? (
            <Text style={styles.transportGuideMeta}>
              {[poi.transport_mode, poi.route_name].filter(Boolean).join(' / ')}
            </Text>
          ) : null}
          <Text style={styles.transportGuideText}>
            {bikePolicy || copy(journeyCopy.bikePolicyFallback)}
          </Text>
          {poi.packing_required !== null && poi.packing_required !== undefined ? (
            <Text style={styles.transportGuideMeta}>
              {poi.packing_required
                ? copy(journeyCopy.bikePackingRequired)
                : copy(journeyCopy.checkPackingConditions)}
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
                {copy(journeyCopy.openOfficialGuide)}
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
            <Text style={styles.actionButtonText}>{copy(journeyCopy.call)}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.86} onPress={handleOpenMap}>
          <Text style={styles.actionButtonText}>{copy(journeyCopy.map)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.86} onPress={handleOpenDirections}>
          <Text style={styles.actionButtonText}>{copy(journeyCopy.directions)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} activeOpacity={0.86} onPress={handleSearchAddress}>
          <Text style={styles.actionButtonText}>{copy(journeyCopy.search)}</Text>
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
              {copy(journeyCopy.recommend)} {poi.recommend_count}
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
              {copy(journeyCopy.caution)} {poi.caution_count}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {onReport && (
        <View style={styles.reportBox}>
          <Text style={styles.reportTitle}>
            {copy(journeyCopy.wrongInfoPrompt)}
          </Text>
          <View style={styles.reportRow}>
            <TouchableOpacity
              style={styles.reportButton}
              activeOpacity={0.86}
              disabled={isSubmittingReport}
              onPress={() => onReport('closed')}>
              <Text style={styles.reportButtonText}>{copy(journeyCopy.reportClosed)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reportButton}
              activeOpacity={0.86}
              disabled={isSubmittingReport}
              onPress={() => onReport('wrong_location')}>
              <Text style={styles.reportButtonText}>{copy(journeyCopy.reportLocation)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reportButtonDanger}
              activeOpacity={0.86}
              disabled={isSubmittingReport}
              onPress={() => onReport('danger')}>
              <Text style={styles.reportButtonText}>{copy(journeyCopy.reportDanger)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {hasProvenance && (
        <View style={styles.provenanceBox}>
          <Text style={styles.provenanceTitle}>
            {copy(journeyCopy.dataSource)}
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
                {copy(journeyCopy.checked)} {retrievedDate}
              </Text>
            ) : null}
          </View>
          {poi.source_url ? (
            <TouchableOpacity activeOpacity={0.86} onPress={handleOpenSource}>
              <Text style={styles.sourceLink}>
                {copy(journeyCopy.openSource)}
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
