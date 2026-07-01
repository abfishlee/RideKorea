import { addJourneyTrackPoints } from '@/services/api';
import {
  enqueueTrackPoint,
  getQueuedTrackPointCount,
  markQueuedTrackPointAttempt,
  removeQueuedTrackPoints,
  takeQueuedTrackPoints,
} from '@/services/offline-track-queue';
import type { AppLanguage } from '@/types/ridekorea';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Alert } from 'react-native';
import type { WebView } from 'react-native-webview';

interface UseRiderLocationParams {
  lang: AppLanguage;
  token: string | null;
  activeJourneyId?: string | null;
  onLocationChange?: (location: RiderLocation) => void;
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
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKmBetween(from: RiderLocation, to: RiderLocation) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useRiderLocation({
  activeJourneyId,
  lang,
  onLocationChange,
  token,
  webViewRef,
}: UseRiderLocationParams) {
  const [userLocation, setUserLocation] = useState<RiderLocation | null>(null);
  const [rideStats, setRideStats] = useState<RideStats>({
    speedKmh: null,
    distanceKm: 0,
    elapsedSeconds: 0,
    pendingTrackPointCount: 0,
  });
  const previousLocationRef = useRef<RiderLocation | null>(null);
  const distanceKmRef = useRef(0);
  const rideStartedAtRef = useRef<number | null>(null);
  const isFlushingTrackQueueRef = useRef(false);

  useEffect(() => {
    previousLocationRef.current = null;
    distanceKmRef.current = 0;
    const initialStats = {
      speedKmh: null,
      distanceKm: 0,
      elapsedSeconds: 0,
      pendingTrackPointCount: 0,
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
              const previousLocation = previousLocationRef.current;
              if (previousLocation) {
                const segmentKm = distanceKmBetween(previousLocation, nextLocation);
                if (segmentKm < 1) {
                  distanceKmRef.current += segmentKm;
                }
              }
              previousLocationRef.current = nextLocation;
              const elapsedSeconds = rideStartedAtRef.current
                ? Math.max(0, Math.floor((Date.now() - rideStartedAtRef.current) / 1000))
                : 0;
              setRideStats(previous => ({
                ...previous,
                speedKmh,
                distanceKm: distanceKmRef.current,
                elapsedSeconds,
              }));

              const trackPoint = {
                location: nextLocation,
                speed_kmh: speedKmh,
                altitude_m: location.coords.altitude,
                is_off_route: false,
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
              void takeQueuedTrackPoints(activeJourneyId)
                .then(async (queuedPoints) => {
                  if (queuedPoints.length > 0) {
                    await markQueuedTrackPointAttempt(activeJourneyId, queuedPoints.length);
                  }

                  const trackPoints = await addJourneyTrackPoints(token, activeJourneyId, [
                    ...queuedPoints,
                    trackPoint,
                  ]);
                  const pendingTrackPointCount = queuedPoints.length > 0
                    ? await removeQueuedTrackPoints(activeJourneyId, queuedPoints.length)
                    : await getQueuedTrackPointCount(activeJourneyId);

                  setRideStats(previous => ({
                    ...previous,
                    pendingTrackPointCount,
                  }));
                  webViewRef.current?.postMessage(JSON.stringify({
                    type: 'SET_TRACK_POINTS',
                    points: trackPoints.map((point) => ({
                      lat: point.location.lat,
                      lng: point.location.lng,
                      is_off_route: point.is_off_route,
                    })),
                  }));
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
  }, [activeJourneyId, onLocationChange, token, webViewRef]);

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
