import type { AppLanguage, TravelPoi, TravelPoiReport, TravelPoiReportStatus } from '@/types/ridekorea';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface AdminTravelPoiModalProps {
  visible: boolean;
  lang: AppLanguage;
  pois: TravelPoi[];
  reports: TravelPoiReport[];
  isLoading: boolean;
  isSavingPoiId: string | null;
  isSavingReportId: string | null;
  activeFilter: string | null;
  onChangeFilter: (status: string | null) => void;
  onClose: () => void;
  onUpdateStatus: (poi: TravelPoi, status: 'approved' | 'needs-review' | 'rejected') => void;
  onToggleActive: (poi: TravelPoi) => void;
  onUpdateReportStatus: (report: TravelPoiReport, status: TravelPoiReportStatus) => void;
}

const FILTERS: { value: string | null; ko: string; en: string }[] = [
  { value: null, ko: '전체', en: 'All' },
  { value: 'needs-review', ko: '검토중', en: 'Review' },
  { value: 'approved', ko: '승인', en: 'Approved' },
  { value: 'rejected', ko: '거절', en: 'Rejected' },
];

const STATUS_LABELS: Record<string, { ko: string; en: string; color: string; background: string }> = {
  approved: { ko: '승인', en: 'Approved', color: '#047857', background: '#D1FAE5' },
  'needs-review': { ko: '검토중', en: 'Needs review', color: '#B45309', background: '#FEF3C7' },
  rejected: { ko: '거절', en: 'Rejected', color: '#BE123C', background: '#FFE4E6' },
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

export function AdminTravelPoiModal({
  visible,
  lang,
  pois,
  reports,
  isLoading,
  isSavingPoiId,
  isSavingReportId,
  activeFilter,
  onChangeFilter,
  onClose,
  onUpdateStatus,
  onToggleActive,
  onUpdateReportStatus,
}: AdminTravelPoiModalProps) {
  const isKo = lang === 'ko';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{isKo ? 'POI 데이터 검수' : 'POI Data Review'}</Text>
              <Text style={styles.subtitle}>
                {isKo
                  ? '출처, 라이선스, 표시 여부를 확인하고 지도 노출 상태를 관리합니다.'
                  : 'Review provenance, license, and map visibility for travel POIs.'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>x</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterRow}>
            {FILTERS.map(filter => {
              const isActive = activeFilter === filter.value;
              return (
                <TouchableOpacity
                  key={filter.value || 'all'}
                  style={[styles.filterButton, isActive && styles.filterButtonActive]}
                  onPress={() => onChangeFilter(filter.value)}
                  activeOpacity={0.86}>
                  <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
                    {isKo ? filter.ko : filter.en}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#1E3A8A" style={styles.loader} />
          ) : (
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              {reports.length > 0 && (
                <View style={styles.reportSection}>
                  <Text style={styles.sectionLabel}>
                    {isKo ? `열린 신고 ${reports.length}건` : `${reports.length} open reports`}
                  </Text>
                  {reports.map(report => {
                    const isReportSaving = isSavingReportId === report.id;
                    return (
                      <View key={report.id} style={styles.reportCard}>
                        <View style={styles.cardTop}>
                          <View style={styles.cardTitleBlock}>
                            <Text style={styles.poiName} numberOfLines={1}>
                              {isKo ? report.poi.name : report.poi.name_en || report.poi.name}
                            </Text>
                            <Text style={styles.poiMeta} numberOfLines={1}>
                              {report.report_type} · {formatDate(report.created_at)}
                            </Text>
                          </View>
                          <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
                            <Text style={[styles.statusBadgeText, { color: '#B45309' }]}>
                              {isKo ? '신고' : 'Report'}
                            </Text>
                          </View>
                        </View>

                        {report.note ? (
                          <Text style={styles.reportNote} numberOfLines={2}>
                            {report.note}
                          </Text>
                        ) : null}

                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.approveButton]}
                            disabled={isReportSaving}
                            onPress={() => onUpdateReportStatus(report, 'resolved')}>
                            <Text style={styles.actionButtonText}>{isKo ? '해결' : 'Resolve'}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.hideButton]}
                            disabled={isReportSaving}
                            onPress={() => onUpdateReportStatus(report, 'dismissed')}>
                            <Text style={styles.actionButtonText}>{isKo ? '무시' : 'Dismiss'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {pois.length === 0 ? (
                <Text style={styles.emptyText}>
                  {isKo ? '검수할 POI가 없습니다.' : 'No POIs to review.'}
                </Text>
              ) : (
                pois.map(poi => {
                  const status = STATUS_LABELS[poi.review_status || 'needs-review'] || STATUS_LABELS['needs-review'];
                  const isSaving = isSavingPoiId === poi.id;

                  return (
                    <View key={poi.id} style={[styles.card, !poi.is_active && styles.cardMuted]}>
                      <View style={styles.cardTop}>
                        <View style={styles.cardTitleBlock}>
                          <Text style={styles.poiName} numberOfLines={1}>
                            {isKo ? poi.name : poi.name_en || poi.name}
                          </Text>
                          <Text style={styles.poiMeta} numberOfLines={1}>
                            {poi.category} · {poi.source || 'unknown'} · {poi.external_id || '-'}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: status.background }]}>
                          <Text style={[styles.statusBadgeText, { color: status.color }]}>
                            {isKo ? status.ko : status.en}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.provenanceBox}>
                        <Text style={styles.provenanceLine} numberOfLines={1}>
                          {isKo ? '출처' : 'Source'}: {poi.source_name || poi.source || '-'}
                        </Text>
                        <Text style={styles.provenanceLine} numberOfLines={1}>
                          {isKo ? '라이선스' : 'License'}: {poi.license_type || '-'}
                        </Text>
                        <Text style={styles.provenanceLine} numberOfLines={1}>
                          {isKo ? '확인일' : 'Checked'}: {formatDate(poi.retrieved_at)}
                        </Text>
                      </View>

                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.approveButton]}
                          disabled={isSaving}
                          onPress={() => onUpdateStatus(poi, 'approved')}>
                          <Text style={styles.actionButtonText}>{isKo ? '승인' : 'Approve'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.reviewButton]}
                          disabled={isSaving}
                          onPress={() => onUpdateStatus(poi, 'needs-review')}>
                          <Text style={styles.actionButtonText}>{isKo ? '검토' : 'Review'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.rejectButton]}
                          disabled={isSaving}
                          onPress={() => onUpdateStatus(poi, 'rejected')}>
                          <Text style={styles.actionButtonText}>{isKo ? '거절' : 'Reject'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, poi.is_active ? styles.hideButton : styles.showButton]}
                          disabled={isSaving}
                          onPress={() => onToggleActive(poi)}>
                          <Text style={styles.actionButtonText}>
                            {poi.is_active ? (isKo ? '숨김' : 'Hide') : (isKo ? '노출' : 'Show')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 4,
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
  },
  closeButtonText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '900',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  filterButton: {
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  filterButtonActive: {
    backgroundColor: '#1E3A8A',
  },
  filterButtonText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '900',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  loader: {
    marginVertical: 32,
  },
  scroll: {
    marginTop: 14,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    paddingVertical: 28,
    textAlign: 'center',
  },
  reportSection: {
    marginBottom: 14,
  },
  sectionLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 8,
  },
  reportCard: {
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
    padding: 12,
    marginBottom: 10,
  },
  reportNote: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 10,
  },
  cardMuted: {
    opacity: 0.62,
    backgroundColor: '#F8FAFC',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  poiName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },
  poiMeta: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  provenanceBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    gap: 3,
    marginTop: 10,
  },
  provenanceLine: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 10,
  },
  actionButton: {
    minHeight: 34,
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    paddingHorizontal: 9,
  },
  approveButton: {
    backgroundColor: '#047857',
  },
  reviewButton: {
    backgroundColor: '#B45309',
  },
  rejectButton: {
    backgroundColor: '#BE123C',
  },
  hideButton: {
    backgroundColor: '#475569',
  },
  showButton: {
    backgroundColor: '#2563EB',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
});
