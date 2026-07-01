import type { AppLanguage } from '@/types/ridekorea';

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  ko: 'KO',
  en: 'EN',
  ja: 'JA',
};

export function nextLanguage(lang: AppLanguage): AppLanguage {
  if (lang === 'ko') return 'en';
  if (lang === 'en') return 'ja';
  return 'ko';
}

export function t(lang: AppLanguage, copy: Record<AppLanguage, string>): string {
  return copy[lang] || copy.en || copy.ko;
}

export const compassScreenCopy = {
  redeemVoucherTitle: {
    ko: '바우처 사용 완료',
    en: 'Redeem voucher',
    ja: 'バウチャー利用完了',
  },
  redeemVoucherBody: {
    ko: '제휴 매장에서 사용한 뒤에만 완료 처리해주세요. 이 작업은 되돌릴 수 없습니다.',
    en: 'Only mark this voucher after it has been used at a partner shop. This cannot be undone.',
    ja: '提携店舗で利用した後にのみ完了処理してください。この操作は元に戻せません。',
  },
  cancel: {
    ko: '취소',
    en: 'Cancel',
    ja: 'キャンセル',
  },
  redeem: {
    ko: '사용 완료',
    en: 'Redeem',
    ja: '利用完了',
  },
  redeemAction: {
    ko: '사용 처리',
    en: 'Redeem',
    ja: '利用処理',
  },
  done: {
    ko: '처리 완료',
    en: 'Redeemed',
    ja: '処理完了',
  },
  redeemVoucherDone: {
    ko: '바우처가 사용 완료 처리되었습니다.',
    en: 'The voucher has been marked as redeemed.',
    ja: 'バウチャーを利用完了にしました。',
  },
  error: {
    ko: '오류',
    en: 'Error',
    ja: 'エラー',
  },
  lookupFailed: {
    ko: '조회 실패',
    en: 'Lookup failed',
    ja: '照会失敗',
  },
  redeemByCodeTitle: {
    ko: '코드 사용 처리',
    en: 'Redeem by code',
    ja: 'コード利用処理',
  },
  redeemByCodeBody: {
    ko: '제휴 매장에서 실제 사용 확인 후 처리해주세요. 사용 완료 후에는 되돌릴 수 없습니다.',
    en: 'Confirm the voucher was used at a partner shop. This cannot be undone.',
    ja: '提携店舗で実際の利用を確認してから処理してください。完了後は元に戻せません。',
  },
  redeemCodeDone: {
    ko: '바우처 코드가 사용 완료 처리되었습니다.',
    en: 'The voucher code has been redeemed.',
    ja: 'バウチャーコードを利用完了にしました。',
  },
  redeemFailed: {
    ko: '처리 실패',
    en: 'Redeem failed',
    ja: '処理失敗',
  },
  settingsSavedTitle: {
    ko: '설정 저장 완료',
    en: 'Settings saved',
    ja: '設定を保存しました',
  },
  settingsSavedBody: {
    ko: '바우처 제휴 설정이 갱신되었습니다.',
    en: 'Voucher settings updated successfully.',
    ja: 'バウチャー提携設定を更新しました。',
  },
  logoutTitle: {
    ko: '로그아웃',
    en: 'Logout',
    ja: 'ログアウト',
  },
  logoutBody: {
    ko: '정상적으로 로그아웃되었습니다.',
    en: 'Logged out.',
    ja: 'ログアウトしました。',
  },
  title: {
    ko: '설정과 관리자 도구',
    en: 'Settings and admin tools',
    ja: '設定と管理ツール',
  },
  intro: {
    ko: '언어, 계정, 바우처 지갑, 지자체 제휴 설정을 이곳에서 관리합니다.',
    en: 'Manage language, account, voucher wallet, and local partnership settings here.',
    ja: '言語、アカウント、バウチャーウォレット、地域提携設定をここで管理します。',
  },
  account: {
    ko: '계정',
    en: 'Account',
    ja: 'アカウント',
  },
  signInRequired: {
    ko: '로그인이 필요합니다',
    en: 'Sign in required',
    ja: 'ログインが必要です',
  },
  signedInGoogle: {
    ko: 'Google 계정으로 로그인됨',
    en: 'Signed in with Google',
    ja: 'Googleアカウントでログイン中',
  },
  signInFromJourney: {
    ko: 'Journey 탭에서 Google 로그인 후 사용할 수 있습니다.',
    en: 'Sign in with Google from the Journey tab.',
    ja: 'JourneyタブでGoogleログイン後に利用できます。',
  },
  language: {
    ko: '언어',
    en: 'Language',
    ja: '言語',
  },
  vouchers: {
    ko: '바우처',
    en: 'Vouchers',
    ja: 'バウチャー',
  },
  wallet: {
    ko: '내 상생 바우처 지갑',
    en: 'My voucher wallet',
    ja: 'マイ地域バウチャーウォレット',
  },
  walletCount: {
    ko: '개 보유 중',
    en: 'available',
    ja: '件保有中',
  },
  admin: {
    ko: '관리자',
    en: 'Admin',
    ja: '管理者',
  },
  voucherSettings: {
    ko: '지자체 바우처 제휴 설정',
    en: 'Local voucher partnership settings',
    ja: '自治体バウチャー提携設定',
  },
  voucherSettingsBody: {
    ko: '인증센터별 바우처 발급 정책을 관리합니다.',
    en: 'Manage voucher policy by certification spot.',
    ja: '認証スポット別のバウチャー発行ポリシーを管理します。',
  },
  poiReview: {
    ko: 'POI 데이터 검수',
    en: 'POI data review',
    ja: 'POIデータ確認',
  },
  poiReviewBody: {
    ko: '출처, 라이선스, 노출 상태를 확인하고 지도 표시 여부를 관리합니다.',
    en: 'Review source, license, and map visibility for travel POIs.',
    ja: '出典、ライセンス、表示状態を確認し、地図表示を管理します。',
  },
  partnerRedemption: {
    ko: '제휴처 바우처 코드 처리',
    en: 'Partner voucher redemption',
    ja: '提携店バウチャーコード処理',
  },
  partnerRedemptionBody: {
    ko: '매장에서 받은 코드를 조회하고 사용 완료 처리합니다.',
    en: 'Look up and redeem a voucher code from a partner shop.',
    ja: '店舗で受け取ったコードを照会し、利用完了処理を行います。',
  },
  settlementTitleSuffix: {
    ko: '일 정산 요약',
    en: '-day settlement',
    ja: '日精算サマリー',
  },
  issuedAmountBasis: {
    ko: '발급 시점 금액 기준',
    en: 'Based on issued voucher amounts',
    ja: '発行時点の金額基準',
  },
  reload: {
    ko: '갱신',
    en: 'Reload',
    ja: '更新',
  },
  redeemedCount: {
    ko: '사용 건수',
    en: 'Redeemed',
    ja: '利用件数',
  },
  estimatedPayout: {
    ko: '예상 정산액',
    en: 'Estimated payout',
    ja: '精算見込額',
  },
  voucherCodePlaceholder: {
    ko: '바우처 코드 입력',
    en: 'Voucher code',
    ja: 'バウチャーコード入力',
  },
  lookup: {
    ko: '조회',
    en: 'Lookup',
    ja: '照会',
  },
  alreadyRedeemed: {
    ko: '이미 사용 완료됨',
    en: 'Already redeemed',
    ja: '利用済み',
  },
  readyToRedeem: {
    ko: '사용 가능',
    en: 'Ready to redeem',
    ja: '利用可能',
  },
  recentRedemptions: {
    ko: '최근 사용 처리',
    en: 'Recent redemptions',
    ja: '最近の利用処理',
  },
  emptyRedemptions: {
    ko: '아직 사용 처리 이력이 없습니다.',
    en: 'No redemption history yet.',
    ja: '利用処理履歴はまだありません。',
  },
} satisfies Record<string, Record<AppLanguage, string>>;

export const authCopy = {
  subtitle: {
    ko: '외국인 라이더를 위한 한국 자전거 종주 동반자',
    en: "Your cycling companion for Korea's cross-country routes",
    ja: '海外ライダーのための韓国自転車縦断ガイド',
  },
  panelTitle: {
    ko: 'SNS 계정으로 시작하기',
    en: 'Start with your social account',
    ja: 'SNSアカウントではじめる',
  },
  panelCopy: {
    ko: '1차 개발 범위에서는 Google 로그인만 지원합니다.',
    en: 'For this first build, RideKorea supports Google sign-in only.',
    ja: '初期版ではGoogleログインのみ対応しています。',
  },
  googleButton: {
    ko: 'Google로 계속하기',
    en: 'Continue with Google',
    ja: 'Googleで続ける',
  },
  legal: {
    ko: '계속하면 RideKorea의 이용약관 및 개인정보 처리방침에 동의하게 됩니다.',
    en: "By continuing, you agree to RideKorea's Terms and Privacy Policy.",
    ja: '続行すると、RideKoreaの利用規約とプライバシーポリシーに同意したものとみなされます。',
  },
  loginSuccessTitle: {
    ko: '로그인 완료',
    en: 'Signed in',
    ja: 'ログイン完了',
  },
  loginSuccessBody: {
    ko: 'Google 계정으로 로그인되었습니다.',
    en: 'You are signed in with Google.',
    ja: 'Googleアカウントでログインしました。',
  },
  loginFailedTitle: {
    ko: '로그인 실패',
    en: 'Sign-in failed',
    ja: 'ログイン失敗',
  },
  loginVerifyFailedBody: {
    ko: '로그인 응답을 확인하지 못했습니다. 다시 시도해주세요.',
    en: 'We could not verify the sign-in response. Please try again.',
    ja: 'ログイン応答を確認できませんでした。もう一度お試しください。',
  },
  loginTokenMissingBody: {
    ko: '로그인 토큰을 받지 못했습니다. 다시 시도해주세요.',
    en: 'We could not retrieve the sign-in token. Please try again.',
    ja: 'ログイントークンを取得できませんでした。もう一度お試しください。',
  },
  errorTitle: {
    ko: '오류',
    en: 'Error',
    ja: 'エラー',
  },
} satisfies Record<string, Record<AppLanguage, string>>;

export const journeyCopy = {
  rider: {
    ko: '라이더',
    en: 'Rider',
    ja: 'ライダー',
  },
  logout: {
    ko: '로그아웃',
    en: 'Logout',
    ja: 'ログアウト',
  },
  importedRoutes: {
    ko: '내가 가져온 루트',
    en: 'Imported routes',
    ja: '取り込んだルート',
  },
  loginRequiredTitle: {
    ko: '로그인이 필요해요',
    en: 'Login required',
    ja: 'ログインが必要です',
  },
  loginRequiredBody: {
    ko: '종주 기록을 시작하려면 먼저 소셜 로그인을 해주세요.',
    en: 'Please sign in before starting a journey.',
    ja: '走行記録を始める前にログインしてください。',
  },
  journeyStartedTitle: {
    ko: '종주 시작',
    en: 'Journey started',
    ja: '縦断スタート',
  },
  rideStartedTitle: {
    ko: '주행 시작',
    en: 'Ride started',
    ja: 'ライド開始',
  },
  journeyCompletedTitle: {
    ko: '종주 완료',
    en: 'Journey completed',
    ja: '縦断完了',
  },
  journeyCompletedBody: {
    ko: '주행 기록이 정상적으로 저장되었습니다.',
    en: 'Your riding record has been saved.',
    ja: '走行記録が保存されました。',
  },
  startJourneyRequiredTitle: {
    ko: '주행 시작 필요',
    en: 'Start a journey',
    ja: 'ライド開始が必要です',
  },
  locationDiaryNeedsJourney: {
    ko: '현재 위치 기록은 종주 기록을 시작한 뒤에 남길 수 있습니다.',
    en: 'Start a journey before adding a location diary.',
    ja: '現在地の記録はライド開始後に追加できます。',
  },
  plannedStopNeedsJourney: {
    ko: '가져온 루트 스팟에는 주행을 시작한 뒤에 내 기록을 남길 수 있습니다.',
    en: 'Start a journey before adding your own note to an imported route stop.',
    ja: '取り込んだルートのスポットには、ライド開始後に記録を残せます。',
  },
  waitingForGpsTitle: {
    ko: 'GPS 대기 중',
    en: 'Waiting for GPS',
    ja: 'GPS待機中',
  },
  waitingForGpsBody: {
    ko: '아직 현재 위치를 받아오지 못했습니다. 잠시 뒤 다시 시도해 주세요.',
    en: 'Your current location is not ready yet.',
    ja: '現在地をまだ取得できていません。少し待ってから再試行してください。',
  },
  locationRequiredTitle: {
    ko: '위치 정보 없음',
    en: 'Location required',
    ja: '位置情報が必要です',
  },
  locationRequiredBody: {
    ko: '현재 위치를 확인한 뒤 다시 기록해 주세요.',
    en: 'Please wait for your current location before saving.',
    ja: '現在地を確認してから保存してください。',
  },
  contentRequiredTitle: {
    ko: '내용 입력',
    en: 'Content required',
    ja: '内容を入力してください',
  },
  contentRequiredBody: {
    ko: '일지 내용을 입력해 주세요.',
    en: 'Please write diary content.',
    ja: '日記の内容を入力してください。',
  },
  ridingPhoto: {
    ko: '라이딩 사진',
    en: 'Riding photo',
    ja: 'ライド写真',
  },
  ridingDiary: {
    ko: '라이딩 기록',
    en: 'Riding diary',
    ja: 'ライド記録',
  },
  savedTitle: {
    ko: '작성 완료',
    en: 'Saved',
    ja: '保存しました',
  },
  savedBody: {
    ko: '라이딩 기록이 지도 위 일지로 저장되었습니다.',
    en: 'Your diary has been saved on the map.',
    ja: 'ライド記録が地図上の日記として保存されました。',
  },
  error: {
    ko: '오류',
    en: 'Error',
    ja: 'エラー',
  },
  logoutBody: {
    ko: '정상적으로 로그아웃되었습니다.',
    en: 'Logged out successfully.',
    ja: 'ログアウトしました。',
  },
  voucherUnlockedTitle: {
    ko: '지역 바우처가 열렸어요',
    en: 'Voucher unlocked',
    ja: '地域バウチャーを獲得しました',
  },
  voucherUnlockedBody: {
    ko: '주변에서 사용할 수 있는 바우처를 지갑에 담았습니다.',
    en: 'A voucher near this spot has been added to your wallet.',
    ja: 'このスポット周辺で使えるバウチャーをウォレットに追加しました。',
  },
  resumeRideTitle: {
    ko: '진행 중인 라이딩이 있어요',
    en: 'Resume ride?',
    ja: '進行中のライドがあります',
  },
  resumeRideBody: {
    ko: '기록을 이어서 진행할까요?',
    en: 'Continue recording this ride?',
    ja: 'このライド記録を再開しますか？',
  },
  discard: {
    ko: '삭제',
    en: 'Discard',
    ja: '削除',
  },
  resume: {
    ko: '이어서 주행',
    en: 'Resume',
    ja: '再開',
  },
  routeMissingTitle: {
    ko: '루트 없음',
    en: 'Route not found',
    ja: 'ルートがありません',
  },
  routeMissingBody: {
    ko: '가져온 루트 원본을 찾지 못했습니다.',
    en: 'Could not find the original imported route.',
    ja: '取り込んだルートの元データが見つかりません。',
  },
  sourceRouteMissingTitle: {
    ko: '원본 루트 없음',
    en: 'Source route missing',
    ja: '元ルートがありません',
  },
  sourceRouteMissingBody: {
    ko: '이 Journey에는 가져온 공유 루트가 연결되어 있지 않습니다.',
    en: 'This Journey is not linked to an imported shared route.',
    ja: 'このJourneyには取り込んだ共有ルートが紐づいていません。',
  },
  stopsMissingTitle: {
    ko: '스팟 없음',
    en: 'No stops',
    ja: 'スポットがありません',
  },
  stopsMissingBody: {
    ko: '지도에 표시할 원본 루트 스팟이 없습니다.',
    en: 'There are no source route stops to show on the map.',
    ja: '地図に表示する元ルートのスポットがありません。',
  },
  routePrepareFailedTitle: {
    ko: '루트 준비 실패',
    en: 'Route setup failed',
    ja: 'ルート準備に失敗しました',
  },
  routePrepareFailedBody: {
    ko: '가져온 루트를 불러오지 못했습니다.',
    en: 'Could not load the imported route.',
    ja: '取り込んだルートを読み込めませんでした。',
  },
  publicDiaryMissingTitle: {
    ko: '공개 일지 없음',
    en: 'Diary not found',
    ja: '公開日記がありません',
  },
  publicDiaryMissingBody: {
    ko: '지도에서 열 공개 일지를 찾지 못했습니다.',
    en: 'Could not find the public diary to open on the map.',
    ja: '地図で開く公開日記が見つかりません。',
  },
  waitingForLocationTitle: {
    ko: '현재 위치 대기 중',
    en: 'Waiting for location',
    ja: '現在地を取得中',
  },
  waitingForLocationBody: {
    ko: 'GPS 위치가 잡히면 주변 수리소, 식당, 숙소 정보를 볼 수 있습니다.',
    en: 'Nearby repair, food, and lodging information will appear after GPS is ready.',
    ja: 'GPS位置が取得できると、周辺の修理店、食堂、宿泊情報を確認できます。',
  },
  readyRideTitle: {
    ko: '출발 준비 완료',
    en: 'Ready to ride',
    ja: '出発準備完了',
  },
  readyRideBody: {
    ko: '이 루트를 기준으로 주행을 시작할 준비가 되었습니다. 실제 트랙 저장은 서버 Journey 루트에서 지원됩니다.',
    en: 'This route is ready. Actual track recording is supported for server-imported journeys.',
    ja: 'このルートを基準にライドを始める準備ができました。実際のトラック保存はサーバー連携Journeyで利用できます。',
  },
  plannedRideEndedTitle: {
    ko: '계획 주행 종료',
    en: 'Ride ended',
    ja: '計画ライド終了',
  },
  plannedRideEndedBody: {
    ko: '계획 주행 상태를 종료했습니다.',
    en: 'The planned ride state has ended.',
    ja: '計画ライド状態を終了しました。',
  },
  nearbyLoadFailedBody: {
    ko: '주변 여행 정보를 불러오지 못했습니다.',
    en: 'Failed to load nearby travel information.',
    ja: '周辺の旅行情報を読み込めませんでした。',
  },
  feedbackFailedTitle: {
    ko: '반응 저장 실패',
    en: 'Feedback failed',
    ja: '反応の保存に失敗しました',
  },
  feedbackFailedBody: {
    ko: 'POI 반응을 저장하지 못했습니다.',
    en: 'Could not save your POI feedback.',
    ja: 'POIへの反応を保存できませんでした。',
  },
  reportSubmittedTitle: {
    ko: '신고 접수 완료',
    en: 'Report submitted',
    ja: '報告を受け付けました',
  },
  reportSubmittedBody: {
    ko: '운영자 검수 목록에 추가했습니다. 지도 정보 개선을 도와주셔서 고마워요.',
    en: 'This POI has been added to the admin review queue. Thanks for helping improve the map.',
    ja: 'このPOIを管理者レビューに追加しました。地図情報の改善にご協力いただきありがとうございます。',
  },
  reportFailedTitle: {
    ko: '신고 실패',
    en: 'Report failed',
    ja: '報告に失敗しました',
  },
  reportFailedBody: {
    ko: 'POI 신고를 저장하지 못했습니다.',
    en: 'Could not submit this POI report.',
    ja: 'POI報告を送信できませんでした。',
  },
  spotCertification: {
    ko: '인증 스팟',
    en: 'Certification',
    ja: '認証スポット',
  },
  localReward: {
    ko: '지역 상생 혜택',
    en: 'Local Reward',
    ja: '地域特典',
  },
  regionStory: {
    ko: '이 지역의 이야기',
    en: 'Story of the Region',
    ja: 'この地域の物語',
  },
  noDescription: {
    ko: '상세 설명이 없습니다.',
    en: 'No English description available.',
    ja: '詳細説明はまだありません。',
  },
  certifyDiary: {
    ko: '스팟 인증 & 일지 작성',
    en: 'Certify Stamp & Write Diary',
    ja: 'スポット認証 & 日記を書く',
  },
  completeJourneyAction: {
    ko: '종주 완료',
    en: 'Complete',
    ja: '完了',
  },
  startJourneyAction: {
    ko: '종주 기록 시작하기',
    en: 'Start Riding Journey',
    ja: 'ライド記録を始める',
  },
  importedRoute: {
    ko: '가져온 루트',
    en: 'Imported route',
    ja: '取り込んだルート',
  },
  noRecord: {
    ko: '기록 없음',
    en: 'No record',
    ja: '記録なし',
  },
  hours: {
    ko: '시간',
    en: 'h',
    ja: '時間',
  },
  minutes: {
    ko: '분',
    en: 'm',
    ja: '分',
  },
  distance: {
    ko: '거리',
    en: 'Distance',
    ja: '距離',
  },
  estimatedTime: {
    ko: '예상 시간',
    en: 'Time',
    ja: '予想時間',
  },
  stops: {
    ko: '스팟',
    en: 'Stops',
    ja: 'スポット',
  },
  countSuffix: {
    ko: '개',
    en: '',
    ja: '件',
  },
  finish: {
    ko: '계획 주행 종료',
    en: 'Finish',
    ja: '計画ライド終了',
  },
  prepareRide: {
    ko: '이 루트로 출발 준비',
    en: 'Prepare Ride',
    ja: 'このルートで準備',
  },
  selectedRouteStop: {
    ko: '선택한 루트 스팟',
    en: 'this route stop',
    ja: '選択したルートスポット',
  },
  plannedStopDiarySubtitle: {
    ko: '에 내 기록을 남깁니다',
    en: 'Add your note to',
    ja: 'に自分の記録を残します',
  },
  currentPhotoSpotSubtitle: {
    ko: '현재 위치에 사진 스팟을 만듭니다',
    en: 'Create a photo spot here',
    ja: '現在地に写真スポットを作成します',
  },
  waitingForLocationShort: {
    ko: '위치 정보 대기 중',
    en: 'Waiting for location',
    ja: '位置情報を待機中',
  },
  diaryModalTitle: {
    ko: '라이딩 기록 남기기',
    en: 'Riding Diary',
    ja: 'ライド記録を書く',
  },
  diaryTitlePlaceholder: {
    ko: '제목, 예: 드디어 출발',
    en: 'Title, e.g. Finally rolling',
    ja: 'タイトル、例: ついに出発',
  },
  diaryBodyPlaceholder: {
    ko: '오늘의 길, 날씨, 수리점, 식당, 만난 사람들을 짧게 남겨보세요.',
    en: 'Write a short diary about the road, weather, repair shops, food, or people you met.',
    ja: '今日の道、天気、修理店、食事、出会った人について短く残しましょう。',
  },
  photoPinHint: {
    ko: '사진을 선택하면 현재 위치에 마커가 생깁니다',
    en: 'Pick a photo to pin it here',
    ja: '写真を選ぶと現在地にマーカーが作られます',
  },
  samplePhotoRiverside: {
    ko: '강변 라이딩',
    en: 'Riverside',
    ja: '川沿いライド',
  },
  samplePhotoBike: {
    ko: '나의 자전거',
    en: 'My Bike',
    ja: '私の自転車',
  },
  samplePhotoValley: {
    ko: '계곡 풍경',
    en: 'Valley',
    ja: '渓谷の風景',
  },
  cancel: {
    ko: '취소',
    en: 'Cancel',
    ja: 'キャンセル',
  },
  saveDiaryAction: {
    ko: '기록 저장',
    en: 'Save Diary',
    ja: '記録を保存',
  },
  cannotOpenTitle: {
    ko: '열 수 없음',
    en: 'Cannot open',
    ja: '開けません',
  },
  cannotOpenBody: {
    ko: '이 기기에서 해당 동작을 실행할 수 없습니다.',
    en: 'This action is not available on this device.',
    ja: 'この端末ではこの操作を実行できません。',
  },
  noPoiDescription: {
    ko: '아직 상세 설명이 없습니다.',
    en: 'No detailed description yet.',
    ja: '詳細説明はまだありません。',
  },
  bikeTransferCheck: {
    ko: '자전거 이동 체크',
    en: 'Bike transfer check',
    ja: '自転車移動チェック',
  },
  bikePolicyFallback: {
    ko: '출발 전 항공, 철도, 버스 규정을 다시 확인하세요. 포장 규격과 탑승 가능 시간은 노선별로 달라질 수 있습니다.',
    en: 'Before travel, re-check airline, rail, and bus rules. Packing size and boarding rules can vary by route.',
    ja: '出発前に航空、鉄道、バスの規定を再確認してください。梱包サイズや乗車可能時間は路線ごとに異なる場合があります。',
  },
  bikePackingRequired: {
    ko: '자전거 포장 필요',
    en: 'Bike packing required',
    ja: '自転車の梱包が必要',
  },
  checkPackingConditions: {
    ko: '포장 조건 확인 필요',
    en: 'Check packing conditions',
    ja: '梱包条件の確認が必要',
  },
  openOfficialGuide: {
    ko: '공식 안내 보기',
    en: 'Open official guide',
    ja: '公式案内を見る',
  },
  call: {
    ko: '전화',
    en: 'Call',
    ja: '電話',
  },
  map: {
    ko: '지도',
    en: 'Map',
    ja: '地図',
  },
  directions: {
    ko: '길찾기',
    en: 'Directions',
    ja: 'ルート案内',
  },
  search: {
    ko: '주소검색',
    en: 'Search',
    ja: '住所検索',
  },
  recommend: {
    ko: '추천',
    en: 'Recommend',
    ja: 'おすすめ',
  },
  caution: {
    ko: '주의',
    en: 'Caution',
    ja: '注意',
  },
  wrongInfoPrompt: {
    ko: '정보가 틀렸나요?',
    en: 'Is this information wrong?',
    ja: '情報が違いますか？',
  },
  reportClosed: {
    ko: '폐업',
    en: 'Closed',
    ja: '閉業',
  },
  reportLocation: {
    ko: '위치오류',
    en: 'Location',
    ja: '位置違い',
  },
  reportDanger: {
    ko: '위험',
    en: 'Danger',
    ja: '危険',
  },
  dataSource: {
    ko: '데이터 출처',
    en: 'Data source',
    ja: 'データ出典',
  },
  checked: {
    ko: '확인',
    en: 'Checked',
    ja: '確認',
  },
  openSource: {
    ko: '원문 보기',
    en: 'Open source',
    ja: '原文を見る',
  },
  publicRidingDiary: {
    ko: '공개 라이딩 기록',
    en: 'Public Diary',
    ja: '公開ライド日記',
  },
  untitledPublicDiary: {
    ko: '제목 없는 기록',
    en: 'Untitled diary',
    ja: 'タイトルなしの日記',
  },
  noPublicDiaryText: {
    ko: '아직 본문이 없는 공개 기록입니다.',
    en: 'No diary text yet.',
    ja: '本文がまだない公開記録です。',
  },
  openMoments: {
    ko: 'Moments에서 더 보기',
    en: 'Open Moments',
    ja: 'Momentsでさらに見る',
  },
  stopPhoto: {
    ko: '사진 기록',
    en: 'Photo',
    ja: '写真記録',
  },
  stopRepair: {
    ko: '수리',
    en: 'Repair',
    ja: '修理',
  },
  stopFood: {
    ko: '맛집',
    en: 'Food',
    ja: '食事',
  },
  stopLodging: {
    ko: '숙소',
    en: 'Lodging',
    ja: '宿泊',
  },
  stopScenic: {
    ko: '경치',
    en: 'Scenic',
    ja: '景色',
  },
  stopTransport: {
    ko: '교통',
    en: 'Transport',
    ja: '交通',
  },
  stopNote: {
    ko: '메모',
    en: 'Note',
    ja: 'メモ',
  },
  noSharedStopNote: {
    ko: '이 스팟에는 아직 상세 메모가 없습니다.',
    en: 'No detail note for this stop yet.',
    ja: 'このスポットにはまだ詳細メモがありません。',
  },
  addMyNoteHere: {
    ko: '이 스팟에 내 기록 남기기',
    en: 'Add my note here',
    ja: 'このスポットに自分の記録を残す',
  },
} satisfies Record<string, Record<AppLanguage, string>>;

export const momentsCopy = {
  title: {
    ko: '라이더들이 남긴 한국 종단의 조각들',
    en: 'Cross-Korea stories from real riders',
    ja: 'ライダーが残した韓国縦断の記録',
  },
  copy: {
    ko: '공식 코스만으로 부족한 수리점, 동선, 맛집, 교통 정보를 실제 라이더의 루트와 일지로 확인합니다.',
    en: 'Find repair stops, detours, food, and transport tips through routes and diaries from riders.',
    ja: '公式ルートだけでは足りない修理店、移動、食事、交通情報を実際のルートと日記で確認できます。',
  },
  sharedRoutes: {
    ko: '공유 루트',
    en: 'Shared routes',
    ja: '共有ルート',
  },
  publicDiaries: {
    ko: '공개 일지',
    en: 'Public diaries',
    ja: '公開日記',
  },
  loadingRoutes: {
    ko: '공유 루트를 불러오는 중입니다.',
    en: 'Loading shared routes.',
    ja: '共有ルートを読み込んでいます。',
  },
  routeLoadFailed: {
    ko: '공유 루트를 불러오지 못했습니다',
    en: 'Could not load shared routes',
    ja: '共有ルートを読み込めませんでした',
  },
  loadingDiaries: {
    ko: '공개 기록을 불러오는 중입니다.',
    en: 'Loading public diaries.',
    ja: '公開記録を読み込んでいます。',
  },
  diaryLoadFailed: {
    ko: '피드를 불러오지 못했습니다',
    en: 'Could not load the feed',
    ja: 'フィードを読み込めませんでした',
  },
  emptyDiariesTitle: {
    ko: '아직 공개된 라이딩 기록이 없습니다',
    en: 'No public riding diaries yet',
    ja: '公開されたライド記録はまだありません',
  },
  emptyDiariesBody: {
    ko: 'Journey에서 스팟을 인증하고 일지를 공개하면 여기에 모입니다.',
    en: 'Diaries shared from verified Journey spots will appear here.',
    ja: 'Journeyでスポットを記録して公開すると、ここに表示されます。',
  },
  retry: {
    ko: '다시 시도',
    en: 'Retry',
    ja: '再試行',
  },
  routeAddedTitle: {
    ko: '루트 추가 완료',
    en: 'Route added',
    ja: 'ルートを追加しました',
  },
  routeAddedBody: {
    ko: '루트를 My Path의 Journey 계획으로 저장했습니다.',
    en: 'This route was saved as a Journey plan in My Path.',
    ja: 'このルートをMy PathのJourney計画に保存しました。',
  },
  keepBrowsing: {
    ko: '계속 보기',
    en: 'Keep browsing',
    ja: '続けて見る',
  },
  goToMyPath: {
    ko: 'My Path로 이동',
    en: 'Go to My Path',
    ja: 'My Pathへ',
  },
  openJourney: {
    ko: 'Journey 열기',
    en: 'Open Journey',
    ja: 'Journeyを開く',
  },
  loginRequiredTitle: {
    ko: '로그인이 필요합니다',
    en: 'Login required',
    ja: 'ログインが必要です',
  },
  loginRequiredBody: {
    ko: '공개 루트를 내 Journey 계획으로 가져오려면 먼저 Google 로그인을 완료해 주세요.',
    en: 'Sign in with Google before importing a public route into your Journey plan.',
    ja: '公開ルートをJourney計画に取り込むには、先にGoogleログインを完了してください。',
  },
  saveFailed: {
    ko: '저장 실패',
    en: 'Save failed',
    ja: '保存に失敗しました',
  },
  saveFailedBody: {
    ko: '루트 초안을 저장하지 못했습니다.',
    en: 'Could not save the route draft.',
    ja: 'ルート下書きを保存できませんでした。',
  },
  defaultRouteSummary: {
    ko: '라이더가 직접 남긴 사진과 메모로 구성한 공유 루트입니다.',
    en: 'A shared route built from rider photos and notes.',
    ja: 'ライダーの写真とメモで構成された共有ルートです。',
  },
  unknownStart: {
    ko: '출발지 미정',
    en: 'Unknown start',
    ja: '出発地未定',
  },
  unknownEnd: {
    ko: '도착지 미정',
    en: 'Unknown finish',
    ja: '到着地未定',
  },
  riderShared: {
    ko: '라이더 공유',
    en: 'Rider shared',
    ja: 'ライダー共有',
  },
  publicRoute: {
    ko: '공개 루트',
    en: 'Public route',
    ja: '公開ルート',
  },
  draft: {
    ko: '초안',
    en: 'Draft',
    ja: '下書き',
  },
  anonymousRider: {
    ko: '익명 라이더',
    en: 'Anonymous Rider',
    ja: '匿名ライダー',
  },
  untitledDiary: {
    ko: '제목 없는 라이딩 기록',
    en: 'Untitled riding diary',
    ja: '無題のライド記録',
  },
  emptyDiaryText: {
    ko: '아직 본문이 없는 공개 기록입니다.',
    en: 'No diary text yet.',
    ja: '本文はまだありません。',
  },
  viewOnMap: {
    ko: '지도에서 보기',
    en: 'View on map',
    ja: '地図で見る',
  },
  publicRecordLoadFailed: {
    ko: '공개 기록을 불러오지 못했습니다.',
    en: 'Could not load public records.',
    ja: '公開記録を読み込めませんでした。',
  },
  liked: {
    ko: '추천 완료',
    en: 'Liked',
    ja: 'おすすめ済み',
  },
  likes: {
    ko: '추천',
    en: 'likes',
    ja: 'おすすめ',
  },
  distance: {
    ko: '거리',
    en: 'Distance',
    ja: '距離',
  },
  time: {
    ko: '시간',
    en: 'Time',
    ja: '時間',
  },
  records: {
    ko: '기록',
    en: 'Records',
    ja: '記録',
  },
  stops: {
    ko: '스팟',
    en: 'stops',
    ja: 'スポット',
  },
  featuredNote: {
    ko: '대표 메모',
    en: 'Featured note',
    ja: '代表メモ',
  },
  defaultStopNote: {
    ko: '라이더가 남긴 스팟 기록을 확인해 보세요.',
    en: 'Open the route to read the rider notes for this stop.',
    ja: 'ライダーが残したスポット記録を確認してみましょう。',
  },
  comments: {
    ko: '댓글',
    en: 'comments',
    ja: 'コメント',
  },
  shares: {
    ko: '공유',
    en: 'shares',
    ja: '共有',
  },
  importRoute: {
    ko: '내 루트로 가져오기',
    en: 'Import route',
    ja: '自分のルートに追加',
  },
  noRecord: {
    ko: '기록 없음',
    en: 'No record',
    ja: '記録なし',
  },
  hours: {
    ko: '시간',
    en: 'h',
    ja: '時間',
  },
  minutes: {
    ko: '분',
    en: 'm',
    ja: '分',
  },
  sharedRoutePreview: {
    ko: '공유 루트 미리보기',
    en: 'Shared Route Preview',
    ja: '共有ルートプレビュー',
  },
  noTime: {
    ko: '시간 없음',
    en: 'No time',
    ja: '時刻なし',
  },
  public: {
    ko: '공개',
    en: 'Public',
    ja: '公開',
  },
  privateDraft: {
    ko: '비공개 초안',
    en: 'Private draft',
    ja: '非公開下書き',
  },
  visibilityUpdateFailed: {
    ko: '공개 설정을 변경하지 못했습니다.',
    en: 'Could not update visibility.',
    ja: '公開設定を変更できませんでした。',
  },
  shareRecordFailed: {
    ko: '공유 횟수를 기록하지 못했습니다.',
    en: 'Could not record this share.',
    ja: '共有回数を記録できませんでした。',
  },
  likeRecordFailed: {
    ko: '추천을 기록하지 못했습니다.',
    en: 'Could not record this like.',
    ja: 'おすすめを記録できませんでした。',
  },
  importPublicRouteFailed: {
    ko: '공유 루트를 내 Journey로 가져오지 못했습니다.',
    en: 'Could not import this shared route into Journey.',
    ja: '共有ルートをJourneyに取り込めませんでした。',
  },
  commentCreateFailed: {
    ko: '댓글을 남기지 못했습니다.',
    en: 'Could not post your comment.',
    ja: 'コメントを投稿できませんでした。',
  },
  loadingSharedRoute: {
    ko: '공유 루트를 불러오는 중입니다.',
    en: 'Loading shared route.',
    ja: '共有ルートを読み込み中です。',
  },
  back: {
    ko: '뒤로',
    en: 'Back',
    ja: '戻る',
  },
  routeOpenFailedTitle: {
    ko: '루트를 불러오지 못했습니다',
    en: 'Could not load route',
    ja: 'ルートを読み込めませんでした',
  },
  routeDraftFallback: {
    ko: '라이딩 중 남긴 기록을 바탕으로 만든 공유 루트 초안입니다.',
    en: 'A shared route draft built from notes left during the ride.',
    ja: 'ライド中に残した記録をもとに作成した共有ルートの下書きです。',
  },
  publishCheckTitle: {
    ko: '공개 전 확인',
    en: 'Before publishing',
    ja: '公開前の確認',
  },
  publishCheckBody: {
    ko: '사진, 위치, 제목, 본문이 여행기처럼 자연스럽게 이어지는지 확인해 주세요. 공개하면 Moments의 공유 루트 탭에 표시됩니다.',
    en: 'Check that photos, locations, titles, and notes read naturally as a travel story. Public routes appear in Moments.',
    ja: '写真、位置、タイトル、本文が旅行記のように自然につながるか確認してください。公開するとMomentsの共有ルートに表示されます。',
  },
  changing: {
    ko: '변경 중',
    en: 'Updating',
    ja: '変更中',
  },
  makePrivate: {
    ko: '비공개로 돌리기',
    en: 'Make private',
    ja: '非公開に戻す',
  },
  publishToMoments: {
    ko: 'Moments에 공개하기',
    en: 'Publish to Moments',
    ja: 'Momentsに公開',
  },
  loginToLike: {
    ko: '로그인 후 추천',
    en: 'Sign in to like',
    ja: 'ログインしておすすめ',
  },
  likeDone: {
    ko: '추천 완료',
    en: 'Liked',
    ja: 'おすすめ済み',
  },
  liking: {
    ko: '추천 중',
    en: 'Liking',
    ja: 'おすすめ中',
  },
  likeAction: {
    ko: '추천하기',
    en: 'Like',
    ja: 'おすすめ',
  },
  recordingShare: {
    ko: '공유 기록 중',
    en: 'Recording',
    ja: '記録中',
  },
  recordShare: {
    ko: '공유 카운트 기록',
    en: 'Record share',
    ja: '共有回数を記録',
  },
  loginToImportRoute: {
    ko: '로그인 후 내 루트로 가져오기',
    en: 'Sign in to import',
    ja: 'ログインして取り込む',
  },
  importing: {
    ko: '가져오는 중',
    en: 'Importing',
    ja: '取り込み中',
  },
  importToJourney: {
    ko: '내 Journey로 가져오기',
    en: 'Import to Journey',
    ja: 'Journeyに取り込む',
  },
  commentsTitle: {
    ko: '댓글',
    en: 'Comments',
    ja: 'コメント',
  },
  noCommentsBody: {
    ko: '아직 댓글이 없습니다. 이 루트를 준비하는 라이더에게 첫 질문을 남겨보세요.',
    en: 'No comments yet. Leave the first question for riders preparing this route.',
    ja: 'コメントはまだありません。このルートを準備するライダーへ最初の質問を残してみましょう。',
  },
  commentPlaceholder: {
    ko: '루트에 대한 질문이나 응원을 남겨보세요.',
    en: 'Leave a question or encouragement about this route.',
    ja: 'このルートへの質問や応援を残しましょう。',
  },
  registering: {
    ko: '등록 중',
    en: 'Posting',
    ja: '投稿中',
  },
  leaveComment: {
    ko: '댓글 남기기',
    en: 'Post comment',
    ja: 'コメントする',
  },
  commentLoginBody: {
    ko: '댓글을 남기려면 Journey 탭에서 Google 로그인 후 다시 열어주세요.',
    en: 'Sign in with Google from Journey, then reopen this route to comment.',
    ja: 'コメントするにはJourneyタブでGoogleログイン後、このルートをもう一度開いてください。',
  },
  sharedTimeline: {
    ko: '공유 타임라인',
    en: 'Shared timeline',
    ja: '共有タイムライン',
  },
  noShareRecordsTitle: {
    ko: '공유할 기록이 없습니다',
    en: 'No records to share',
    ja: '共有できる記録がありません',
  },
  noShareRecordsBody: {
    ko: '라이딩 중 사진과 메모를 남긴 뒤 다시 초안을 만들어 주세요.',
    en: 'Add photos and notes while riding, then create the draft again.',
    ja: 'ライド中に写真とメモを残してから、もう一度下書きを作成してください。',
  },
  untitledStop: {
    ko: '제목 없는 스팟',
    en: 'Untitled stop',
    ja: 'タイトルなしスポット',
  },
  draftNotFoundTitle: {
    ko: '초안을 찾을 수 없습니다',
    en: 'Draft not found',
    ja: '下書きが見つかりません',
  },
  draftNotFoundBody: {
    ko: 'Journey 기록에서 다시 생성해 주세요.',
    en: 'Please create it again from your Journey record.',
    ja: 'Journey記録からもう一度作成してください。',
  },
} satisfies Record<string, Record<AppLanguage, string>>;

export const myPathCopy = {
  title: {
    ko: '준비 중인 길과 내가 남긴 기록',
    en: 'Plans in progress and rides I recorded',
    ja: '準備中の道と自分の記録',
  },
  copy: {
    ko: '가져온 공유 루트, 진행 중인 종주, 완료한 기록을 한곳에서 확인합니다.',
    en: 'Review imported routes, active journeys, and completed ride records in one place.',
    ja: '取り込んだ共有ルート、進行中の縦断、完了した記録を一か所で確認できます。',
  },
  loading: {
    ko: '내 기록을 불러오는 중입니다.',
    en: 'Loading your records.',
    ja: '自分の記録を読み込んでいます。',
  },
  loadFailed: {
    ko: '기록을 불러오지 못했습니다',
    en: 'Could not load records',
    ja: '記録を読み込めませんでした',
  },
  retry: {
    ko: '다시 시도',
    en: 'Retry',
    ja: '再試行',
  },
  totalRoutes: {
    ko: '전체 경로',
    en: 'Total paths',
    ja: '全ルート',
  },
  completedRecords: {
    ko: '완료 기록',
    en: 'Completed',
    ja: '完了記録',
  },
  recordedDistance: {
    ko: '기록 거리',
    en: 'Recorded distance',
    ja: '記録距離',
  },
  importedRoutes: {
    ko: '가져온 루트',
    en: 'Imported routes',
    ja: '取り込んだルート',
  },
  authorLine: {
    ko: '{author}의 공유 루트',
    en: 'from {author}',
    ja: '{author}さんの共有ルート',
  },
  routeLine: {
    ko: '{start}에서 {end}까지',
    en: '{start} to {end}',
    ja: '{start}から{end}まで',
  },
  startPlan: {
    ko: '출발 전 계획',
    en: 'Pre-ride plans',
    ja: '出発前の計画',
  },
  plan: {
    ko: '계획',
    en: 'Plan',
    ja: '計画',
  },
  distance: {
    ko: '거리',
    en: 'Distance',
    ja: '距離',
  },
  plannedTime: {
    ko: '예상 시간',
    en: 'Planned time',
    ja: '予定時間',
  },
  stops: {
    ko: '스팟',
    en: 'Stops',
    ja: 'スポット',
  },
  imported: {
    ko: '가져옴',
    en: 'imported',
    ja: '取り込み',
  },
  prepareInJourney: {
    ko: 'Journey에서 준비',
    en: 'Prepare in Journey',
    ja: 'Journeyで準備',
  },
  delete: {
    ko: '삭제',
    en: 'Delete',
    ja: '削除',
  },
  loginRequiredTitle: {
    ko: '로그인이 필요합니다',
    en: 'Login required',
    ja: 'ログインが必要です',
  },
  loginRequiredBody: {
    ko: 'Journey 탭에서 Google 로그인을 완료하면 실제 종주 기록을 볼 수 있습니다.',
    en: 'Sign in with Google on the Journey tab to see your actual ride records.',
    ja: 'JourneyタブでGoogleログインを完了すると、実際の縦断記録を確認できます。',
  },
  emptyJourneyTitle: {
    ko: '아직 시작한 종주가 없습니다',
    en: 'No journeys started yet',
    ja: '開始した縦断はまだありません',
  },
  emptyJourneyBody: {
    ko: 'Journey 탭에서 코스를 선택하고 종주 기록을 시작해보세요.',
    en: 'Choose a course in Journey and start recording your ride.',
    ja: 'Journeyタブでコースを選び、ライド記録を始めてみましょう。',
  },
  myRideRecords: {
    ko: '내 주행 기록',
    en: 'My ride records',
    ja: '自分の走行記録',
  },
  detailedTimeline: {
    ko: '상세 타임라인',
    en: 'Detailed timeline',
    ja: '詳細タイムライン',
  },
  time: {
    ko: '시간',
    en: 'Time',
    ja: '時間',
  },
  createdAt: {
    ko: '생성일',
    en: 'Created',
    ja: '作成日',
  },
  completedAt: {
    ko: '완료일',
    en: 'Completed',
    ja: '完了日',
  },
  diaries: {
    ko: '일지',
    en: 'Diaries',
    ja: '日記',
  },
  offRouteHint: {
    ko: '루트 이탈 포인트가 기록되었습니다.',
    en: 'off-route points were recorded.',
    ja: '件のルート離脱ポイントが記録されました。',
  },
  recentTimeline: {
    ko: '최근 타임라인',
    en: 'Recent timeline',
    ja: '最近のタイムライン',
  },
  noDiaryYet: {
    ko: '아직 기록된 일지가 없습니다.',
    en: 'No diaries recorded yet.',
    ja: '記録された日記はまだありません。',
  },
  deleteDraftTitle: {
    ko: '초안 삭제',
    en: 'Delete draft',
    ja: '下書きを削除',
  },
  deleteDraftBody: {
    ko: '루트 초안을 삭제할까요?',
    en: 'Delete this route draft?',
    ja: 'このルート下書きを削除しますか？',
  },
  cancel: {
    ko: '취소',
    en: 'Cancel',
    ja: 'キャンセル',
  },
  noDate: {
    ko: '날짜 없음',
    en: 'No date',
    ja: '日付なし',
  },
  noRecord: {
    ko: '기록 없음',
    en: 'No record',
    ja: '記録なし',
  },
  hours: {
    ko: '시간',
    en: 'h',
    ja: '時間',
  },
  minutes: {
    ko: '분',
    en: 'm',
    ja: '分',
  },
  completed: {
    ko: '완료',
    en: 'Completed',
    ja: '完了',
  },
  riding: {
    ko: '진행 중',
    en: 'Riding',
    ja: '進行中',
  },
  paused: {
    ko: '일시정지',
    en: 'Paused',
    ja: '一時停止',
  },
  planning: {
    ko: '준비 중',
    en: 'Planning',
    ja: '準備中',
  },
  record: {
    ko: '기록',
    en: 'Record',
    ja: '記録',
  },
  loadFailedBody: {
    ko: '내 종주 기록을 불러오지 못했습니다.',
    en: 'Could not load your journeys.',
    ja: '自分の縦断記録を読み込めませんでした。',
  },
} satisfies Record<string, Record<AppLanguage, string>>;

export const poiCopy = {
  nearbyBadge: {
    ko: '주변 여행 정보',
    en: 'Nearby travel info',
    ja: '周辺の旅情報',
  },
  nearbyTitle: {
    ko: '지금 필요한 장소를 빠르게 확인하세요',
    en: 'Find rider-friendly places nearby',
    ja: '今必要な場所をすばやく確認',
  },
  loadingNearby: {
    ko: '현재 위치 주변 정보를 불러오는 중입니다.',
    en: 'Loading nearby rider information.',
    ja: '現在地周辺の情報を読み込んでいます。',
  },
  emptyNearby: {
    ko: '아직 이 주변에 등록된 여행 정보가 없습니다.',
    en: 'No travel information has been added around here yet.',
    ja: 'この周辺の旅情報はまだ登録されていません。',
  },
  retry: {
    ko: '다시 시도',
    en: 'Retry',
    ja: '再試行',
  },
  repair: {
    ko: '수리',
    en: 'Repair',
    ja: '修理',
  },
  food: {
    ko: '맛집',
    en: 'Food',
    ja: '食事',
  },
  lodging: {
    ko: '숙소',
    en: 'Lodging',
    ja: '宿泊',
  },
  scenic: {
    ko: '경치',
    en: 'Scenic',
    ja: '景色',
  },
  transport: {
    ko: '교통',
    en: 'Transport',
    ja: '交通',
  },
  culture: {
    ko: '문화',
    en: 'Culture',
    ja: '文化',
  },
} satisfies Record<string, Record<AppLanguage, string>>;
