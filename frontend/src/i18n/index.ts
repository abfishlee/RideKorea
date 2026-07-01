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
