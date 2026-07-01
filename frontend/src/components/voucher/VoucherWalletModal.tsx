import type { AppLanguage } from '@/types/ridekorea';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface VoucherWalletModalProps {
  visible: boolean;
  lang: AppLanguage;
  vouchers: any[];
  onClose: () => void;
}

export function VoucherWalletModal({ visible, lang, vouchers, onClose }: VoucherWalletModalProps) {
  const isKo = lang === 'ko';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: '80%' }]}>
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
              ? '지방 소도시 스탬프 인증 시 발급되며, 제휴된 오프라인 가맹점에서 보여주고 사용하세요.'
              : 'Earned at rural spots. Show the barcode at designated local partner shops to redeem.'}
          </Text>

          <ScrollView style={styles.walletScroll} showsVerticalScrollIndicator={false}>
            {vouchers.length > 0 ? (
              vouchers.map((voucher) => (
                <View key={voucher.id} style={styles.voucherCard}>
                  <View style={styles.voucherCardTop}>
                    <Text style={styles.voucherTitle}>
                      {isKo ? voucher.title : voucher.title_en}
                    </Text>
                    <Text style={styles.voucherValue}>5,000 KRW</Text>
                  </View>
                  <Text style={styles.voucherDesc}>
                    {isKo ? voucher.description : voucher.description_en}
                  </Text>

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
                    <Text style={styles.barcodeNumber}>{voucher.code}</Text>
                  </View>

                  <Text style={styles.voucherExpiry}>
                    {isKo ? '만료일' : 'Expires'}:{' '}
                    {new Date(voucher.expires_at).toLocaleDateString(isKo ? 'ko-KR' : 'en-US')}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyWalletContainer}>
                <Text style={styles.emptyWalletText}>
                  {isKo
                    ? '아직 획득한 지역 바우처가 없습니다.\n지방 소도시 인증센터를 달리며 일지를 남겨보세요.'
                    : 'No vouchers in your wallet yet.\nCertify stamps and share memories at rural spots to get rewards.'}
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '900',
  },
  walletSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 16,
  },
  walletScroll: {
    width: '100%',
  },
  voucherCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderStyle: 'dashed',
  },
  voucherCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  voucherTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
    flex: 1,
  },
  voucherValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2563eb',
    marginLeft: 10,
  },
  voucherDesc: {
    fontSize: 11,
    color: '#1e40af',
    lineHeight: 15,
    marginBottom: 12,
  },
  barcodeContainer: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  barcodeLines: {
    flexDirection: 'row',
    height: 35,
    alignItems: 'center',
  },
  barcodeLine: {
    height: '100%',
    backgroundColor: '#000',
  },
  barcodeNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 3,
    color: '#1f2937',
    marginTop: 4,
  },
  voucherExpiry: {
    fontSize: 9,
    color: '#60a5fa',
    fontWeight: 'bold',
  },
  emptyWalletContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyWalletText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
});
