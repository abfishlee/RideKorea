import { AdminVoucherModal } from '@/components/admin/AdminVoucherModal';
import { AdminTravelPoiModal } from '@/components/admin/AdminTravelPoiModal';
import { VoucherWalletModal } from '@/components/voucher/VoucherWalletModal';
import { useAuthSession } from '@/context/AuthSessionContext';
import {
  getAdminVoucherConfigs,
  getAdminTravelPoiReports,
  getAdminTravelPois,
  getMyVouchers,
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
} from '@/types/ridekorea';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CompassScreen() {
  const [lang, setLang] = useState<AppLanguage>('ko');
  const { token, userProfile, isAuthChecked, signOut } = useAuthSession();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshingVouchers, setIsRefreshingVouchers] = useState(false);

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

  const [editingSpotId, setEditingSpotId] = useState<string | null>(null);
  const [editIsActive, setEditIsActive] = useState(false);
  const [editRewardTitle, setEditRewardTitle] = useState('');
  const [editRewardTitleEn, setEditRewardTitleEn] = useState('');
  const [editRewardAmount, setEditRewardAmount] = useState('5000');
  const [editValidDays, setEditValidDays] = useState('90');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const isKo = lang === 'ko';

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
      Alert.alert(isKo ? '오류' : 'Error', err.message);
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
      Alert.alert(isKo ? '오류' : 'Error', err.message);
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
      Alert.alert(isKo ? '오류' : 'Error', err.message);
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

      Alert.alert(
        isKo ? '설정 저장 완료' : 'Settings Saved',
        isKo ? '바우처 제휴 설정이 갱신되었습니다.' : 'Voucher settings updated successfully.',
      );
      setEditingSpotId(null);
      fetchAdminConfigs();
    } catch (err: any) {
      Alert.alert(isKo ? '오류' : 'Error', err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setVouchers([]);
    Alert.alert(isKo ? '로그아웃' : 'Logout', isKo ? '정상적으로 로그아웃되었습니다.' : 'Logged out.');
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
          <Text style={styles.title}>{isKo ? '설정과 관리자 도구' : 'Settings and admin tools'}</Text>
          <Text style={styles.copy}>
            {isKo
              ? '언어, 계정, 바우처 지갑, 지자체 제휴 설정을 이곳에서 관리합니다.'
              : 'Manage language, account, voucher wallet, and local partnership settings here.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isKo ? '계정' : 'Account'}</Text>
          <View style={styles.listCard}>
            <View>
              <Text style={styles.primaryText}>
                {userProfile?.displayName || (isKo ? '로그인이 필요합니다' : 'Sign in required')}
              </Text>
              <Text style={styles.secondaryText}>
                {token
                  ? isKo
                    ? 'Google 계정으로 로그인됨'
                    : 'Signed in with Google'
                  : isKo
                    ? 'Journey 탭에서 Google 로그인 후 사용할 수 있습니다.'
                    : 'Sign in with Google from the Journey tab.'}
              </Text>
            </View>
            {token && (
              <TouchableOpacity style={styles.smallButton} onPress={handleLogout}>
                <Text style={styles.smallButtonText}>{isKo ? '로그아웃' : 'Logout'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isKo ? '언어' : 'Language'}</Text>
          <View style={styles.segmented}>
            <TouchableOpacity
              style={[styles.segment, lang === 'ko' && styles.segmentActive]}
              onPress={() => setLang('ko')}>
              <Text style={[styles.segmentText, lang === 'ko' && styles.segmentTextActive]}>KO</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, lang === 'en' && styles.segmentActive]}
              onPress={() => setLang('en')}>
              <Text style={[styles.segmentText, lang === 'en' && styles.segmentTextActive]}>EN</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isKo ? '바우처' : 'Vouchers'}</Text>
          <TouchableOpacity
            style={[styles.actionCard, !token && styles.disabledCard]}
            onPress={handleOpenVoucherWallet}
            disabled={!token}>
            <View>
              <Text style={styles.primaryText}>{isKo ? '내 상생 바우처 지갑' : 'My voucher wallet'}</Text>
              <Text style={styles.secondaryText}>
                {isKo ? `${vouchers.length}개 보유 중` : `${vouchers.length} available`}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isKo ? '관리자' : 'Admin'}</Text>
          <TouchableOpacity
            style={[styles.actionCard, !token && styles.disabledCard]}
            onPress={handleOpenAdminPanel}
            disabled={!token}>
            <View>
              <Text style={styles.primaryText}>
                {isKo ? '지자체 바우처 제휴 설정' : 'Local voucher partnership settings'}
              </Text>
              <Text style={styles.secondaryText}>
                {isKo
                  ? '인증센터별 바우처 발급 정책을 관리합니다.'
                  : 'Manage voucher policy by certification spot.'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, !token && styles.disabledCard]}
            onPress={handleOpenPoiAdminPanel}
            disabled={!token}>
            <View>
              <Text style={styles.primaryText}>
                {isKo ? 'POI 데이터 검수' : 'POI data review'}
              </Text>
              <Text style={styles.secondaryText}>
                {isKo
                  ? '출처, 라이선스, 노출 상태를 확인하고 지도 표시 여부를 관리합니다.'
                  : 'Review source, license, and map visibility for travel POIs.'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <VoucherWalletModal
        visible={isVouchersModalOpen}
        lang={lang}
        vouchers={vouchers}
        isRefreshing={isRefreshingVouchers}
        onRefresh={refreshVouchers}
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
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
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
    color: '#1E3A8A',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '900',
  },
  copy: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '900',
  },
  listCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  actionCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  disabledCard: {
    opacity: 0.55,
  },
  primaryText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  smallButton: {
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  smallButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  segmented: {
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    flexDirection: 'row',
    padding: 4,
  },
  segment: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 10,
  },
  segmentActive: {
    backgroundColor: '#1E3A8A',
  },
  segmentText: {
    color: '#475569',
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
