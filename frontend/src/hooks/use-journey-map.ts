import { getCourseDetail, getCourses, getPublicDiariesInBounds, getSpots, getTravelPoisInBounds } from '@/services/api';
import type { AppLanguage, Course, Diary, SharedRoute, SharedRouteStop, Spot, TravelPoi, TravelPoiCategory } from '@/types/ridekorea';
import { useCallback, useEffect, useState, type RefObject } from 'react';
import { Alert } from 'react-native';
import type { WebView, WebViewMessageEvent } from 'react-native-webview';

interface UseJourneyMapParams {
  lang: AppLanguage;
  token?: string | null;
  webViewRef: RefObject<WebView | null>;
}

interface RoutePoint {
  lat: number;
  lng: number;
}

interface SpotMarker extends RoutePoint {
  id: string;
  name: string;
  name_en: string;
}

interface MapBounds {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export function useJourneyMap({ lang, token, webViewRef }: UseJourneyMapParams) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [publicDiaries, setPublicDiaries] = useState<Diary[]>([]);
  const [travelPois, setTravelPois] = useState<TravelPoi[]>([]);
  const [activeTravelPoiCategory, setActiveTravelPoiCategory] = useState<TravelPoiCategory | null>(null);
  const [lastMapBounds, setLastMapBounds] = useState<MapBounds | null>(null);
  const [selectedPublicDiary, setSelectedPublicDiary] = useState<Diary | null>(null);
  const [selectedTravelPoi, setSelectedTravelPoi] = useState<TravelPoi | null>(null);
  const [sharedRouteStops, setSharedRouteStops] = useState<SharedRouteStop[]>([]);
  const [selectedSharedRouteStop, setSelectedSharedRouteStop] = useState<SharedRouteStop | null>(null);
  const [areSharedRouteStopsVisible, setAreSharedRouteStopsVisible] = useState(true);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [cachedPath, setCachedPath] = useState<RoutePoint[]>([]);
  const [cachedSpots, setCachedSpots] = useState<SpotMarker[]>([]);
  const [cachedSpotLayer, setCachedSpotLayer] = useState<'course' | 'shared-route' | null>(null);

  const postToMap = useCallback((payload: unknown) => {
    webViewRef.current?.postMessage(JSON.stringify(payload));
  }, [webViewRef]);

  const handleSelectCourse = useCallback(async (course: Course) => {
    setSelectedCourse(course);
    setSelectedSharedRouteStop(null);
    setSelectedPublicDiary(null);
    setSelectedTravelPoi(null);
    setSharedRouteStops([]);
    setAreSharedRouteStopsVisible(true);
    setCachedSpotLayer(null);
    setIsMapLoading(true);
    postToMap({ type: 'CLEAR_TRACK_POINTS' });

    try {
      const courseDetail = await getCourseDetail(course.id);
      const spotsData = await getSpots(course.id);
      setSpots(spotsData);

      if (courseDetail.route_geometry) {
        const pathCoords = courseDetail.route_geometry.coordinates.map((coord) => ({
          lat: coord[1],
          lng: coord[0],
        }));
        setCachedPath(pathCoords);
        postToMap({
          type: 'DRAW_ROUTE',
          routeId: course.id,
          path: pathCoords,
        });

        const spotCoords = spotsData.map((spot) => ({
          id: spot.id,
          name: spot.name,
          name_en: spot.name_en,
          lat: spot.location.lat,
          lng: spot.location.lng,
        }));
        setCachedSpots(spotCoords);
        setCachedSpotLayer('course');
        postToMap({
          type: 'SET_SPOTS',
          spots: spotCoords,
          lang,
        });
      }
    } catch (err) {
      console.log('Error loading course details', err);
    } finally {
      setIsMapLoading(false);
    }
  }, [lang, postToMap]);

  const fetchCourses = useCallback(async () => {
    try {
      const data = await getCourses();
      setCourses(data);

      if (data.length > 0) {
        await handleSelectCourse(data[0]);
      }
    } catch (err) {
      console.log('Error fetching courses', err);
    }
  }, [handleSelectCourse]);

  const resetMapState = useCallback(() => {
    setCourses([]);
    setSelectedCourse(null);
    setSpots([]);
    setSelectedSpot(null);
    setPublicDiaries([]);
    setTravelPois([]);
    setActiveTravelPoiCategory(null);
    setLastMapBounds(null);
    setSelectedPublicDiary(null);
    setSelectedTravelPoi(null);
    setSharedRouteStops([]);
    setSelectedSharedRouteStop(null);
    setCachedPath([]);
    setCachedSpots([]);
    setCachedSpotLayer(null);
    setAreSharedRouteStopsVisible(true);
    setIsMapLoading(true);
    postToMap({ type: 'CLEAR_TRACK_POINTS' });
  }, [postToMap]);

  const handleSelectSharedRoute = useCallback((route: SharedRoute) => {
    setSelectedCourse(null);
    setSelectedSpot(null);
    setSelectedPublicDiary(null);
    setSelectedSharedRouteStop(null);
    setSelectedTravelPoi(null);
    setSharedRouteStops(route.stops);
    setAreSharedRouteStopsVisible(true);
    setIsMapLoading(false);
    postToMap({ type: 'CLEAR_TRACK_POINTS' });

    const pathCoords = route.stops.map((stop) => stop.location);
    setCachedPath(pathCoords);

    postToMap({
      type: 'DRAW_ROUTE',
      routeId: route.id,
      path: pathCoords,
    });

    const spotCoords = route.stops.map((stop) => ({
      id: stop.id,
      name: stop.title,
      name_en: stop.title,
      lat: stop.location.lat,
      lng: stop.location.lng,
    }));
    setCachedSpots(spotCoords);
    setCachedSpotLayer('shared-route');
    postToMap({
      type: 'SET_SPOTS',
      spots: spotCoords,
      lang,
    });
  }, [lang, postToMap]);

  const handleToggleSharedRouteStopsVisible = useCallback(() => {
    setAreSharedRouteStopsVisible((previous) => {
      const next = !previous;
      postToMap({
        type: 'SET_SPOTS',
        spots: next ? cachedSpots : [],
        lang,
      });
      if (!next) {
        setSelectedSharedRouteStop(null);
      }
      return next;
    });
  }, [cachedSpots, lang, postToMap]);

  const fetchPublicDiariesInBounds = useCallback(async (
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number,
  ) => {
    try {
      const data = await getPublicDiariesInBounds(minLat, minLng, maxLat, maxLng);
      setPublicDiaries(data);
      postToMap({
        type: 'SET_DIARIES',
        diaries: data,
      });
    } catch (err) {
      console.log('Error fetching public diaries in bounds', err);
    }
  }, [postToMap]);

  const fetchTravelPoisInBounds = useCallback(async (
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number,
    category = activeTravelPoiCategory,
  ) => {
    try {
      const data = await getTravelPoisInBounds(minLat, minLng, maxLat, maxLng, category, token);
      setTravelPois(data);
      postToMap({
        type: 'SET_TRAVEL_POIS',
        pois: data.map((poi) => ({
          id: poi.id,
          name: poi.name,
          name_en: poi.name_en,
          category: poi.category,
          lat: poi.location.lat,
          lng: poi.location.lng,
        })),
        lang,
      });
    } catch (err) {
      console.log('Error fetching travel POIs in bounds', err);
    }
  }, [activeTravelPoiCategory, lang, postToMap, token]);

  const handleSetActiveTravelPoiCategory = useCallback((category: TravelPoiCategory | null) => {
    setActiveTravelPoiCategory(category);
    setSelectedTravelPoi(null);

    if (!lastMapBounds) return;

    void fetchTravelPoisInBounds(
      lastMapBounds.minLat,
      lastMapBounds.minLng,
      lastMapBounds.maxLat,
      lastMapBounds.maxLng,
      category,
    );
  }, [fetchTravelPoisInBounds, lastMapBounds]);

  useEffect(() => {
    if (cachedSpots.length === 0) return;

    if (cachedSpotLayer === 'shared-route' && !areSharedRouteStopsVisible) {
      postToMap({
        type: 'SET_SPOTS',
        spots: [],
        lang,
      });
      return;
    }

    postToMap({
      type: 'SET_SPOTS',
      spots: cachedSpots,
      lang,
    });
  }, [areSharedRouteStopsVisible, cachedSpotLayer, cachedSpots, lang, postToMap]);

  const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'MAP_LOADED':
          setIsMapLoading(false);
          if (cachedPath.length > 0) {
            postToMap({
              type: 'DRAW_ROUTE',
              routeId: selectedCourse?.id,
              path: cachedPath,
            });
          }
          if (cachedSpots.length > 0) {
            postToMap({
              type: 'SET_SPOTS',
              spots: cachedSpotLayer === 'shared-route' && !areSharedRouteStopsVisible ? [] : cachedSpots,
              lang,
            });
          }
          break;

        case 'MAP_ERROR':
          setIsMapLoading(false);
          Alert.alert(
            lang === 'ko' ? '지도 오류' : 'Map Error',
            data.message || (lang === 'ko' ? '지도를 불러오지 못했습니다.' : 'Failed to load map.'),
          );
          break;

        case 'MARKER_CLICKED': {
          const clickedSpot = spots.find((spot) => spot.id === data.spotId);
          if (clickedSpot) {
            setSelectedSharedRouteStop(null);
            setSelectedPublicDiary(null);
            setSelectedSpot(clickedSpot);
            break;
          }

          const clickedSharedRouteStop = sharedRouteStops.find((stop) => stop.id === data.spotId);
          if (clickedSharedRouteStop) {
            setSelectedSpot(null);
            setSelectedPublicDiary(null);
            setSelectedSharedRouteStop(clickedSharedRouteStop);
          }
          break;
        }

        case 'POI_MARKER_CLICKED': {
          const poi = travelPois.find((item) => item.id === data.poiId);
          if (poi) {
            setSelectedSpot(null);
            setSelectedSharedRouteStop(null);
            setSelectedPublicDiary(null);
            setSelectedTravelPoi(poi);
          }
          break;
        }

        case 'MAP_BOUNDS_CHANGED':
          setLastMapBounds({
            minLat: data.min_lat,
            minLng: data.min_lng,
            maxLat: data.max_lat,
            maxLng: data.max_lng,
          });
          void fetchPublicDiariesInBounds(data.min_lat, data.min_lng, data.max_lat, data.max_lng);
          void fetchTravelPoisInBounds(data.min_lat, data.min_lng, data.max_lat, data.max_lng);
          break;

        case 'DIARY_MARKER_CLICKED': {
          const diary = publicDiaries.find((item) => item.id === data.diaryId);
          if (diary) {
            setSelectedSpot(null);
            setSelectedSharedRouteStop(null);
            setSelectedPublicDiary(diary);
          }
          break;
        }

        case 'MAP_CLICKED':
          setSelectedSpot(null);
          setSelectedSharedRouteStop(null);
          setSelectedPublicDiary(null);
          setSelectedTravelPoi(null);
          break;

        case 'LOG':
          console.log('[WebView Log]', data.message);
          break;
      }
    } catch (err) {
      console.log('Error parsing WebView message', err);
    }
  }, [
    cachedPath,
    cachedSpotLayer,
    cachedSpots,
    areSharedRouteStopsVisible,
    fetchPublicDiariesInBounds,
    fetchTravelPoisInBounds,
    lang,
    postToMap,
    publicDiaries,
    selectedCourse,
    sharedRouteStops,
    spots,
    travelPois,
  ]);

  return {
    courses,
    selectedCourse,
    selectedPublicDiary,
    selectedTravelPoi,
    selectedSharedRouteStop,
    sharedRouteStopCount: sharedRouteStops.length,
    areSharedRouteStopsVisible,
    selectedSpot,
    isMapLoading,
    activeTravelPoiCategory,
    setActiveTravelPoiCategory: handleSetActiveTravelPoiCategory,
    fetchCourses,
    handleSelectCourse,
    handleSelectSharedRoute,
    toggleSharedRouteStopsVisible: handleToggleSharedRouteStopsVisible,
    handleWebViewMessage,
    resetMapState,
    setSelectedPublicDiary,
    setSelectedTravelPoi,
    setSelectedSpot,
    setSelectedSharedRouteStop,
  };
}
