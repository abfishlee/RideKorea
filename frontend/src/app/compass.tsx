import { NeoOutdoors } from '@/constants/neo-outdoors';
import { AdminVoucherModal } from '@/components/admin/AdminVoucherModal';
import { AdminTravelPoiModal } from '@/components/admin/AdminTravelPoiModal';
import { VoucherWalletModal } from '@/components/voucher/VoucherWalletModal';
import { useAuthSession } from '@/context/AuthSessionContext';
import { LANGUAGE_LABELS, compassScreenCopy as compassCopy, t } from '@/i18n';
import {
  getAdminVoucherConfigs,
  getAdminTravelPoiReports,
  getAdminTravelPois,
  getAdminVoucherRedemptions,
  getAdminVoucherSettlementSummary,
  getMyVouchers,
  lookupAdminVoucherByCode,
  redeemAdminVoucherByCode,
  redeemVoucher,
  saveVoucherConfig,
  updateAdminTravelPoi,
  updateAdminTravelPoiReport,
} from '@/services/api';
import type {
  AppLanguage,
  TravelPoi,
  TravelPoiReport,
  TravelPoiReportStatus,
  Voucher,
  VoucherConfig,
  VoucherRedemption,
  VoucherSettlementSummary,
} from '@/types/ridekorea';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const LANGUAGES: AppLanguage[] = ['ko', 'en', 'ja'];

export default function CompassScreen() {
  const [lang, setLang] = useState<AppLanguage>('ko');
  const { token, userProfile, isAuthChecked, signOut } = useAuthSession();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshingVouchers, setIsRefreshingVouchers] = useState(false);
  const [redeemingVoucherId, setRedeemingVoucherId] = useState<string | null>(null);

  const [isVouchersModalOpen, setIsVouchersModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminConfigs, setAdminConfigs] = useState<VoucherConfig[]>([]);
  const [isLoadingAdminConfigs, setIsLoadingAdminConfigs] = useState(false);
  const [isPoiAdminModalOpen, setIsPoiAdminModalOpen] = useState(false);
  const [adminPois, setAdminPois] = useState<TravelPoi[]>([]);
  const [adminPoiReports, setAdminPoiReports] = useState<TravelPoiReport[]>([]);
  const [isLoadingAdminPois, setIsLoadingAdminPois] = useState(false);
  const [adminPoiFilter, setAdminPoiFilter] = useState<string | null>('needs-review');
  const [savingPoiId, setSavingPoiId] = useState<string | null>(null);
  const [savingPoiReportId, setSavingPoiReportId] = useState<string | null>(null);
  const [redemptionCode, setRedemptionCode] = useState('');
  const [redemptionPreview, setRedemptionPreview] = useState<Voucher | null>(null);
  const [redemptionHistory, setRedemptionHistory] = useState<VoucherRedemption[]>([]);
  const [settlementSummary, setSettlementSummary] = useState<VoucherSettlementSummary | null>(null);
  const [settlementDays, setSettlementDays] = useState<7 | 30 | 90>(30);
  const [isLookingUpRedemption, setIsLookingUpRedemption] = useState(false);
  const [isRedeemingByCode, setIsRedeemingByCode] = useState(false);
  const [isLoadingRedemptionHistory, setIsLoadingRedemptionHistory] = useState(false);
  const [isLoadingSettlementSummary, setIsLoadingSettlementSummary] = useState(false);

  const [editingSpotId, setEditingSpotId] = useState<string | null>(null);
  const [editIsActive, setEditIsActive] = useState(false);
  const [editRewardTitle, setEditRewardTitle] = useState('');
  const [editRewardTitleEn, setEditRewardTitleEn] = useState('');
  const [editRewardAmount, setEditRewardAmount] = useState('5000');
  const [editValidDays, setEditValidDays] = useState('90');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const locale = lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : 'en-US';
  const copy = (item: Record<AppLanguage, string>) => t(lang, item);
  const localizedPair = (koValue?: string | null, enValue?: string | null) => {
    if (lang === 'ko') return koValue || enValue || '';
    return enValue || koValue || '';
  };
  const voucherCountLabel = lang === 'en'
    ? vouchers.length + ' ' + copy(compassCopy.walletCount)
    : vouchers.length + copy(compassCopy.walletCount);

  const loadAccount = useCallback(async () => {
    if (!isAuthChecked) return;
    setIsLoading(true);
    try {
      if (!token) {
        setVouchers([]);
        return;
      }

      const wallet = await getMyVouchers(token);
      setVouchers(wallet);
    } catch (err) {
      console.log('Error loading Compass account data', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthChecked, token]);

  const refreshVouchers = useCallback(async () => {
    if (!token) {
      setVouchers([]);
      return;
    }

    setIsRefreshingVouchers(true);
    try {
      const wallet = await getMyVouchers(token);
      setVouchers(wallet);
    } catch (err) {
      console.log('Error refreshing vouchers', err);
    } finally {
      setIsRefreshingVouchers(false);
    }
  }, [token]);

  const handleOpenVoucherWallet = () => {
    if (!token) return;
    setIsVouchersModalOpen(true);
    void refreshVouchers();
  };

  const handleRedeemVoucher = (voucher: Voucher) => {
    if (!token || !voucher.id) return;

    Alert.alert(
      copy(compassCopy.redeemVoucherTitle),
      copy(compassCopy.redeemVoucherBody),
      [
        { text: copy(compassCopy.cancel), style: 'cancel' },
        {
          text: copy(compassCopy.redeem),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setRedeemingVoucherId(voucher.id || null);
              try {
                const redeemed = await redeemVoucher(token, voucher.id as string);
                setVouchers((current) => current.map((item) => (
                  item.id === redeemed.id ? redeemed : item
                )));
                Alert.alert(copy(compassCopy.done), copy(compassCopy.redeemVoucherDone));
              } catch (err: any) {
                Alert.alert(copy(compassCopy.error), err.message || 'Failed to redeem voucher');
              } finally {
                setRedeemingVoucherId(null);
              }
            })();
          },
        },
      ],
    );
  };

  const normalizedRedemptionCode = redemptionCode.trim();

  const handleLookupRedemptionCode = async () => {
    if (!token || !normalizedRedemptionCode) return;

    setIsLookingUpRedemption(true);
    try {
      const voucher = await lookupAdminVoucherByCode(token, normalizedRedemptionCode);
      setRedemptionPreview(voucher);
    } catch (err: any) {
      setRedemptionPreview(null);
      Alert.alert(copy(compassCopy.lookupFailed), err.message || 'Voucher not found');
    } finally {
      setIsLookingUpRedemption(false);
    }
  };

  const fetchRedemptionHistory = async () => {
    if (!token) return;

    setIsLoadingRedemptionHistory(true);
    try {
      const history = await getAdminVoucherRedemptions(token, 10);
      setRedemptionHistory(history);
    } catch (err) {
      console.log('Error fetching voucher redemption history', err);
    } finally {
      setIsLoadingRedemptionHistory(false);
    }
  };

  const fetchSettlementSummary = async (days = settlementDays) => {
    if (!token) return;

    setIsLoadingSettlementSummary(true);
    try {
      const summary = await getAdminVoucherSettlementSummary(token, days);
      setSettlementSummary(summary);
    } catch (err) {
      console.log('Error fetching voucher settlement summary', err);
    } finally {
      setIsLoadingSettlementSummary(false);
    }
  };

  const handleRedeemByCode = () => {
    if (!token || !normalizedRedemptionCode) return;

    Alert.alert(
      copy(compassCopy.redeemByCodeTitle),
      copy(compassCopy.redeemByCodeBody),
      [
        { text: copy(compassCopy.cancel), style: 'cancel' },
        {
          text: copy(compassCopy.redeemAction),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setIsRedeemingByCode(true);
              try {
                const voucher = await redeemAdminVoucherByCode(token, normalizedRedemptionCode);
                setRedemptionPreview(voucher);
                setVouchers((current) => current.map((item) => (
                  item.id === voucher.id ? voucher : item
                )));
                await fetchRedemptionHistory();
                await fetchSettlementSummary();
                Alert.alert(copy(compassCopy.done), copy(compassCopy.redeemCodeDone));
              } catch (err: any) {
                Alert.alert(copy(compassCopy.redeemFailed), err.message || 'Failed to redeem code');
              } finally {
                setIsRedeemingByCode(false);
              }
            })();
          },
        },
      ],
    );
  };

  useEffect(() => {
    const task = setTimeout(() => {
      loadAccount();
    }, 0);

    return () => clearTimeout(task);
  }, [loadAccount]);

  const fetchAdminConfigs = async () => {
    if (!token) return;
    setIsLoadingAdminConfigs(true);
    try {
      const data = await getAdminVoucherConfigs(token);
      setAdminConfigs(data);
    } catch (err) {
      console.log('Error fetching admin configs', err);
    } finally {
      setIsLoadingAdminConfigs(false);
    }
  };

  const handleOpenAdminPanel = () => {
    setIsAdminModalOpen(true);
    fetchAdminConfigs();
    fetchRedemptionHistory();
    fetchSettlementSummary();
  };

  const fetchAdminPois = async (reviewStatus = adminPoiFilter) => {
    if (!token) return;
    setIsLoadingAdminPois(true);
    try {
      const [data, reports] = await Promise.all([
        getAdminTravelPois(token, reviewStatus),
        getAdminTravelPoiReports(token, 'open'),
      ]);
      setAdminPois(data);
      setAdminPoiReports(reports);
    } catch (err) {
      console.log('Error fetching admin POIs', err);
    } finally {
      setIsLoadingAdminPois(false);
    }
  };

  const handleOpenPoiAdminPanel = () => {
    setIsPoiAdminModalOpen(true);
    fetchAdminPois();
  };

  const handleChangePoiFilter = (reviewStatus: string | null) => {
    setAdminPoiFilter(reviewStatus);
    fetchAdminPois(reviewStatus);
  };

  const handleUpdatePoiStatus = async (
    poi: TravelPoi,
    reviewStatus: 'approved' | 'needs-review' | 'rejected',
  ) => {
    if (!token) return;
    setSavingPoiId(poi.id);
    try {
      await updateAdminTravelPoi(token, poi.id, {
        review_status: reviewStatus,
        is_active: reviewStatus === 'approved' ? true : poi.is_active,
      });
      await fetchAdminPois();
    } catch (err: any) {
      Alert.alert(copy(compassCopy.error), err.message);
    } finally {
      setSavingPoiId(null);
    }
  };

  const handleUpdatePoiReportStatus = async (
    report: TravelPoiReport,
    status: TravelPoiReportStatus,
  ) => {
    if (!token) return;
    setSavingPoiReportId(report.id);
    try {
      await updateAdminTravelPoiReport(token, report.id, status);
      await fetchAdminPois();
    } catch (err: any) {
      Alert.alert(copy(compassCopy.error), err.message);
    } finally {
      setSavingPoiReportId(null);
    }
  };

  const handleTogglePoiActive = async (poi: TravelPoi) => {
    if (!token) return;
    setSavingPoiId(poi.id);
    try {
      await updateAdminTravelPoi(token, poi.id, {
        is_active: !poi.is_active,
      });
      await fetchAdminPois();
    } catch (err: any) {
      Alert.alert(copy(compassCopy.error), err.message);
    } finally {
      setSavingPoiId(null);
    }
  };

  const handleStartEditConfig = (config: VoucherConfig) => {
    setEditingSpotId(config.spot_id);
    setEditIsActive(config.is_active);
    setEditRewardTitle(config.reward_title);
    setEditRewardTitleEn(config.reward_title_en);
    setEditRewardAmount(config.reward_amount.toString());
    setEditValidDays(config.valid_days.toString());
  };

  const handleSaveVoucherConfig = async (spotId: string) => {
    if (!token) return;
    setIsSavingConfig(true);
    try {
      await saveVoucherConfig(token, {
        spot_id: spotId,
        is_active: editIsActive,
        reward_title: editRewardTitle,
        reward_title_en: editRewardTitleEn,
        reward_amount: parseInt(editRewardAmount, 10) || 5000,
        valid_days: parseInt(editValidDays, 10) || 90,
      });

      Alert.alert(copy(compassCopy.settingsSavedTitle), copy(compassCopy.settingsSavedBody));
      setEditingSpotId(null);
      fetchAdminConfigs();
    } catch (err: any) {
      Alert.alert(copy(compassCopy.error), err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setVouchers([]);
    Alert.alert(copy(compassCopy.logoutTitle), copy(compassCopy.logoutBody));
  };

  if (!isAuthChecked || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Compass</Text>
          <Text style={styles.title}>{copy(compassCopy.title)}</Text>
          <Text style={styles.copy}>{copy(compassCopy.intro)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{copy(compassCopy.account)}</Text>
          <View style={styles.listCard}>
            <View style={styles.cardTextBlock}>
              <Text style={styles.primaryText}>
                {userProfile?.displayName || copy(compassCopy.signInRequired)}
              </Text>
              <Text style={styles.secondaryText}>
                {token ? copy(compassCopy.signedInGoogle) : copy(compassCopy.signInFromJourney)}
              </Text>
            </View>
            {token && (
              <TouchableOpacity style={styles.smallButton} onPress={handleLogout}>
                <Text style={styles.smallButtonText}>{copy(compassCopy.logoutTitle)}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{copy(compassCopy.language)}</Text>
          <View style={styles.segmented}>
            {LANGUAGES.map((language) => (
              <TouchableOpacity
                key={language}
                style={[styles.segment, lang === language && styles.segmentActive]}
                onPress={() => setLang(language)}>
                <Text style={[styles.segmentText, lang === language && styles.segmentTextActive]}>
                  {LANGUAGE_LABELS[language]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{copy(compassCopy.vouchers)}</Text>
          <TouchableOpacity
            style={[styles.actionCard, !token && styles.disabledCard]}
            onPress={handleOpenVoucherWallet}
            disabled={!token}>
            <View style={styles.cardTextBlock}>
              <Text style={styles.primaryText}>{copy(compassCopy.wallet)}</Text>
              <Text style={styles.secondaryText}>{voucherCountLabel}</Text>
            </View>
            <Text style={styles.chevron}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{copy(compassCopy.admin)}</Text>
          <TouchableOpacity
            style={[styles.actionCard, !token && styles.disabledCard]}
            onPress={handleOpenAdminPanel}
            disabled={!token}>
            <View style={styles.cardTextBlock}>
              <Text style={styles.primaryText}>{copy(compassCopy.voucherSettings)}</Text>
              <Text style={styles.secondaryText}>{copy(compassCopy.voucherSettingsBody)}</Text>
            </View>
            <Text style={styles.chevron}>{'>'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, !token && styles.disabledCard]}
            onPress={handleOpenPoiAdminPanel}
            disabled={!token}>
            <View style={styles.cardTextBlock}>
              <Text style={styles.primaryText}>{copy(compassCopy.poiReview)}</Text>
              <Text style={styles.secondaryText}>{copy(compassCopy.poiReviewBody)}</Text>
            </View>
            <Text style={styles.chevron}>{'>'}</Text>
          </TouchableOpacity>
          <View style={[styles.redemptionPanel, !token && styles.disabledCard]}>
            <Text style={styles.primaryText}>{copy(compassCopy.partnerRedemption)}</Text>
            <Text style={styles.secondaryText}>{copy(compassCopy.partnerRedemptionBody)}</Text>
            <View style={styles.settlementSummary}>
              <View style={styles.settlementSummaryTop}>
                <View>
                  <Text style={styles.historyTitle}>
                    {settlementDays + copy(compassCopy.settlementTitleSuffix)}
                  </Text>
                  <Text style={styles.settlementCaption}>{copy(compassCopy.issuedAmountBasis)}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.historyRefreshButton, (!token || isLoadingSettlementSummary) && styles.disabledButton]}
                  onPress={() => {
                    void fetchSettlementSummary();
                  }}
                  disabled={!token || isLoadingSettlementSummary}>
                  <Text style={styles.historyRefreshText}>
                    {isLoadingSettlementSummary ? '...' : copy(compassCopy.reload)}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.settlementRangeRow}>
                {([7, 30, 90] as const).map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.settlementRangeButton,
                      settlementDays === days && styles.settlementRangeButtonActive,
                    ]}
                    onPress={() => {
                      setSettlementDays(days);
                      void fetchSettlementSummary(days);
                    }}>
                    <Text
                      style={[
                        styles.settlementRangeText,
                        settlementDays === days && styles.settlementRangeTextActive,
                      ]}>
                      {lang === 'ko' ? days + '일' : lang === 'ja' ? days + '日' : days + 'd'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.settlementMetricRow}>
                <View style={styles.settlementMetric}>
                  <Text style={styles.settlementMetricValue}>
                    {(settlementSummary?.redeemed_count || 0).toLocaleString(locale)}
                  </Text>
                  <Text style={styles.settlementMetricLabel}>{copy(compassCopy.redeemedCount)}</Text>
                </View>
                <View style={styles.settlementMetric}>
                  <Text style={styles.settlementMetricValue}>
                    {(settlementSummary?.total_amount || 0).toLocaleString(locale)} KRW
                  </Text>
                  <Text style={styles.settlementMetricLabel}>{copy(compassCopy.estimatedPayout)}</Text>
                </View>
              </View>
              {(settlementSummary?.spots || []).slice(0, 3).map((spot) => (
                <View key={spot.spot_id} style={styles.settlementSpotRow}>
                  <Text style={styles.settlementSpotName}>
                    {localizedPair(spot.spot_name, spot.spot_name_en) || spot.spot_name}
                  </Text>
                  <Text style={styles.settlementSpotAmount}>
                    {spot.redeemed_count.toLocaleString(locale)} / {spot.total_amount.toLocaleString(locale)} KRW
                  </Text>
                </View>
              ))}
            </View>
            <TextInput
              style={styles.codeInput}
              placeholder={copy(compassCopy.voucherCodePlaceholder)}
              autoCapitalize="characters"
              value={redemptionCode}
              onChangeText={(value) => {
                setRedemptionCode(value);
                setRedemptionPreview(null);
              }}
              editable={!!token}
            />
            <View style={styles.redemptionActions}>
              <TouchableOpacity
                style={[styles.lookupButton, (!token || !normalizedRedemptionCode || isLookingUpRedemption) && styles.disabledButton]}
                onPress={handleLookupRedemptionCode}
                disabled={!token || !normalizedRedemptionCode || isLookingUpRedemption}>
                <Text style={styles.lookupButtonText}>
                  {isLookingUpRedemption ? '...' : copy(compassCopy.lookup)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.redeemCodeButton,
                  (!token || !normalizedRedemptionCode || !redemptionPreview || redemptionPreview.is_redeemed || isRedeemingByCode) && styles.disabledButton,
                ]}
                onPress={handleRedeemByCode}
                disabled={!token || !normalizedRedemptionCode || !redemptionPreview || redemptionPreview.is_redeemed || isRedeemingByCode}>
                <Text style={styles.redeemCodeButtonText}>
                  {isRedeemingByCode ? '...' : copy(compassCopy.redeemAction)}
                </Text>
              </TouchableOpacity>
            </View>
            {redemptionPreview && (
              <View style={styles.redemptionPreview}>
                <Text style={styles.previewTitle}>
                  {localizedPair(redemptionPreview.title, redemptionPreview.title_en)
                    || redemptionPreview.title
                    || redemptionPreview.title_en
                    || 'Voucher'}
                </Text>
                <Text style={styles.previewMeta}>
                  {redemptionPreview.is_redeemed
                    ? copy(compassCopy.alreadyRedeemed)
                    : copy(compassCopy.readyToRedeem)}
                </Text>
              </View>
            )}
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>{copy(compassCopy.recentRedemptions)}</Text>
              <TouchableOpacity
                style={[styles.historyRefreshButton, (!token || isLoadingRedemptionHistory) && styles.disabledButton]}
                onPress={fetchRedemptionHistory}
                disabled={!token || isLoadingRedemptionHistory}>
                <Text style={styles.historyRefreshText}>
                  {isLoadingRedemptionHistory ? '...' : copy(compassCopy.reload)}
                </Text>
              </TouchableOpacity>
            </View>
            {redemptionHistory.length > 0 ? (
              redemptionHistory.map((item) => (
                <View key={item.id} style={styles.historyItem}>
                  <Text style={styles.historyItemTitle}>
                    {localizedPair(item.title, item.title_en) || item.title}
                  </Text>
                  <Text style={styles.historyItemMeta}>
                    {item.code} / {localizedPair(item.spot_name, item.spot_name_en) || item.spot_name || '-'}
                  </Text>
                  <Text style={styles.historyItemMeta}>
                    {(item.rider_display_name || item.rider_email || '-')} / {item.redemption_source || '-'}
                  </Text>
                  <Text style={styles.historyItemTime}>
                    {item.redeemed_at ? new Date(item.redeemed_at).toLocaleString(locale) : '-'}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.historyEmpty}>{copy(compassCopy.emptyRedemptions)}</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <VoucherWalletModal
        visible={isVouchersModalOpen}
        lang={lang}
        vouchers={vouchers}
        isRefreshing={isRefreshingVouchers}
        redeemingVoucherId={redeemingVoucherId}
        onRefresh={refreshVouchers}
        onRedeem={handleRedeemVoucher}
        onClose={() => setIsVouchersModalOpen(false)}
      />

      <AdminVoucherModal
        visible={isAdminModalOpen}
        lang={lang}
        configs={adminConfigs}
        isLoading={isLoadingAdminConfigs}
        editingSpotId={editingSpotId}
        editIsActive={editIsActive}
        editRewardTitle={editRewardTitle}
        editRewardTitleEn={editRewardTitleEn}
        editRewardAmount={editRewardAmount}
        editValidDays={editValidDays}
        isSaving={isSavingConfig}
        onClose={() => setIsAdminModalOpen(false)}
        onStartEdit={handleStartEditConfig}
        onCancelEdit={() => setEditingSpotId(null)}
        onToggleActive={() => setEditIsActive(prev => !prev)}
        onRewardTitleChange={setEditRewardTitle}
        onRewardTitleEnChange={setEditRewardTitleEn}
        onRewardAmountChange={setEditRewardAmount}
        onValidDaysChange={setEditValidDays}
        onSave={handleSaveVoucherConfig}
      />

      <AdminTravelPoiModal
        visible={isPoiAdminModalOpen}
        lang={lang}
        pois={adminPois}
        reports={adminPoiReports}
        isLoading={isLoadingAdminPois}
        isSavingPoiId={savingPoiId}
        isSavingReportId={savingPoiReportId}
        activeFilter={adminPoiFilter}
        onChangeFilter={handleChangePoiFilter}
        onClose={() => setIsPoiAdminModalOpen(false)}
        onUpdateStatus={handleUpdatePoiStatus}
        onToggleActive={handleTogglePoiActive}
        onUpdateReportStatus={handleUpdatePoiReportStatus}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NeoOutdoors.color.paper,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NeoOutdoors.color.paper,
  },
  content: {
    padding: 24,
    paddingTop: 64,
    gap: 22,
  },
  header: {
    gap: 8,
  },
  eyebrow: {
    color: NeoOutdoors.color.deepCyan,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: NeoOutdoors.color.ink,
    fontSize: 26,
    fontWeight: '900',
  },
  copy: {
    color: NeoOutdoors.color.slateMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: NeoOutdoors.color.slate,
    fontSize: 13,
    fontWeight: '900',
  },
  listCard: {
    alignItems: 'center',
    backgroundColor: NeoOutdoors.color.white,
    borderColor: NeoOutdoors.color.line,
    borderRadius: NeoOutdoors.radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  actionCard: {
    alignItems: 'center',
    backgroundColor: NeoOutdoors.color.white,
    borderColor: NeoOutdoors.color.line,
    borderRadius: NeoOutdoors.radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  disabledCard: {
    opacity: 0.55,
  },
  redemptionPanel: {
    backgroundColor: NeoOutdoors.color.white,
    borderColor: NeoOutdoors.color.line,
    borderRadius: NeoOutdoors.radius.card,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  codeInput: {
    backgroundColor: NeoOutdoors.color.paper,
    borderColor: '#CBD5E1',
    borderRadius: NeoOutdoors.radius.card,
    borderWidth: 1,
    color: NeoOutdoors.color.inkSoft,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  redemptionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  lookupButton: {
    alignItems: 'center',
    backgroundColor: NeoOutdoors.color.slate,
    borderRadius: NeoOutdoors.radius.card,
    flex: 1,
    paddingVertical: 10,
  },
  lookupButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  redeemCodeButton: {
    alignItems: 'center',
    backgroundColor: NeoOutdoors.color.ink,
    borderRadius: NeoOutdoors.radius.card,
    flex: 1,
    paddingVertical: 10,
  },
  redeemCodeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.5,
  },
  redemptionPreview: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: NeoOutdoors.radius.card,
    borderWidth: 1,
    padding: 10,
  },
  previewTitle: {
    color: '#1E3A8A',
    fontSize: 13,
    fontWeight: '900',
  },
  previewMeta: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  settlementSummary: {
    backgroundColor: NeoOutdoors.color.paper,
    borderColor: '#CBD5E1',
    borderRadius: NeoOutdoors.radius.card,
    borderWidth: 1,
    gap: 9,
    padding: 10,
  },
  settlementSummaryTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  settlementCaption: {
    color: NeoOutdoors.color.slateMuted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  settlementMetricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  settlementRangeRow: {
    backgroundColor: NeoOutdoors.color.line,
    borderRadius: NeoOutdoors.radius.card,
    flexDirection: 'row',
    padding: 3,
  },
  settlementRangeButton: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    paddingVertical: 7,
  },
  settlementRangeButtonActive: {
    backgroundColor: NeoOutdoors.color.ink,
  },
  settlementRangeText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '900',
  },
  settlementRangeTextActive: {
    color: '#FFFFFF',
  },
  settlementMetric: {
    backgroundColor: NeoOutdoors.color.white,
    borderColor: NeoOutdoors.color.line,
    borderRadius: NeoOutdoors.radius.card,
    borderWidth: 1,
    flex: 1,
    padding: 10,
  },
  settlementMetricValue: {
    color: NeoOutdoors.color.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  settlementMetricLabel: {
    color: NeoOutdoors.color.slateMuted,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  settlementSpotRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  settlementSpotName: {
    color: NeoOutdoors.color.slate,
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: '800',
  },
  settlementSpotAmount: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '900',
    flexShrink: 0,
    textAlign: 'right',
  },
  historyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  historyTitle: {
    color: NeoOutdoors.color.slate,
    fontSize: 12,
    fontWeight: '900',
  },
  historyRefreshButton: {
    backgroundColor: NeoOutdoors.color.line,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  historyRefreshText: {
    color: NeoOutdoors.color.slate,
    fontSize: 11,
    fontWeight: '900',
  },
  historyItem: {
    backgroundColor: NeoOutdoors.color.paper,
    borderColor: NeoOutdoors.color.line,
    borderRadius: NeoOutdoors.radius.card,
    borderWidth: 1,
    gap: 2,
    padding: 10,
  },
  historyItemTitle: {
    color: NeoOutdoors.color.ink,
    fontSize: 12,
    fontWeight: '900',
  },
  historyItemMeta: {
    color: NeoOutdoors.color.slateMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  historyItemTime: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
  historyEmpty: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },
  primaryText: {
    color: NeoOutdoors.color.inkSoft,
    fontSize: 15,
    fontWeight: '800',
    flexShrink: 1,
  },
  secondaryText: {
    color: NeoOutdoors.color.slateMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
    flexShrink: 1,
  },
  cardTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  smallButton: {
    backgroundColor: NeoOutdoors.color.slate,
    borderRadius: NeoOutdoors.radius.card,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  smallButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  segmented: {
    backgroundColor: NeoOutdoors.color.line,
    borderRadius: NeoOutdoors.radius.card,
    flexDirection: 'row',
    padding: 4,
  },
  segment: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    paddingVertical: 10,
  },
  segmentActive: {
    backgroundColor: NeoOutdoors.color.ink,
  },
  segmentText: {
    color: NeoOutdoors.color.slate,
    fontSize: 13,
    fontWeight: '900',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  chevron: {
    color: '#94A3B8',
    fontSize: 24,
    fontWeight: '900',
  },
});
