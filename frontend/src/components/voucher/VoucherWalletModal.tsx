import type { AppLanguage, Voucher } from '@/types/ridekorea';
import React from 'react';
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface VoucherWalletModalProps {
  visible: boolean;
  lang: AppLanguage;
  vouchers: Voucher[];
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onClose: () => void;
}

function formatVoucherAmount(voucher: Voucher) {
  const amount = typeof voucher.reward_amount === 'number' ? voucher.reward_amount : 5000;
  return `${amount.toLocaleString()} KRW`;
}

function getDaysUntilExpiry(expiresAt?: string) {
  if (!expiresAt) return null;

  const expiresTime = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresTime)) return null;

  const diffMs = expiresTime - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function isNewVoucher(voucher: Voucher) {
  if (!voucher.created_at) return false;

  const createdTime = new Date(voucher.created_at).getTime();
  if (Number.isNaN(createdTime)) return false;

  return Date.now() - createdTime <= 1000 * 60 * 60 * 24;
}

export function VoucherWalletModal({
  visible,
  lang,
  vouchers,
  isRefreshing = false,
  onRefresh,
  onClose,
}: VoucherWalletModalProps) {
  const isKo = lang === 'ko';
  const activeVouchers = vouchers.filter((voucher) => !voucher.is_redeemed);
  const redeemedVouchers = vouchers.filter((voucher) => voucher.is_redeemed);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.walletHeader}>
            <Text style={styles.modalTitle}>
              {isKo ? '내 상생 바우처 지갑' : 'My Regional Vouchers'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>x</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.walletSubtitle}>
            {isKo
              ? '지역 스팟 근처에서 자동으로 발급됩니다. 제휴 매장에서 코드를 보여주고 사용하세요.'
              : 'Earned near regional spots. Show the code at designated local partner shops to redeem.'}
          </Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryValue}>{activeVouchers.length}</Text>
              <Text style={styles.summaryLabel}>{isKo ? '사용 가능' : 'Active'}</Text>
            </View>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryValue}>{redeemedVouchers.length}</Text>
              <Text style={styles.summaryLabel}>{isKo ? '사용 완료' : 'Redeemed'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.refreshButton, (!onRefresh || isRefreshing) && styles.refreshButtonDisabled]}
              onPress={onRefresh}
              disabled={!onRefresh || isRefreshing}>
              <Text style={styles.refreshText}>{isRefreshing ? '...' : isKo ? '새로고침' : 'Refresh'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.walletScroll}
            showsVerticalScrollIndicator={false}
            refreshControl={onRefresh ? (
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            ) : undefined}>
            {vouchers.length > 0 ? (
              vouchers.map((voucher) => {
                const daysUntilExpiry = getDaysUntilExpiry(voucher.expires_at);
                const title = (isKo ? voucher.title : voucher.title_en) || voucher.title || voucher.title_en || 'Voucher';
                const description = (
                  (isKo ? voucher.description : voucher.description_en)
                  || voucher.description
                  || voucher.description_en
                  || (isKo ? '제휴 매장에서 사용할 수 있는 지역 바우처입니다.' : 'Regional partner voucher.')
                );

                return (
                  <View
                    key={voucher.id}
                    style={[
                      styles.voucherCard,
                      voucher.is_redeemed && styles.voucherCardRedeemed,
                    ]}>
                    <View style={styles.voucherCardTop}>
                      <Text style={styles.voucherTitle}>{title}</Text>
                      <Text style={styles.voucherValue}>{formatVoucherAmount(voucher)}</Text>
                    </View>

                    <View style={styles.badgeRow}>
                      {isNewVoucher(voucher) && (
                        <Text style={styles.newBadge}>{isKo ? '신규' : 'New'}</Text>
                      )}
                      <Text
                        style={[
                          styles.statusBadge,
                          voucher.is_redeemed ? styles.redeemedBadge : styles.activeBadge,
                        ]}>
                        {voucher.is_redeemed
                          ? isKo ? '사용 완료' : 'Redeemed'
                          : isKo ? '사용 가능' : 'Ready'}
                      </Text>
                    </View>

                    <Text style={styles.voucherDesc}>{description}</Text>

                    <View style={styles.barcodeContainer}>
                      <View style={styles.barcodeLines}>
                        {[...Array(24)].map((_, i) => (
                          <View
                            key={i}
                            style={[
                              styles.barcodeLine,
                              {
                                width: i % 3 === 0 ? 3 : i % 2 === 0 ? 1 : 2,
                                marginRight: i % 4 === 0 ? 2 : 1,
                              },
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={styles.barcodeNumber}>{voucher.code || '-'}</Text>
                    </View>

                    <Text style={styles.voucherExpiry}>
                      {isKo ? '만료일' : 'Expires'}:{' '}
                      {voucher.expires_at
                        ? new Date(voucher.expires_at).toLocaleDateString(isKo ? 'ko-KR' : 'en-US')
                        : '-'}
                      {daysUntilExpiry !== null ? ` · D-${Math.max(daysUntilExpiry, 0)}` : ''}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyWalletContainer}>
                <Text style={styles.emptyWalletText}>
                  {isKo
                    ? '아직 받은 지역 바우처가 없습니다.\n공식 코스를 달리며 지역 스팟에 가까워지면 자동으로 받을 수 있어요.'
                    : 'No vouchers in your wallet yet.\nRide official routes and approach regional spots to unlock rewards.'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '82%',
    padding: 20,
  },
  walletHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '900',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '900',
  },
  walletSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  summaryPill: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  summaryValue: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  summaryLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  refreshButton: {
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  refreshButtonDisabled: {
    opacity: 0.55,
  },
  refreshText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  walletScroll: {
    width: '100%',
  },
  voucherCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 1,
    marginBottom: 12,
    padding: 14,
  },
  voucherCardRedeemed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    opacity: 0.76,
  },
  voucherCardTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  voucherTitle: {
    color: '#1E3A8A',
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
  },
  voucherValue: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  newBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    color: '#166534',
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadge: {
    borderRadius: 999,
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeBadge: {
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
  },
  redeemedBadge: {
    backgroundColor: '#E2E8F0',
    color: '#475569',
  },
  voucherDesc: {
    color: '#1E40AF',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 12,
  },
  barcodeContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    marginBottom: 10,
    padding: 10,
  },
  barcodeLines: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 35,
  },
  barcodeLine: {
    backgroundColor: '#000000',
    height: '100%',
  },
  barcodeNumber: {
    color: '#1F2937',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    marginTop: 4,
  },
  voucherExpiry: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '900',
  },
  emptyWalletContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyWalletText: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
