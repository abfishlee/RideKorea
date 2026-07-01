import type { SharedRoute } from '@/types/ridekorea';

export const SHARED_ROUTE_SAMPLES: SharedRoute[] = [
  {
    id: 'shared-geumgang-daejeon-peter',
    title: '베어링과 함께한 대전강변 투어',
    authorName: 'Peter',
    authorCountry: 'KR',
    summary:
      '금강하구둑에서 대전까지 강변을 따라 천천히 오른 기록입니다. 펑크 수리, 강변 식당, 숙소 선택까지 처음 오는 라이더에게 필요한 메모를 남겼어요.',
    startName: '금강하구둑',
    endName: '대전',
    distanceKm: 94.6,
    durationHours: 8.5,
    stayedPlaces: ['군산 게스트하우스', '대전 유성 숙소'],
    likeCount: 10,
    commentCount: 4,
    shareCount: 3,
    coverImageUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
    tags: ['금강', '수리소', '강변길', '느린여행'],
    stops: [
      {
        id: 'geumgang-start',
        title: '금강하구둑 출발',
        body: '바람은 조금 강했지만 길은 넓고 초반 페이스를 잡기 좋았습니다.',
        type: 'photo',
        location: { lat: 36.0129, lng: 126.7443 },
        photoUrl:
          'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
        createdAt: '2026-05-02T08:30:00+09:00',
      },
      {
        id: 'geumgang-repair',
        title: '타이어 펑크와 작은 수리소',
        body: '강경 근처에서 뒷바퀴가 내려앉았는데, 다리 건너편 수리점에서 튜브를 구할 수 있었습니다.',
        type: 'repair',
        location: { lat: 36.1562, lng: 127.0175 },
        createdAt: '2026-05-02T11:40:00+09:00',
      },
      {
        id: 'geumgang-food',
        title: '강변 식당 추천',
        body: '점심으로 먹은 백반이 예상보다 훨씬 좋았습니다. 물통도 채워주셔서 오래 기억날 곳.',
        type: 'food',
        location: { lat: 36.2354, lng: 127.0981 },
        createdAt: '2026-05-02T13:05:00+09:00',
      },
      {
        id: 'geumgang-lodging',
        title: '숙소는 다음엔 다른 곳으로',
        body: '위치는 좋았지만 자전거 보관 공간이 좁았습니다. 늦게 도착하는 라이더라면 미리 확인이 필요해요.',
        type: 'lodging',
        location: { lat: 36.3588, lng: 127.3442 },
        createdAt: '2026-05-02T19:20:00+09:00',
      },
    ],
  },
  {
    id: 'shared-jeju-slow-loop',
    title: '서두르지 않는 제주 해안 한 바퀴',
    authorName: 'Mina',
    authorCountry: 'KR',
    summary:
      '성산에서 시작해 서귀포와 애월을 지나 다시 동쪽으로 돌아오는 3일 코스입니다. 카페와 바다 전망 스팟 중심으로 정리했어요.',
    startName: '성산일출봉',
    endName: '성산일출봉',
    distanceKm: 218.4,
    durationHours: 19.2,
    stayedPlaces: ['서귀포 게스트하우스', '애월 자전거 숙소'],
    likeCount: 24,
    commentCount: 9,
    shareCount: 7,
    coverImageUrl:
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1400&q=80',
    tags: ['제주', '해안길', '카페', '3일코스'],
    stops: [
      {
        id: 'jeju-scenic',
        title: '오전의 동쪽 해안',
        body: '차가 많아지기 전 이른 시간에 달리면 바다와 바람이 가장 좋습니다.',
        type: 'scenic',
        location: { lat: 33.4621, lng: 126.9368 },
        createdAt: '2026-04-11T07:10:00+09:00',
      },
    ],
  },
  {
    id: 'shared-seoul-busan-first',
    title: '처음 종단하는 사람을 위한 서울-부산 기록',
    authorName: 'Alex',
    authorCountry: 'JP',
    summary:
      '서울에서 부산까지 처음 달리는 외국인 라이더 관점에서 인증센터, 보급, 길 찾기 실수를 중심으로 남긴 기록입니다.',
    startName: '아라서해갑문',
    endName: '낙동강하굿둑',
    distanceKm: 633.2,
    durationHours: 52.6,
    stayedPlaces: ['충주 라이더 게스트룸', '상주 모텔', '밀양역 근처 숙소'],
    likeCount: 42,
    commentCount: 16,
    shareCount: 12,
    coverImageUrl:
      'https://images.unsplash.com/photo-1520975682031-ae5e098e62a8?auto=format&fit=crop&w=1400&q=80',
    tags: ['서울부산', '초보종단', '인증센터', '보급'],
    stops: [
      {
        id: 'seoul-busan-transport',
        title: '공항에서 출발지까지 자전거 이동',
        body: '대형 캐리어와 자전거 박스를 함께 옮길 때는 공항철도와 택시 조합이 가장 현실적이었습니다.',
        type: 'transport',
        location: { lat: 37.5585, lng: 126.7945 },
        createdAt: '2026-03-18T09:00:00+09:00',
      },
    ],
  },
];

export function findSharedRouteById(routeId: string): SharedRoute | undefined {
  return SHARED_ROUTE_SAMPLES.find((route) => route.id === routeId);
}
