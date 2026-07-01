import { Platform } from 'react-native';

const localApiBase = Platform.select({
  android: 'http://10.0.2.2:8000/api/v1',
  default: 'http://127.0.0.1:8000/api/v1',
});

export const BACKEND_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL || localApiBase || 'http://127.0.0.1:8000/api/v1';

export const MAP_URL =
  process.env.EXPO_PUBLIC_MAP_URL || BACKEND_BASE.replace('/api/v1', '/map');

export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '849613742035-8qdt58uj7g6frgc2fo40f54upm1husnp.apps.googleusercontent.com';

export const GOOGLE_AUTH_PROXY_URI =
  process.env.EXPO_PUBLIC_GOOGLE_AUTH_PROXY_URI || 'https://auth.expo.io/@abfishlee/frontend';
