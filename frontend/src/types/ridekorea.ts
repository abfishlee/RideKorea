export type AppLanguage = 'ko' | 'en' | 'ja';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Course {
  id: string;
  name: string;
  name_en: string;
  distance_km: number;
  difficulty: string;
}

export interface CourseDetail extends Course {
  route_geometry?: {
    coordinates: [number, number][];
  };
}

export interface Spot {
  id: string;
  name: string;
  name_en: string;
  type: string;
  location: LatLng;
  description: string;
  description_en: string;
  is_voucher_active?: boolean;
  voucher_amount?: number;
}

export type TravelPoiCategory =
  | 'repair'
  | 'food'
  | 'lodging'
  | 'scenic'
  | 'transport'
  | 'culture';

export interface TravelPoi {
  id: string;
  name: string;
  name_en: string;
  category: TravelPoiCategory | string;
  location: LatLng;
  description?: string | null;
  description_en?: string | null;
  address?: string | null;
  phone?: string | null;
  source?: string | null;
  external_id?: string | null;
  source_url?: string | null;
  source_name?: string | null;
  license_type?: string | null;
  attribution?: string | null;
  retrieved_at?: string | null;
  review_status?: string;
  transport_mode?: string | null;
  route_name?: string | null;
  bike_policy?: string | null;
  bike_policy_en?: string | null;
  packing_required?: boolean | null;
  packing_notes?: string | null;
  packing_notes_en?: string | null;
  booking_url?: string | null;
  recommend_count: number;
  caution_count: number;
  my_feedback?: 'recommend' | 'caution' | null;
  is_active: boolean;
  created_at: string;
}

export interface TravelPoiFeedbackResult {
  feedback_type?: 'recommend' | 'caution' | null;
  poi: TravelPoi;
}

export type TravelPoiReportType = 'closed' | 'wrong_location' | 'danger' | 'other';
export type TravelPoiReportStatus = 'open' | 'resolved' | 'dismissed';

export interface TravelPoiReport {
  id: string;
  poi_id: string;
  user_id: string;
  report_type: TravelPoiReportType;
  note?: string | null;
  status: TravelPoiReportStatus;
  created_at: string;
  resolved_at?: string | null;
  poi: TravelPoi;
  author: {
    display_name?: string | null;
    profile_photo_url?: string | null;
  };
}

export interface TravelPoiAdminUpdate {
  source_url?: string | null;
  source_name?: string | null;
  license_type?: string | null;
  attribution?: string | null;
  retrieved_at?: string | null;
  review_status?: 'approved' | 'needs-review' | 'rejected';
  transport_mode?: string | null;
  route_name?: string | null;
  bike_policy?: string | null;
  bike_policy_en?: string | null;
  packing_required?: boolean | null;
  packing_notes?: string | null;
  packing_notes_en?: string | null;
  booking_url?: string | null;
  is_active?: boolean;
}

export interface UserProfile {
  displayName: string | null;
  photoUrl: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
}

export interface Voucher {
  id?: string;
  code?: string;
  reward_title?: string;
  reward_title_en?: string;
  reward_amount?: number;
  expires_at?: string;
  [key: string]: unknown;
}

export interface VoucherConfig {
  spot_id: string;
  spot_name?: string;
  spot_name_en?: string;
  is_active: boolean;
  reward_title: string;
  reward_title_en: string;
  reward_amount: number;
  valid_days: number;
  [key: string]: unknown;
}

export interface Journey {
  id: string;
  course_id?: string;
  source_shared_route_id?: string | null;
  title: string;
  status?: string;
  visibility?: string;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  diaries?: Diary[];
  [key: string]: unknown;
}

export interface Diary {
  id: string;
  title?: string;
  diary_text: string;
  photo_urls?: string[];
  created_at: string;
  spot_id?: string;
  source_shared_route_stop_id?: string | null;
  visibility?: string;
  lat?: number;
  lng?: number;
  user?: {
    display_name?: string;
    profile_photo_url?: string;
  };
  [key: string]: unknown;
}

export type SharedRouteStopType =
  | 'photo'
  | 'repair'
  | 'food'
  | 'lodging'
  | 'scenic'
  | 'transport'
  | 'note';

export interface SharedRouteStop {
  id: string;
  title: string;
  body: string;
  type: SharedRouteStopType;
  location: LatLng;
  photoUrl?: string;
  createdAt: string;
}

export interface SharedRoute {
  id: string;
  title: string;
  authorName: string;
  authorCountry?: string;
  summary: string;
  startName: string;
  endName: string;
  distanceKm: number;
  durationHours: number;
  stayedPlaces: string[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByMe?: boolean;
  coverImageUrl?: string;
  tags: string[];
  stops: SharedRouteStop[];
}

export interface ImportedRouteDraft {
  id: string;
  sourceRouteId: string;
  title: string;
  authorName: string;
  startName: string;
  endName: string;
  distanceKm: number;
  durationHours: number;
  stopCount: number;
  tags: string[];
  importedAt: string;
}

export interface JourneyTrackPointInput {
  location: LatLng;
  speed_kmh?: number | null;
  altitude_m?: number | null;
  is_off_route?: boolean;
  recorded_at: string;
}

export interface JourneyTrackPoint extends JourneyTrackPointInput {
  id: string;
  journey_id: string;
  created_at: string;
}

export interface PublishedSharedRouteStop {
  id: string;
  shared_route_id: string;
  source_diary_id?: string | null;
  title: string;
  body?: string | null;
  location?: LatLng | null;
  photo_urls?: string[] | null;
  sort_order: number;
  created_at: string;
}

export interface PublishedSharedRoute {
  id: string;
  user_id: string;
  source_journey_id?: string | null;
  title: string;
  summary?: string | null;
  start_name?: string | null;
  end_name?: string | null;
  visibility: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  liked_by_me: boolean;
  created_at: string;
  author?: {
    display_name?: string | null;
    profile_photo_url?: string | null;
  } | null;
  stops: PublishedSharedRouteStop[];
}

export interface SharedRouteComment {
  id: string;
  shared_route_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author: {
    display_name?: string | null;
    profile_photo_url?: string | null;
  };
}

export interface SharedRouteLikeResult {
  liked: boolean;
  route: PublishedSharedRoute;
}
