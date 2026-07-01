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
