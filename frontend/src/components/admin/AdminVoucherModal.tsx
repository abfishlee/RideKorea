import { adminVoucherCopy, t } from '@/i18n';
import type { AppLanguage } from '@/types/ridekorea';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface AdminVoucherModalProps {
  visible: boolean;
  lang: AppLanguage;
  configs: any[];
  isLoading: boolean;
  editingSpotId: string | null;
  editIsActive: boolean;
  editRewardTitle: string;
  editRewardTitleEn: string;
  editRewardAmount: string;
  editValidDays: string;
  isSaving: boolean;
  onClose: () => void;
  onStartEdit: (config: any) => void;
  onCancelEdit: () => void;
  onToggleActive: () => void;
  onRewardTitleChange: (value: string) => void;
  onRewardTitleEnChange: (value: string) => void;
  onRewardAmountChange: (value: string) => void;
  onValidDaysChange: (value: string) => void;
  onSave: (spotId: string) => void;
}

export function AdminVoucherModal({
  visible,
  lang,
  configs,
  isLoading,
  editingSpotId,
  editIsActive,
  editRewardTitle,
  editRewardTitleEn,
  editRewardAmount,
  editValidDays,
  isSaving,
  onClose,
  onStartEdit,
  onCancelEdit,
  onToggleActive,
  onRewardTitleChange,
  onRewardTitleEnChange,
  onRewardAmountChange,
  onValidDaysChange,
  onSave,
}: AdminVoucherModalProps) {
  const copy = (item: Record<AppLanguage, string>) => t(lang, item);
  const spotName = (config: any) => (lang === 'ko' ? config.spot_name : config.spot_name_en) || config.spot_name;
  const statusLine = (config: any) => {
    if (!config.is_active) return copy(adminVoucherCopy.inactive);
    const amount = config.reward_amount.toLocaleString(lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : 'ko-KR');
    const currency = lang === 'ko' ? '원' : 'KRW';
    return `${copy(adminVoucherCopy.active)} - ${amount}${currency}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: '90%' }]}>
          <View style={styles.walletHeader}>
            <Text style={styles.modalTitle}>
              {copy(adminVoucherCopy.title)}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>x</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.walletSubtitle}>
            {copy(adminVoucherCopy.subtitle)}
          </Text>

          {isLoading ? (
            <ActivityIndicator size="large" color="#1E3A8A" style={{ marginVertical: 30 }} />
          ) : (
            <ScrollView style={styles.adminScroll} showsVerticalScrollIndicator={false}>
              {configs.map((config) => {
                const isEditing = editingSpotId === config.spot_id;

                return (
                  <View
                    key={config.spot_id}
                    style={[styles.adminConfigCard, config.is_active && styles.adminConfigCardActive]}>
                    <View style={styles.adminConfigHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.adminSpotName}>
                          {spotName(config)}
                        </Text>
                        <Text style={styles.adminSpotSub}>
                          {statusLine(config)}
                        </Text>
                      </View>

                      {!isEditing && (
                        <TouchableOpacity style={styles.adminEditBtn} onPress={() => onStartEdit(config)}>
                          <Text style={styles.adminEditBtnText}>{copy(adminVoucherCopy.editSettings)}</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {isEditing && (
                      <View style={styles.adminEditForm}>
                        <View style={styles.formRow}>
                          <Text style={styles.formLabel}>
                            {copy(adminVoucherCopy.enableVoucher)}
                          </Text>
                          <TouchableOpacity
                            style={[
                              styles.toggleSwitch,
                              editIsActive ? styles.toggleSwitchOn : styles.toggleSwitchOff,
                            ]}
                            onPress={onToggleActive}>
                            <Text style={styles.toggleSwitchText}>{editIsActive ? 'ON' : 'OFF'}</Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.formInputLabel}>
                          {copy(adminVoucherCopy.rewardTitleKo)}
                        </Text>
                        <TextInput
                          style={styles.adminInput}
                          value={editRewardTitle}
                          onChangeText={onRewardTitleChange}
                          placeholder={copy(adminVoucherCopy.rewardTitleKoPlaceholder)}
                        />

                        <Text style={styles.formInputLabel}>
                          {copy(adminVoucherCopy.rewardTitleEn)}
                        </Text>
                        <TextInput
                          style={styles.adminInput}
                          value={editRewardTitleEn}
                          onChangeText={onRewardTitleEnChange}
                          placeholder={copy(adminVoucherCopy.rewardTitleEnPlaceholder)}
                        />

                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.formInputLabel}>
                              {copy(adminVoucherCopy.amountKrw)}
                            </Text>
                            <TextInput
                              style={styles.adminInput}
                              value={editRewardAmount}
                              onChangeText={onRewardAmountChange}
                              keyboardType="numeric"
                              placeholder="5000"
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.formInputLabel}>
                              {copy(adminVoucherCopy.validDays)}
                            </Text>
                            <TextInput
                              style={styles.adminInput}
                              value={editValidDays}
                              onChangeText={onValidDaysChange}
                              keyboardType="numeric"
                              placeholder="90"
                            />
                          </View>
                        </View>

                        <View style={styles.formActionRow}>
                          <TouchableOpacity
                            style={[styles.formBtn, styles.formCancelBtn]}
                            onPress={onCancelEdit}
                            disabled={isSaving}>
                            <Text style={styles.formCancelBtnText}>{copy(adminVoucherCopy.cancel)}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.formBtn, styles.formSaveBtn]}
                            onPress={() => onSave(config.spot_id)}
                            disabled={isSaving}>
                            {isSaving ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text style={styles.formSaveBtnText}>{copy(adminVoucherCopy.save)}</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
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
  adminScroll: {
    width: '100%',
    marginTop: 10,
  },
  adminConfigCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  adminConfigCardActive: {
    borderColor: '#1E3A8A',
    backgroundColor: '#EFF6FF',
  },
  adminConfigHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adminSpotName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  adminSpotSub: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  adminEditBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adminEditBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  adminEditForm: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  toggleSwitch: {
    width: 60,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleSwitchOn: {
    backgroundColor: '#1E3A8A',
  },
  toggleSwitchOff: {
    backgroundColor: '#d1d5db',
  },
  toggleSwitchText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  formInputLabel: {
    fontSize: 11,
    color: '#4b5563',
    marginBottom: 4,
    marginTop: 6,
    fontWeight: '600',
  },
  adminInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    backgroundColor: '#fff',
    color: '#1f2937',
  },
  formActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  formBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  formCancelBtn: {
    backgroundColor: '#f3f4f6',
  },
  formCancelBtnText: {
    color: '#4b5563',
    fontSize: 12,
    fontWeight: 'bold',
  },
  formSaveBtn: {
    backgroundColor: '#1E3A8A',
  },
  formSaveBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
