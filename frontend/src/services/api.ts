import { BACKEND_BASE } from '@/config/env';
import type {
  AuthResponse,
  Course,
  CourseDetail,
  Diary,
  Journey,
  JourneyTrackPoint,
  JourneyTrackPointInput,
  JourneyTrackSummary,
  PublishedSharedRoute,
  SharedRouteComment,
  SharedRouteLikeResult,
  Spot,
  TravelPoi,
  TravelPoiAdminUpdate,
  TravelPoiFeedbackResult,
  TravelPoiReport,
  TravelPoiReportStatus,
  TravelPoiReportType,
  UserProfile,
  Voucher,
  VoucherConfig,
  VoucherRedemption,
  VoucherSettlementSummary,
} from '@/types/ridekorea';

type RequestOptions = RequestInit & {
  token?: string | null;
};

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_BASE}${normalizedPath}`;
}

export function mediaUrl(path: string): string {
  return path.startsWith('/uploads') ? `${BACKEND_BASE.replace('/api/v1', '')}${path}` : path;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...requestOptions } = options;
  const response = await fetch(apiUrl(path), {
    ...requestOptions,
    headers: {
      ...(requestOptions.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function socialLogin(provider: 'google', idToken: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/social-login', {
    method: 'POST',
    body: JSON.stringify({
      id_token: idToken,
      provider,
    }),
  });
}

export function devLogin(): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/dev-login', {
    method: 'POST',
  });
}

export async function getCurrentUser(token: string): Promise<UserProfile> {
  const data = await apiFetch<any>('/auth/me', { token });
  return {
    displayName: data.display_name,
    photoUrl: data.profile_photo_url,
  };
}

export function getMyVouchers(token: string): Promise<Voucher[]> {
  return apiFetch<Voucher[]>('/vouchers/me', { token });
}

export function claimVoucher(
  token: string,
  spotId: string,
  location: { lat: number; lng: number },
  radiusMeters = 150,
): Promise<Voucher> {
  return apiFetch<Voucher>('/vouchers/claim', {
    method: 'POST',
    token,
    body: JSON.stringify({
      spot_id: spotId,
      location,
      radius_meters: radiusMeters,
    }),
  });
}

export function redeemVoucher(token: string, voucherId: string): Promise<Voucher> {
  return apiFetch<Voucher>(`/vouchers/${voucherId}/redeem`, {
    method: 'POST',
    token,
  });
}

export function getCourses(): Promise<Course[]> {
  return apiFetch<Course[]>('/courses/');
}

export function getCourseDetail(courseId: string): Promise<CourseDetail> {
  return apiFetch<CourseDetail>(`/courses/${courseId}`);
}

export function getSpots(courseId: string): Promise<Spot[]> {
  return apiFetch<Spot[]>(`/spots/?course_id=${courseId}`);
}

export function getTravelPoisInBounds(
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number,
  category?: string | null,
  token?: string | null,
): Promise<TravelPoi[]> {
  const categoryQuery = category ? `&category=${encodeURIComponent(category)}` : '';
  return apiFetch<TravelPoi[]>(
    `/travel-pois?min_lat=${minLat}&min_lng=${minLng}&max_lat=${maxLat}&max_lng=${maxLng}${categoryQuery}`,
    { token },
  );
}

export function getNearbyTravelPois(
  lat: number,
  lng: number,
  radiusMeters = 5000,
  category?: string | null,
  token?: string | null,
): Promise<TravelPoi[]> {
  const categoryQuery = category ? `&category=${encodeURIComponent(category)}` : '';
  return apiFetch<TravelPoi[]>(
    `/travel-pois/nearby?lat=${lat}&lng=${lng}&radius_meters=${radiusMeters}${categoryQuery}`,
    { token },
  );
}

export function setTravelPoiFeedback(
  token: string,
  poiId: string,
  feedbackType: 'recommend' | 'caution',
): Promise<TravelPoiFeedbackResult> {
  return apiFetch<TravelPoiFeedbackResult>(`/travel-pois/${poiId}/feedback`, {
    method: 'POST',
    token,
    body: JSON.stringify({ feedback_type: feedbackType }),
  });
}

export function createTravelPoiReport(
  token: string,
  poiId: string,
  reportType: TravelPoiReportType,
  note?: string | null,
): Promise<TravelPoiReport> {
  return apiFetch<TravelPoiReport>(`/travel-pois/${poiId}/reports`, {
    method: 'POST',
    token,
    body: JSON.stringify({ report_type: reportType, note }),
  });
}

export function getAdminTravelPois(
  token: string,
  reviewStatus?: string | null,
): Promise<TravelPoi[]> {
  const query = reviewStatus ? `?review_status=${encodeURIComponent(reviewStatus)}` : '';
  return apiFetch<TravelPoi[]>(`/admin/travel-pois/${query}`, { token });
}

export function updateAdminTravelPoi(
  token: string,
  poiId: string,
  updates: TravelPoiAdminUpdate,
): Promise<TravelPoi> {
  return apiFetch<TravelPoi>(`/admin/travel-pois/${poiId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(updates),
  });
}

export function lookupAdminVoucherByCode(token: string, code: string): Promise<Voucher> {
  return apiFetch<Voucher>('/admin/voucher-redemptions/lookup', {
    method: 'POST',
    token,
    body: JSON.stringify({ code }),
  });
}

export function redeemAdminVoucherByCode(token: string, code: string): Promise<Voucher> {
  return apiFetch<Voucher>('/admin/voucher-redemptions/redeem', {
    method: 'POST',
    token,
    body: JSON.stringify({ code }),
  });
}

export function getAdminVoucherRedemptions(token: string, limit = 20): Promise<VoucherRedemption[]> {
  return apiFetch<VoucherRedemption[]>(`/admin/voucher-redemptions?limit=${limit}`, { token });
}

export function getAdminVoucherSettlementSummary(token: string, days = 30): Promise<VoucherSettlementSummary> {
  return apiFetch<VoucherSettlementSummary>(`/admin/voucher-settlement-summary?days=${days}`, { token });
}

export function getAdminTravelPoiReports(
  token: string,
  status: TravelPoiReportStatus | null = 'open',
): Promise<TravelPoiReport[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<TravelPoiReport[]>(`/admin/travel-pois/reports${query}`, { token });
}

export function updateAdminTravelPoiReport(
  token: string,
  reportId: string,
  status: TravelPoiReportStatus,
): Promise<TravelPoiReport> {
  return apiFetch<TravelPoiReport>(`/admin/travel-pois/reports/${reportId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ status }),
  });
}

export function getAdminVoucherConfigs(token: string): Promise<VoucherConfig[]> {
  return apiFetch<VoucherConfig[]>('/admin/voucher-configs', { token });
}

export function saveVoucherConfig(
  token: string,
  config: VoucherConfig,
): Promise<VoucherConfig> {
  return apiFetch<VoucherConfig>('/admin/voucher-configs', {
    method: 'POST',
    token,
    body: JSON.stringify(config),
  });
}

export function getSpotDiaries(spotId: string): Promise<Diary[]> {
  return apiFetch<Diary[]>(`/diaries/spot/${spotId}`);
}

export function getRecentPublicDiaries(limit = 30): Promise<Diary[]> {
  return apiFetch<Diary[]>(`/diaries/public/recent?limit=${limit}`);
}

export function getPublicDiary(diaryId: string): Promise<Diary> {
  return apiFetch<Diary>(`/diaries/public/${diaryId}`);
}

export function getPublicDiariesInBounds(
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number,
): Promise<Diary[]> {
  return apiFetch<Diary[]>(
    `/diaries/public?min_lat=${minLat}&min_lng=${minLng}&max_lat=${maxLat}&max_lng=${maxLng}`,
  );
}

export async function uploadDiaryPhotos(token: string, photoUri: string): Promise<string[]> {
  if (photoUri.startsWith('http://') || photoUri.startsWith('https://')) {
    return [photoUri];
  }

  const formData = new FormData();
  const filename = photoUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('files', {
    uri: photoUri,
    name: filename,
    type,
  } as any);

  const urls = await apiFetch<string[]>('/diaries/upload-photos', {
    method: 'POST',
    token,
    body: formData,
  });

  return urls.map(mediaUrl);
}

export function createJourney(
  token: string,
  courseId: string,
  title: string,
  visibility = 'private',
): Promise<Journey> {
  return apiFetch<Journey>('/journeys/', {
    method: 'POST',
    token,
    body: JSON.stringify({
      course_id: courseId,
      title,
      visibility,
    }),
  });
}

export function getMyJourneys(token: string): Promise<Journey[]> {
  return apiFetch<Journey[]>('/journeys/', { token });
}

export function getJourney(token: string, journeyId: string): Promise<Journey> {
  return apiFetch<Journey>(`/journeys/${journeyId}`, { token });
}

export function updateJourneyStatus(
  token: string,
  journeyId: string,
  status: 'completed' | 'paused' | 'riding',
): Promise<Journey> {
  return apiFetch<Journey>(`/journeys/${journeyId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ status }),
  });
}

export function addJourneyTrackPoints(
  token: string,
  journeyId: string,
  points: JourneyTrackPointInput[],
): Promise<JourneyTrackPoint[]> {
  return apiFetch<JourneyTrackPoint[]>(`/journeys/${journeyId}/track-points`, {
    method: 'POST',
    token,
    body: JSON.stringify({ points }),
  });
}

export function getJourneyTrackPoints(
  token: string,
  journeyId: string,
): Promise<JourneyTrackPoint[]> {
  return apiFetch<JourneyTrackPoint[]>(`/journeys/${journeyId}/track-points`, { token });
}

export function getMyJourneyTrackSummaries(token: string): Promise<JourneyTrackSummary[]> {
  return apiFetch<JourneyTrackSummary[]>('/journeys/summaries', { token });
}

export function publishJourneyAsSharedRoute(
  token: string,
  journeyId: string,
): Promise<PublishedSharedRoute> {
  return apiFetch<PublishedSharedRoute>(`/shared-routes/from-journey/${journeyId}`, {
    method: 'POST',
    token,
  });
}

export function getPublishedSharedRoute(
  token: string,
  routeId: string,
): Promise<PublishedSharedRoute> {
  return apiFetch<PublishedSharedRoute>(`/shared-routes/${routeId}`, { token });
}

export function getPublicSharedRoutes(
  limit = 30,
  token?: string | null,
): Promise<PublishedSharedRoute[]> {
  return apiFetch<PublishedSharedRoute[]>(`/shared-routes/public?limit=${limit}`, { token });
}

export function getPublicSharedRoute(
  routeId: string,
  token?: string | null,
): Promise<PublishedSharedRoute> {
  return apiFetch<PublishedSharedRoute>(`/shared-routes/public/${routeId}`, { token });
}

export function updatePublishedSharedRouteVisibility(
  token: string,
  routeId: string,
  visibility: 'private' | 'public',
): Promise<PublishedSharedRoute> {
  return apiFetch<PublishedSharedRoute>(`/shared-routes/${routeId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ visibility }),
  });
}

export function recordPublicSharedRouteShare(routeId: string): Promise<PublishedSharedRoute> {
  return apiFetch<PublishedSharedRoute>(`/shared-routes/public/${routeId}/share`, {
    method: 'POST',
  });
}

export function likePublicSharedRoute(
  token: string,
  routeId: string,
): Promise<SharedRouteLikeResult> {
  return apiFetch<SharedRouteLikeResult>(`/shared-routes/public/${routeId}/like`, {
    method: 'POST',
    token,
  });
}

export function importPublicSharedRoute(
  token: string,
  routeId: string,
): Promise<Journey> {
  return apiFetch<Journey>(`/shared-routes/public/${routeId}/import`, {
    method: 'POST',
    token,
  });
}

export function getPublicSharedRouteComments(
  routeId: string,
  limit = 50,
): Promise<SharedRouteComment[]> {
  return apiFetch<SharedRouteComment[]>(`/shared-routes/public/${routeId}/comments?limit=${limit}`);
}

export function createPublicSharedRouteComment(
  token: string,
  routeId: string,
  body: string,
): Promise<SharedRouteComment> {
  return apiFetch<SharedRouteComment>(`/shared-routes/public/${routeId}/comments`, {
    method: 'POST',
    token,
    body: JSON.stringify({ body }),
  });
}

export function createSpotDiary(
  token: string,
  journeyId: string,
  spotId: string | null,
  sourceSharedRouteStopId: string | null,
  title: string | null,
  diaryText: string,
  photoUrls: string[],
  location?: { lat: number; lng: number } | null,
  visibility = 'private',
): Promise<Diary> {
  return apiFetch<Diary>(`/diaries/?journey_id=${journeyId}`, {
    method: 'POST',
    token,
    body: JSON.stringify({
      spot_id: spotId,
      source_shared_route_stop_id: sourceSharedRouteStopId,
      location,
      title,
      diary_text: diaryText,
      photo_urls: photoUrls,
      visibility,
    }),
  });
}

export function updateSpotDiaryVisibility(
  token: string,
  diaryId: string,
  visibility: 'private' | 'public',
): Promise<Diary> {
  return apiFetch<Diary>(`/diaries/${diaryId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ visibility }),
  });
}
