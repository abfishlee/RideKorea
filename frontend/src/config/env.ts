import { Platform } from 'react-native';

const localApiBase = Platform.select({
  android: 'http://10.0.2.2:8000/api/v1',
  default: 'http://127.0.0.1:8000/api/v1',
});

export const BACKEND_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL || localApiBase || 'http://127.0.0.1:8000/api/v1';

export const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID || '';
export const KAKAO_APP_KEY = process.env.EXPO_PUBLIC_KAKAO_APP_KEY || '';
export const MAP_PROVIDER = process.env.EXPO_PUBLIC_MAP_PROVIDER || (NAVER_CLIENT_ID ? 'naver' : 'kakao');

function buildDefaultMapUrl() {
  const baseMapUrl = BACKEND_BASE.replace('/api/v1', '/map');
  const params = new URLSearchParams();

  if (MAP_PROVIDER) {
    params.set('provider', MAP_PROVIDER);
  }
  if (NAVER_CLIENT_ID) {
    params.set('clientId', NAVER_CLIENT_ID);
  }
  if (KAKAO_APP_KEY) {
    params.set('appkey', KAKAO_APP_KEY);
  }

  const query = params.toString();
  return query ? `${baseMapUrl}?${query}` : baseMapUrl;
}

export const MAP_URL =
  process.env.EXPO_PUBLIC_MAP_URL || buildDefaultMapUrl();

export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '849613742035-8qdt58uj7g6frgc2fo40f54upm1husnp.apps.googleusercontent.com';

export const GOOGLE_AUTH_PROXY_URI =
  process.env.EXPO_PUBLIC_GOOGLE_AUTH_PROXY_URI || 'https://auth.expo.io/@abfishlee/frontend';
