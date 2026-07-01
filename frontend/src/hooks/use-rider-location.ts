import {
  enqueueTrackPoint,
  getQueuedTrackPointCount,
} from '@/services/offline-track-queue';
import { flushJourneyTrackQueue } from '@/services/track-point-sync';
import type { AppLanguage } from '@/types/ridekorea';
import { detectRouteDeviation, type DeviationState, type LatLngPoint } from '@/utils/route-deviation-core';
import { addRideTrackPoint, createEmptyRideTrackState, type RideTrackState } from '@/utils/ride-track-core';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Alert } from 'react-native';
import type { WebView } from 'react-native-webview';

interface UseRiderLocationParams {
  activeRoutePath?: LatLngPoint[];
  lang: AppLanguage;
  token: string | null;
  activeJourneyId?: string | null;
  onLocationChange?: (location: RiderLocation) => void;
  onTrackPointsChange?: (points: { lat: number; lng: number; is_off_route?: boolean }[]) => void;
  webViewRef: RefObject<WebView | null>;
}

interface RiderLocation {
  lat: number;
  lng: number;
  speedKmh?: number | null;
  recordedAt?: string;
}

interface RideStats {
  speedKmh: number | null;
  distanceKm: number;
  elapsedSeconds: number;
  pendingTrackPointCount: number;
  isOffRoute: boolean;
  distanceFromRouteMeters: number | null;
}

export function useRiderLocation({
  activeRoutePath = [],
  activeJourneyId,
  lang,
  onLocationChange,
  onTrackPointsChange,
  token,
  webViewRef,
}: UseRiderLocationParams) {
  const [userLocation, setUserLocation] = useState<RiderLocation | null>(null);
  const [rideStats, setRideStats] = useState<RideStats>({
    speedKmh: null,
    distanceKm: 0,
    elapsedSeconds: 0,
    pendingTrackPointCount: 0,
    isOffRoute: false,
    distanceFromRouteMeters: null,
  });
  const rideTrackStateRef = useRef<RideTrackState>(createEmptyRideTrackState());
  const deviationStateRef = useRef<DeviationState>({ isOffRoute: false });
  const rideStartedAtRef = useRef<number | null>(null);
  const isFlushingTrackQueueRef = useRef(false);

  useEffect(() => {
    rideTrackStateRef.current = createEmptyRideTrackState();
    deviationStateRef.current = { isOffRoute: false };
    const initialStats = {
      speedKmh: null,
      distanceKm: 0,
      elapsedSeconds: 0,
      pendingTrackPointCount: 0,
      isOffRoute: false,
      distanceFromRouteMeters: null,
    };

    if (!activeJourneyId) {
      rideStartedAtRef.current = null;
    } else {
      rideStartedAtRef.current = Date.now();
    }

    const resetTimer = setTimeout(() => {
      void getQueuedTrackPointCount(activeJourneyId).then((pendingTrackPointCount) => {
        setRideStats({
          ...initialStats,
          pendingTrackPointCount,
        });
      });
    }, 0);

    return () => clearTimeout(resetTimer);
  }, [activeJourneyId]);

  useEffect(() => {
    if (!activeJourneyId) return;

    const timer = setInterval(() => {
      if (!rideStartedAtRef.current) return;
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - rideStartedAtRef.current) / 1000));
      setRideStats(previous => ({
        ...previous,
        elapsedSeconds,
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [activeJourneyId]);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    async function startLocationTracking() {
      if (!token) return;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (location) => {
            const { latitude, longitude } = location.coords;
            const speedKmh = location.coords.speed && location.coords.speed > 0
              ? location.coords.speed * 3.6
              : null;
            const nextLocation = {
              lat: latitude,
              lng: longitude,
              speedKmh,
              recordedAt: new Date(location.timestamp).toISOString(),
            };
            setUserLocation(nextLocation);
            onLocationChange?.(nextLocation);
            webViewRef.current?.postMessage(JSON.stringify({
              type: 'UPDATE_MY_LOCATION',
              ...nextLocation,
            }));

            if (activeJourneyId) {
              const trackUpdate = addRideTrackPoint(rideTrackStateRef.current, nextLocation);
              rideTrackStateRef.current = trackUpdate.state;
              const deviation = detectRouteDeviation(
                nextLocation,
                activeRoutePath,
                deviationStateRef.current,
              );
              deviationStateRef.current = { isOffRoute: deviation.isOffRoute };
              const elapsedSeconds = rideStartedAtRef.current
                ? Math.max(0, Math.floor((Date.now() - rideStartedAtRef.current) / 1000))
                : 0;
              setRideStats(previous => ({
                ...previous,
                speedKmh,
                distanceKm: rideTrackStateRef.current.distanceKm,
                elapsedSeconds,
                isOffRoute: deviation.isOffRoute,
                distanceFromRouteMeters: deviation.distanceFromRouteMeters,
              }));

              const trackPoint = {
                location: nextLocation,
                speed_kmh: speedKmh,
                altitude_m: location.coords.altitude,
                is_off_route: deviation.isOffRoute,
                recorded_at: new Date(location.timestamp).toISOString(),
              };

              if (isFlushingTrackQueueRef.current) {
                void enqueueTrackPoint(activeJourneyId, trackPoint)
                  .then((pendingTrackPointCount) => {
                    setRideStats(previous => ({
                      ...previous,
                      pendingTrackPointCount,
                    }));
                  });
                return;
              }

              isFlushingTrackQueueRef.current = true;
              void flushJourneyTrackQueue({
                token,
                journeyId: activeJourneyId,
                extraPoint: trackPoint,
              })
                .then(({ pendingTrackPointCount, trackPoints }) => {
                  setRideStats(previous => ({
                    ...previous,
                    pendingTrackPointCount,
                  }));
                  onTrackPointsChange?.(trackPoints.map((point) => ({
                    lat: point.location.lat,
                    lng: point.location.lng,
                    is_off_route: point.is_off_route,
                  })));
                })
                .catch((err) => {
                  console.log('Error saving track point', err);
                  void enqueueTrackPoint(activeJourneyId, trackPoint)
                    .then((pendingTrackPointCount) => {
                      setRideStats(previous => ({
                        ...previous,
                        pendingTrackPointCount,
                      }));
                    });
                })
                .finally(() => {
                  isFlushingTrackQueueRef.current = false;
                });
            }
          },
        );
      } catch (err) {
        console.log('Error starting location tracking', err);
      }
    }

    void startLocationTracking();

    return () => {
      subscription?.remove();
    };
  }, [activeJourneyId, activeRoutePath, onLocationChange, onTrackPointsChange, token, webViewRef]);

  const handlePanToMyLocation = useCallback(() => {
    if (userLocation) {
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'PAN_TO_LOCATION',
        ...userLocation,
      }));
      return;
    }

    Alert.alert(
      lang === 'ko' ? 'GPS 대기 중' : 'Waiting for GPS',
      lang === 'ko'
        ? '아직 현재 위치 정보를 받아오지 못했습니다. 잠시만 기다려주세요.'
        : 'We have not retrieved your location yet. Please wait.',
    );
  }, [lang, userLocation, webViewRef]);

  return {
    handlePanToMyLocation,
    rideStats,
    userLocation,
  };
}
