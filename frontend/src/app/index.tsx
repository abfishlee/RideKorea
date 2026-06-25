import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  ScrollView, 
  ActivityIndicator, 
  Image, 
  Platform,
  Alert
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();



// backend API Base URL (Local PC internal LAN IP: 192.168.0.70)
const BACKEND_BASE = 'http://192.168.0.70:8000/api/v1';
const MAP_URL = 'http://192.168.0.70:8000/map';



interface Course {
  id: string;
  name: string;
  name_en: string;
  distance_km: number;
  difficulty: string;
}

interface Spot {
  id: string;
  name: string;
  name_en: string;
  type: string;
  location: { lat: number; lng: number };
  description: string;
  description_en: string;
  is_voucher_active?: boolean;
  voucher_amount?: number;
}

export default function HomeScreen() {
  const webViewRef = useRef<WebView>(null);
  
  // App States
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const [cachedPath, setCachedPath] = useState<{lat: number, lng: number}[]>([]);
  const [cachedSpots, setCachedSpots] = useState<any[]>([]);
  
  // New Phase 3 States
  const [userProfile, setUserProfile] = useState<{ displayName: string | null, photoUrl: string | null } | null>(null);
  const [spotDiaries, setSpotDiaries] = useState<any[]>([]);

  // New Phase 4 States
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // New Phase 5 States
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isVouchersModalOpen, setIsVouchersModalOpen] = useState(false);
  
  // New Admin States
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminConfigs, setAdminConfigs] = useState<any[]>([]);
  const [isLoadingAdminConfigs, setIsLoadingAdminConfigs] = useState(false);
  
  // States for editing configuration
  const [editingSpotId, setEditingSpotId] = useState<string | null>(null);
  const [editIsActive, setEditIsActive] = useState(false);
  const [editRewardTitle, setEditRewardTitle] = useState('');
  const [editRewardTitleEn, setEditRewardTitleEn] = useState('');
  const [editRewardAmount, setEditRewardAmount] = useState('5000');
  const [editValidDays, setEditValidDays] = useState('90');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  
  // User GPS Tracking States
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  
  // Auth States
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Riding & Diary States
  const [activeJourney, setActiveJourney] = useState<any>(null);
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false);
  const [diaryText, setDiaryText] = useState('');
  const [isSubmittingDiary, setIsSubmittingDiary] = useState(false);

  // Google Login Hooks
  const [googleRequest, googleResponse, promptAsync] = Google.useAuthRequest({
    androidClientId: "849613742035-j77rn224om2d7idcf41cp30itht8v5k9.apps.googleusercontent.com",
    webClientId: "849613742035-8qdt58uj7g6frgc2fo40f54upm1husnp.apps.googleusercontent.com",
    iosClientId: "849613742035-8g5bhkqg3f0k6cb10e0tr4r4egg3seao.apps.googleusercontent.com",
    redirectUri: makeRedirectUri({
      scheme: 'frontend',
    }),
  });

  useEffect(() => {
    if (googleResponse?.type === 'success' && googleResponse.authentication?.idToken) {
      handleActualGoogleLogin(googleResponse.authentication.idToken);
    }
  }, [googleResponse]);

  const handleActualGoogleLogin = async (idToken: string) => {
    try {
      setIsMapLoading(true);
      const response = await fetch(`${BACKEND_BASE}/auth/social-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_token: idToken,
          provider: 'google'
        })
      });

      if (!response.ok) throw new Error('Authentication failed');
      
      const data = await response.json();
      await SecureStore.setItemAsync('auth_token', data.access_token);
      setToken(data.access_token);
      
      await fetchUserProfile(data.access_token);
      await fetchMyVouchers(data.access_token);
      
      Alert.alert(
        lang === 'ko' ? '로그인 성공' : 'Login Success',
        lang === 'ko' ? '구글 소셜 로그인 성공!' : 'Google login successful!'
      );
    } catch (err: any) {
      Alert.alert(lang === 'ko' ? '로그인 실패' : 'Login Failed', err.message);
    } finally {
      setIsMapLoading(false);
    }
  };

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await fetch(`${BACKEND_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserProfile({
          displayName: data.display_name,
          photoUrl: data.profile_photo_url
        });
      }
    } catch (err) {
      console.log('Error fetching user profile', err);
    }
  };

  const fetchMyVouchers = async (authToken: string) => {
    try {
      const response = await fetch(`${BACKEND_BASE}/vouchers/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVouchers(data);
      }
    } catch (err) {
      console.log('Error fetching vouchers', err);
    }
  };

  const fetchAdminConfigs = async () => {
    if (!token) return;
    setIsLoadingAdminConfigs(true);
    try {
      const response = await fetch(`${BACKEND_BASE}/admin/voucher-configs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAdminConfigs(data);
      }
    } catch (err) {
      console.log('Error fetching admin configs', err);
    } finally {
      setIsLoadingAdminConfigs(false);
    }
  };

  const handleOpenAdminPanel = () => {
    setIsAdminModalOpen(true);
    fetchAdminConfigs();
  };

  const handleStartEditConfig = (config: any) => {
    setEditingSpotId(config.spot_id);
    setEditIsActive(config.is_active);
    setEditRewardTitle(config.reward_title);
    setEditRewardTitleEn(config.reward_title_en);
    setEditRewardAmount(config.reward_amount.toString());
    setEditValidDays(config.valid_days.toString());
  };

  const handleSaveVoucherConfig = async (spotId: string) => {
    if (!token) return;
    setIsSavingConfig(true);
    try {
      const response = await fetch(`${BACKEND_BASE}/admin/voucher-configs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          spot_id: spotId,
          is_active: editIsActive,
          reward_title: editRewardTitle,
          reward_title_en: editRewardTitleEn,
          reward_amount: parseInt(editRewardAmount) || 5000,
          valid_days: parseInt(editValidDays) || 90
        })
      });

      if (response.ok) {
        Alert.alert(
          lang === 'ko' ? '설정 저장 완료' : 'Settings Saved',
          lang === 'ko' ? '바우처 제휴 설정이 정상적으로 갱신되었습니다.' : 'Voucher settings updated successfully.'
        );
        setEditingSpotId(null);
        fetchAdminConfigs();
        
        // Refresh selected course spots to update map & bottom sheet immediately!
        if (selectedCourse) {
          handleSelectCourse(selectedCourse);
        }
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (err: any) {
      Alert.alert(lang === 'ko' ? '오류' : 'Error', err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handlePanToMyLocation = () => {
    if (userLocation && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'PAN_TO_LOCATION',
        lat: userLocation.lat,
        lng: userLocation.lng
      }));
    } else {
      Alert.alert(
        lang === 'ko' ? 'GPS 대기 중' : 'Waiting for GPS',
        lang === 'ko' ? '아직 내 위치 정보를 받아오지 못했습니다. 잠시만 기다려주세요.' : 'We haven\'t retrieved your location yet. Please wait.'
      );
    }
  };

  // Watch user location in real-time
  useEffect(() => {
    let subscription: any = null;

    async function startLocationTracking() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }
        setIsTrackingLocation(true);

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10
          },
          (location) => {
            const { latitude, longitude } = location.coords;
            setUserLocation({ lat: latitude, lng: longitude });

            // Feed updated location to Webview
            if (webViewRef.current) {
              webViewRef.current.postMessage(JSON.stringify({
                type: 'UPDATE_MY_LOCATION',
                lat: latitude,
                lng: longitude
              }));
            }
          }
        );
      } catch (err) {
        console.log('Error starting location tracking', err);
      }
    }

    startLocationTracking();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // Initialize and check login token
  useEffect(() => {
    async function checkAuth() {
      try {
        const storedToken = await SecureStore.getItemAsync('auth_token');
        if (storedToken) {
          setToken(storedToken);
          fetchUserProfile(storedToken);
          fetchMyVouchers(storedToken);
        }
      } catch (err) {
        console.log('SecureStore read error', err);
      }
    }
    checkAuth();
    fetchCourses();
  }, []);

  // Trigger marker update when language changes
  useEffect(() => {
    if (cachedSpots.length > 0 && webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'SET_SPOTS',
        spots: cachedSpots,
        lang: lang
      }));
    }
  }, [lang, cachedSpots]);

  // Fetch all courses
  const fetchCourses = async () => {
    try {
      const response = await fetch(`${BACKEND_BASE}/courses/`);
      const data = await response.json();
      setCourses(data);
      
      // Auto-select first course if available
      if (data && data.length > 0) {
        handleSelectCourse(data[0]);
      }
    } catch (err) {
      console.log('Error fetching courses', err);
    }
  };

  // Select a course and fetch details/spots
  const handleSelectCourse = async (course: Course) => {
    setSelectedCourse(course);
    setIsMapLoading(true);
    
    try {
      // 1. Fetch course line geometry
      const resGeo = await fetch(`${BACKEND_BASE}/courses/${course.id}`);
      const courseDetail = await resGeo.json();
      
      // 2. Fetch spots for this course
      const resSpots = await fetch(`${BACKEND_BASE}/spots/?course_id=${course.id}`);
      const spotsData = await resSpots.json();
      setSpots(spotsData);

      // Draw on Map (WebView Bridge)
      if (courseDetail.route_geometry && webViewRef.current) {
        const pathCoords = courseDetail.route_geometry.coordinates.map((c: any) => ({
          lat: c[1],
          lng: c[0]
        }));
        setCachedPath(pathCoords); // Cache path coordinates
        
        webViewRef.current.postMessage(JSON.stringify({
          type: 'DRAW_ROUTE',
          routeId: course.id,
          path: pathCoords
        }));

        const spotCoords = spotsData.map((s: any) => ({
          id: s.id,
          name: s.name,
          name_en: s.name_en,
          lat: s.location.lat,
          lng: s.location.lng
        }));
        setCachedSpots(spotCoords); // Cache spots coordinates

        webViewRef.current.postMessage(JSON.stringify({
          type: 'SET_SPOTS',
          spots: spotCoords,
          lang: lang
        }));
      }
    } catch (err) {
      console.log('Error loading course details', err);
    } finally {
      setIsMapLoading(false);
    }
  };

  // Mock/Actual Social Login
  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    if (provider === 'google') {
      promptAsync();
    } else {
      // Mock Apple Login
      try {
        const devToken = `dev-token-apple-1`;
        const response = await fetch(`${BACKEND_BASE}/auth/social-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_token: devToken,
            provider: 'apple'
          })
        });

        if (!response.ok) throw new Error('Authentication failed');
        
        const data = await response.json();
        await SecureStore.setItemAsync('auth_token', data.access_token);
        setToken(data.access_token);
        
        await fetchUserProfile(data.access_token);
        await fetchMyVouchers(data.access_token);
        
        Alert.alert(
          lang === 'ko' ? '로그인 성공' : 'Login Success',
          lang === 'ko' ? 'APPLE 소셜 로그인 성공!' : 'APPLE login successful!'
        );
      } catch (err: any) {
        Alert.alert(lang === 'ko' ? '로그인 실패' : 'Login Failed', err.message);
      }
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    setToken(null);
    setUserEmail(null);
    setUserProfile(null);
    setVouchers([]);
    setActiveJourney(null);
    Alert.alert(
      lang === 'ko' ? '로그아웃' : 'Logout',
      lang === 'ko' ? '정상적으로 로그아웃되었습니다.' : 'Logged out successfully.'
    );
  };

  const fetchSpotDiaries = async (spotId: string) => {
    try {
      const response = await fetch(`${BACKEND_BASE}/diaries/spot/${spotId}`);
      if (response.ok) {
        const data = await response.json();
        setSpotDiaries(data);
      }
    } catch (err) {
      console.log('Error fetching spot diaries', err);
    }
  };

  const fetchPublicDiariesInBounds = async (minLat: number, minLng: number, maxLat: number, maxLng: number) => {
    try {
      const response = await fetch(`${BACKEND_BASE}/diaries/public?min_lat=${minLat}&min_lng=${minLng}&max_lat=${maxLat}&max_lng=${maxLng}`);
      if (response.ok) {
        const data = await response.json();
        if (webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({
            type: 'SET_DIARIES',
            diaries: data
          }));
        }
      }
    } catch (err) {
      console.log('Error fetching public diaries in bounds', err);
    }
  };

  const uploadImageToServer = async (photoUri: string): Promise<string[]> => {
    if (photoUri.startsWith('http://') || photoUri.startsWith('https://')) {
      return [photoUri];
    }

    try {
      const formData = new FormData();
      const filename = photoUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      
      formData.append('files', {
        uri: photoUri,
        name: filename,
        type: type
      } as any);

      const response = await fetch(`${BACKEND_BASE}/diaries/upload-photos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Photo upload failed');
      const savedUrls = await response.json();
      return savedUrls.map((url: string) => {
        return url.startsWith('/uploads') ? `${BACKEND_BASE.replace('/api/v1', '')}${url}` : url;
      });
    } catch (err) {
      console.log('Error uploading photo', err);
      throw err;
    }
  };

  // Journey controls
  const handleStartJourney = async () => {
    if (!token) {
      Alert.alert('로그인 필요', '종주 기록을 시작하려면 먼저 소셜 로그인을 해주세요.');
      return;
    }
    if (!selectedCourse) return;

    try {
      const response = await fetch(`${BACKEND_BASE}/journeys/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          course_id: selectedCourse.id,
          title: `${selectedCourse.name_en} Riding`,
          visibility: 'private'
        })
      });

      if (!response.ok) throw new Error('Failed to start journey');
      
      const journey = await response.json();
      setActiveJourney(journey);
      Alert.alert('종주 시작', `"${selectedCourse.name}" 종주 기록을 시작합니다!`);
    } catch (err: any) {
      Alert.alert('오류', err.message);
    }
  };

  const handleCompleteJourney = async () => {
    if (!activeJourney || !token) return;

    try {
      const response = await fetch(`${BACKEND_BASE}/journeys/${activeJourney.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'completed'
        })
      });

      if (!response.ok) throw new Error('Failed to complete journey');
      
      Alert.alert('종주 완료', '축하합니다! 완주 기록이 정상적으로 저장되었습니다.');
      setActiveJourney(null);
    } catch (err: any) {
      Alert.alert('오류', err.message);
    }
  };

  // Submit Spot Diary
  const handleSaveDiary = async () => {
    if (!activeJourney || !selectedSpot || !token) return;
    if (!diaryText.trim()) {
      Alert.alert(
        lang === 'ko' ? '내용 입력' : 'Content Required',
        lang === 'ko' ? '일지 내용을 입력해주세요.' : 'Please write diary content.'
      );
      return;
    }

    setIsSubmittingDiary(true);
    try {
      let uploadedUrls: string[] = [];
      if (selectedPhoto) {
        uploadedUrls = await uploadImageToServer(selectedPhoto);
      }

      const response = await fetch(`${BACKEND_BASE}/diaries/?journey_id=${activeJourney.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          spot_id: selectedSpot.id,
          diary_text: diaryText,
          photo_urls: uploadedUrls,
          visibility: 'public'
        })
      });

      if (!response.ok) throw new Error('Failed to save diary');

      Alert.alert(
        lang === 'ko' ? '작성 완료' : 'Complete',
        lang === 'ko' ? '인증센터 인증 및 라이딩 일지가 저장되었습니다.' : 'Stamp certified and diary saved!'
      );
      setDiaryText('');
      setSelectedPhoto(null);
      setIsDiaryModalOpen(false);
      
      fetchSpotDiaries(selectedSpot.id);
      fetchMyVouchers(token);
    } catch (err: any) {
      Alert.alert(lang === 'ko' ? '오류' : 'Error', err.message);
    } finally {
      setIsSubmittingDiary(false);
    }
  };

  // WebView Event bridge receiver
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView Message received:', data);
      
      switch (data.type) {
        case 'MAP_LOADED':
          setIsMapLoading(false);
          // Re-send cached data if available
          if (cachedPath.length > 0 && webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify({
              type: 'DRAW_ROUTE',
              routeId: selectedCourse?.id,
              path: cachedPath
            }));
          }
          if (cachedSpots.length > 0 && webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify({
              type: 'SET_SPOTS',
              spots: cachedSpots,
              lang: lang
            }));
          }
          break;
          
        case 'MAP_ERROR':
          setIsMapLoading(false);
          Alert.alert(
            lang === 'ko' ? '지도 오류' : 'Map Error',
            data.message || (lang === 'ko' ? '지도를 불러오지 못했습니다.' : 'Failed to load map.')
          );
          break;
          
        case 'MARKER_CLICKED':
          const clickedSpot = spots.find(s => s.id === data.spotId);
          if (clickedSpot) {
            setSelectedSpot(clickedSpot);
            fetchSpotDiaries(clickedSpot.id);
          }
          break;

        case 'MAP_BOUNDS_CHANGED':
          fetchPublicDiariesInBounds(data.min_lat, data.min_lng, data.max_lat, data.max_lng);
          break;

        case 'DIARY_MARKER_CLICKED':
          // For diary markers, we search for the spot linked to it and open the bottom sheet feed
          const diarySpot = spots.find(s => s.id === data.spotId);
          if (diarySpot) {
            setSelectedSpot(diarySpot);
            fetchSpotDiaries(diarySpot.id);
          }
          break;
          
        case 'MAP_CLICKED':
          setSelectedSpot(null);
          break;
          
        case 'LOG':
          console.log('[WebView Log]', data.message);
          break;
      }
    } catch (err) {
      console.log('Error parsing WebView message', err);
    }
  };

  // WebView HTTP Map source definition
  const mapHtmlSource = { uri: MAP_URL };

  return (
    <View style={styles.container}>
      {/* WebView Map Panel */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <View style={styles.webPlaceholder}>
            <Text style={styles.webPlaceholderText}>Web platform placeholder (WebView operates on iOS/Android)</Text>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={mapHtmlSource}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onMessage={handleWebViewMessage}
            originWhitelist={['*']}
            allowFileAccess={true}
          />
        )}

        {isMapLoading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loaderText}>카카오 지도 로드 중...</Text>
          </View>
        )}

        {/* Floating GPS Target Button */}
        <TouchableOpacity 
          style={styles.gpsButton} 
          onPress={handlePanToMyLocation}
          activeOpacity={0.8}
        >
          <Text style={styles.gpsButtonText}>🎯</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Header (Branding, Course Select & Auth Status) */}
      <View style={styles.floatingHeader}>
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.brandTitle}>RideKorea</Text>
            <TouchableOpacity 
              style={styles.langToggle} 
              onPress={() => setLang(prev => prev === 'ko' ? 'en' : 'ko')}
            >
              <Text style={styles.langToggleText}>{lang === 'ko' ? '🇺🇸 EN' : '🇰🇷 KO'}</Text>
            </TouchableOpacity>
          </View>
          
          {token && userProfile ? (
            <View style={styles.profileBox}>
              {userProfile.photoUrl && (
                <Image 
                  source={{ uri: userProfile.photoUrl }} 
                  style={styles.avatarImage} 
                />
              )}
              <View style={styles.profileTextInfo}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {userProfile.displayName || 'Rider'}
                </Text>
                <TouchableOpacity 
                  style={styles.headerVoucherBadge}
                  onPress={() => setIsVouchersModalOpen(true)}
                >
                  <Text style={styles.headerVoucherText}>
                    🎟️ {vouchers.length} {lang === 'ko' ? '쿠폰' : 'Coupons'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                style={[styles.adminBtn, { marginRight: 6 }]} 
                onPress={handleOpenAdminPanel}
              >
                <Text style={styles.adminBtnText}>⚙️ Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutText}>{lang === 'ko' ? '로그아웃' : 'Logout'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.loginBtnGroup}>
              <TouchableOpacity style={[styles.loginBtn, styles.googleBtn]} onPress={() => handleSocialLogin('google')}>
                <Text style={styles.loginBtnText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.loginBtn, styles.appleBtn]} onPress={() => handleSocialLogin('apple')}>
                <Text style={styles.loginBtnText}>Apple</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Course Selector Dropdown */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courseScroll}>
          {courses.map((course) => (
            <TouchableOpacity 
              key={course.id}
              style={[
                styles.courseBadge,
                selectedCourse?.id === course.id && styles.activeCourseBadge
              ]}
              onPress={() => handleSelectCourse(course)}
            >
              <Text style={[
                styles.courseBadgeText,
                selectedCourse?.id === course.id && styles.activeCourseBadgeText
              ]}>
                {course.name} ({course.distance_km}km)
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Sheet Details Panel */}
      {selectedSpot && (
        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetHeader}>
            <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
              <View style={styles.spotTypeBadge}>
                <Text style={styles.spotTypeBadgeText}>
                  {lang === 'ko' ? '인증센터' : 'Certification'}
                </Text>
              </View>
              {selectedSpot.is_voucher_active && (
                <View style={styles.partnerBadge}>
                  <Text style={styles.partnerBadgeText}>
                    🎁 {lang === 'ko' ? '지자체 상생 제휴' : 'Local Reward'} ({((selectedSpot.voucher_amount) || 0).toLocaleString()}원)
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => setSelectedSpot(null)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.spotName}>
            {lang === 'ko' ? selectedSpot.name : selectedSpot.name_en}
          </Text>
          <Text style={styles.spotNameEn}>
            {lang === 'ko' ? selectedSpot.name_en : selectedSpot.name}
          </Text>
          <Text style={styles.storyHeader}>
            {lang === 'ko' ? '🌸 이 지역의 숨은 이야기' : '🌸 Story of the Region'}
          </Text>
          <Text style={styles.spotDesc}>
            {lang === 'ko' ? selectedSpot.description || '상세 설명이 없습니다.' : selectedSpot.description_en || 'No English description available.'}
          </Text>

          {/* Social Shared Diaries Feed */}
          <Text style={styles.feedTitle}>
            {lang === 'ko' ? '📣 다른 라이더들의 소식' : '📣 Riders\' Shared Feed'}
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.feedScroll}
            contentContainerStyle={spotDiaries.length === 0 && { flex: 1, justifyContent: 'center' }}
          >
            {spotDiaries.length > 0 ? (
              spotDiaries.map((diary) => (
                <View key={diary.id} style={styles.feedCard}>
                  <View style={styles.feedCardHeader}>
                    {diary.user?.profile_photo_url ? (
                      <Image 
                        source={{ uri: diary.user.profile_photo_url }} 
                        style={styles.feedAvatar} 
                      />
                    ) : (
                      <View style={[styles.feedAvatar, { backgroundColor: '#e5e7eb' }]} />
                    )}
                    <Text style={styles.feedAuthor} numberOfLines={1}>
                      {diary.user?.display_name || 'Anonymous Rider'}
                    </Text>
                  </View>

                  {/* Photo Thumbnail if exists */}
                  {diary.photo_urls && diary.photo_urls.length > 0 && (
                    <TouchableOpacity 
                      onPress={() => setPreviewImage(diary.photo_urls[0])}
                      activeOpacity={0.8}
                    >
                      <Image 
                        source={{ uri: diary.photo_urls[0].startsWith('/uploads') ? `${BACKEND_BASE.replace('/api/v1', '')}${diary.photo_urls[0]}` : diary.photo_urls[0] }} 
                        style={styles.feedPhoto} 
                      />
                    </TouchableOpacity>
                  )}

                  <Text style={styles.feedText} numberOfLines={3}>
                    {diary.diary_text}
                  </Text>
                  <Text style={styles.feedDate}>
                    {new Date(diary.created_at).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US')}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyFeedText}>
                {lang === 'ko' 
                  ? '아직 공유된 라이딩 소식이 없습니다. 첫 스탬프의 주인공이 되어 보세요!' 
                  : 'No diaries shared yet. Be the first to cert and share your story!'}
              </Text>
            )}
          </ScrollView>

          {/* Riding control or record button */}
          {activeJourney ? (
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.diaryBtn]} 
                onPress={() => setIsDiaryModalOpen(true)}
              >
                <Text style={styles.actionBtnText}>
                  {lang === 'ko' ? '스탬프 인증 & 일지 작성' : 'Certify Stamp & Write Diary'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.stopBtn]} 
                onPress={handleCompleteJourney}
              >
                <Text style={styles.actionBtnText}>
                  {lang === 'ko' ? '종주 완료' : 'Complete'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.startBtn]} 
              onPress={handleStartJourney}
            >
              <Text style={styles.actionBtnText}>
                {lang === 'ko' ? '종주 기록 시작하기' : 'Start Riding Journey'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Diary Writing Modal */}
      <Modal visible={isDiaryModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {lang === 'ko' ? '인증 및 라이딩 일지' : 'Certify & Riding Diary'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {lang === 'ko' ? selectedSpot?.name : selectedSpot?.name_en}
            </Text>
            
            <TextInput
              placeholder={lang === 'ko'
                ? '오늘의 자전거 라이딩 경험을 짧은 일지로 남겨보세요. (예: 날씨, 길 상태, 만난 인연 등)'
                : 'Write a short diary about your riding experience today. (e.g. weather, road conditions, people you met)'
              }
              style={styles.textInput}
              multiline
              numberOfLines={6}
              value={diaryText}
              onChangeText={setDiaryText}
            />

            {/* Selected Photo Thumbnail / Simulated Upload Selection */}
            {selectedPhoto ? (
              <View style={styles.thumbnailContainer}>
                <Image source={{ uri: selectedPhoto }} style={styles.attachedThumbnail} />
                <TouchableOpacity 
                  style={styles.removePhotoBtn} 
                  onPress={() => setSelectedPhoto(null)}
                >
                  <Text style={styles.removePhotoText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoSelectPlaceholder}>
                <Text style={styles.photoSelectHint}>
                  {lang === 'ko' ? '📸 풍경 및 자전거 사진 첨부 (개발용 시뮬레이터)' : '📸 Attach Scenic Photo (Simulated)'}
                </Text>
                <View style={styles.photoMockRow}>
                  <TouchableOpacity 
                    style={styles.photoMockBadge} 
                    onPress={() => setSelectedPhoto('https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?w=500')}
                  >
                    <Text style={styles.photoMockText}>🏞️ 한강 라이딩</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.photoMockBadge} 
                    onPress={() => setSelectedPhoto('https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500')}
                  >
                    <Text style={styles.photoMockText}>🚴 내 자전거</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.photoMockBadge} 
                    onPress={() => setSelectedPhoto('https://images.unsplash.com/photo-1502759683299-cdcd6974244f?w=500')}
                  >
                    <Text style={styles.photoMockText}>⛰️ 가을 계곡</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.modalBtnGroup}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => setIsDiaryModalOpen(false)}
                disabled={isSubmittingDiary}
              >
                <Text style={styles.cancelBtnText}>
                  {lang === 'ko' ? '취소' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.submitBtn]} 
                onPress={handleSaveDiary}
                disabled={isSubmittingDiary}
              >
                {isSubmittingDiary ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {lang === 'ko' ? '인증 및 일지 저장' : 'Save Stamp & Diary'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Voucher Wallet Modal */}
      <Modal visible={isVouchersModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.walletHeader}>
              <Text style={styles.modalTitle}>
                {lang === 'ko' ? '🎟️ 내 상생 바우처 지갑' : '🎟️ My Regional Vouchers'}
              </Text>
              <TouchableOpacity onPress={() => setIsVouchersModalOpen(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.walletSubtitle}>
              {lang === 'ko' 
                ? '지방 소도시 스탬프 인증 시 발급되며, 제휴된 오프라인 가맹점에서 보여주고 사용하세요!' 
                : 'Earned at rural spots! Show the barcode at designated local partner shops to redeem.'}
            </Text>

            <ScrollView style={styles.walletScroll} showsVerticalScrollIndicator={false}>
              {vouchers.length > 0 ? (
                vouchers.map((voucher) => (
                  <View key={voucher.id} style={styles.voucherCard}>
                    <View style={styles.voucherCardTop}>
                      <Text style={styles.voucherTitle}>
                        {lang === 'ko' ? voucher.title : voucher.title_en}
                      </Text>
                      <Text style={styles.voucherValue}>5,000 KRW</Text>
                    </View>
                    <Text style={styles.voucherDesc}>
                      {lang === 'ko' ? voucher.description : voucher.description_en}
                    </Text>
                    
                    {/* Simulated Barcode visualization */}
                    <View style={styles.barcodeContainer}>
                      <View style={styles.barcodeLines}>
                        {[...Array(24)].map((_, i) => (
                          <View 
                            key={i} 
                            style={[
                              styles.barcodeLine, 
                              { width: (i % 3 === 0 ? 3 : i % 2 === 0 ? 1 : 2), marginRight: (i % 4 === 0 ? 2 : 1) }
                            ]} 
                          />
                        ))}
                      </View>
                      <Text style={styles.barcodeNumber}>{voucher.code}</Text>
                    </View>

                    <Text style={styles.voucherExpiry}>
                      {lang === 'ko' ? '만료일' : 'Expires'}: {new Date(voucher.expires_at).toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US')}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyWalletContainer}>
                  <Text style={styles.emptyWalletText}>
                    {lang === 'ko'
                      ? '아직 획득한 지역 바우처가 없습니다.\n수도를 제외한 지방 소도시(여주, 충주, 문경 등) 인증센터를 자전거로 달리며 일지를 남겨보세요!'
                      : 'No vouchers in your wallet yet.\nCertify stamps and share memories at rural spots (Yeoju, Changju, Mungyeong, etc.) to get rewards!'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Admin Configurations Modal */}
      <Modal visible={isAdminModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.walletHeader}>
              <Text style={styles.modalTitle}>
                {lang === 'ko' ? '⚙️ 바우처 지자체 제휴 설정' : '⚙️ Voucher Settings'}
              </Text>
              <TouchableOpacity onPress={() => setIsAdminModalOpen(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.walletSubtitle}>
              {lang === 'ko' 
                ? '인증센터(스팟)별로 지자체 제휴 바우처 발급 옵션을 동적으로 활성화하고 세부 정책을 관리합니다.' 
                : 'Dynamically toggle and customize local merchant voucher rewards for each certification spot.'}
            </Text>

            {isLoadingAdminConfigs ? (
              <ActivityIndicator size="large" color="#059669" style={{ marginVertical: 30 }} />
            ) : (
              <ScrollView style={styles.adminScroll} showsVerticalScrollIndicator={false}>
                {adminConfigs.map((config) => {
                  const isEditing = editingSpotId === config.spot_id;
                  return (
                    <View key={config.spot_id} style={[styles.adminConfigCard, config.is_active && styles.adminConfigCardActive]}>
                      <View style={styles.adminConfigHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.adminSpotName}>
                            {lang === 'ko' ? config.spot_name : config.spot_name_en}
                          </Text>
                          <Text style={styles.adminSpotSub}>
                            {config.is_active 
                              ? (lang === 'ko' ? `🟢 활성 - ${config.reward_amount.toLocaleString()}원` : `🟢 Active - ${config.reward_amount.toLocaleString()} KRW`)
                              : (lang === 'ko' ? '🔴 비활성' : '🔴 Inactive')}
                          </Text>
                        </View>
                        
                        {!isEditing && (
                          <TouchableOpacity 
                            style={styles.adminEditBtn} 
                            onPress={() => handleStartEditConfig(config)}
                          >
                            <Text style={styles.adminEditBtnText}>{lang === 'ko' ? '설정 편집' : 'Edit'}</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {isEditing && (
                        <View style={styles.adminEditForm}>
                          <View style={styles.formRow}>
                            <Text style={styles.formLabel}>{lang === 'ko' ? '바우처 지급 활성화' : 'Enable Voucher'}</Text>
                            <TouchableOpacity 
                              style={[styles.toggleSwitch, editIsActive ? styles.toggleSwitchOn : styles.toggleSwitchOff]}
                              onPress={() => setEditIsActive(!editIsActive)}
                            >
                              <Text style={styles.toggleSwitchText}>
                                {editIsActive ? 'ON' : 'OFF'}
                              </Text>
                            </TouchableOpacity>
                          </View>

                          <Text style={styles.formInputLabel}>{lang === 'ko' ? '보상 명칭 (국문)' : 'Reward Title (KO)'}</Text>
                          <TextInput 
                            style={styles.adminInput}
                            value={editRewardTitle}
                            onChangeText={setEditRewardTitle}
                            placeholder="예: 문경 소도시 활성화 바우처"
                          />

                          <Text style={styles.formInputLabel}>{lang === 'ko' ? '보상 명칭 (영문)' : 'Reward Title (EN)'}</Text>
                          <TextInput 
                            style={styles.adminInput}
                            value={editRewardTitleEn}
                            onChangeText={setEditRewardTitleEn}
                            placeholder="e.g. Mungyeong Revitalization Voucher"
                          />

                          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.formInputLabel}>{lang === 'ko' ? '리워드 금액 (KRW)' : 'Amount (KRW)'}</Text>
                              <TextInput 
                                style={styles.adminInput}
                                value={editRewardAmount}
                                onChangeText={setEditRewardAmount}
                                keyboardType="numeric"
                                placeholder="5000"
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.formInputLabel}>{lang === 'ko' ? '유효 기간 (일)' : 'Valid Days'}</Text>
                              <TextInput 
                                style={styles.adminInput}
                                value={editValidDays}
                                onChangeText={setEditValidDays}
                                keyboardType="numeric"
                                placeholder="90"
                              />
                            </View>
                          </View>

                          <View style={styles.formActionRow}>
                            <TouchableOpacity 
                              style={[styles.formBtn, styles.formCancelBtn]}
                              onPress={() => setEditingSpotId(null)}
                              disabled={isSavingConfig}
                            >
                              <Text style={styles.formCancelBtnText}>{lang === 'ko' ? '취소' : 'Cancel'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.formBtn, styles.formSaveBtn]}
                              onPress={() => handleSaveVoucherConfig(config.spot_id)}
                              disabled={isSavingConfig}
                            >
                              {isSavingConfig ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <Text style={styles.formSaveBtnText}>{lang === 'ko' ? '저장' : 'Save'}</Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Lightbox Photo Preview Modal */}
      <Modal visible={previewImage !== null} transparent={true} animationType="fade">
        <View style={styles.lightboxOverlay}>
          <TouchableOpacity 
            style={styles.lightboxCloseArea} 
            onPress={() => setPreviewImage(null)}
          >
            <Text style={styles.lightboxCloseText}>✕</Text>
          </TouchableOpacity>
          {previewImage && (
            <Image 
              source={{ uri: previewImage.startsWith('/uploads') ? `${BACKEND_BASE.replace('/api/v1', '')}${previewImage}` : previewImage }} 
              style={styles.lightboxImage} 
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f5f7',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  webPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
  },
  webPlaceholderText: {
    color: '#6b7280',
    textAlign: 'center',
  },
  loaderOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: '#059669',
    fontWeight: 'bold',
  },
  floatingHeader: {
    position: 'absolute',
    top: 50,
    left: 15,
    right: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: -0.5,
  },
  langToggle: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langToggleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  avatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#059669',
  },
  profileTextInfo: {
    marginRight: 8,
    maxWidth: 70,
  },
  profileName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
  },
  profileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
    paddingLeft: 8,
    maxWidth: '65%',
  },
  headerVoucherBadge: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  headerVoucherText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },
  emailText: {
    fontSize: 12,
    color: '#4b5563',
    marginRight: 6,
    flexShrink: 1,
  },
  logoutBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  loginBtnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  loginBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  googleBtn: {
    backgroundColor: '#db4437',
  },
  appleBtn: {
    backgroundColor: '#000000',
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  courseScroll: {
    flexDirection: 'row',
    marginTop: 4,
  },
  courseBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    marginRight: 6,
  },
  activeCourseBadge: {
    backgroundColor: '#059669',
  },
  courseBadgeText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: 'bold',
  },
  activeCourseBadgeText: {
    color: '#fff',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 24,
    left: 15,
    right: 15,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  spotTypeBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  spotTypeBadgeText: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  spotName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  spotNameEn: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 4,
  },
  spotDesc: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtn: {
    backgroundColor: '#059669',
  },
  diaryBtn: {
    backgroundColor: '#10b981',
  },
  stopBtn: {
    backgroundColor: '#ef4444',
    flex: 0.4,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    height: 120,
    marginBottom: 16,
    fontSize: 14,
  },
  modalBtnGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f3f4f6',
  },
  cancelBtnText: {
    color: '#4b5563',
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: '#059669',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  feedTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 4,
    marginBottom: 6,
  },
  feedScroll: {
    maxHeight: 200,
    marginBottom: 14,
  },
  feedCard: {
    width: 180,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  feedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  feedAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 6,
  },
  feedAuthor: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4b5563',
    flex: 1,
  },
  feedText: {
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 15,
    height: 45,
  },
  feedDate: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'right',
  },
  emptyFeedText: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    width: '100%',
    paddingVertical: 12,
  },
  thumbnailContainer: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    height: 100,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  attachedThumbnail: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  photoSelectPlaceholder: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  photoSelectHint: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 8,
  },
  photoMockRow: {
    flexDirection: 'row',
    gap: 6,
  },
  photoMockBadge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  photoMockText: {
    fontSize: 10,
    color: '#4b5563',
    fontWeight: 'bold',
  },
  feedPhoto: {
    width: '100%',
    height: 70,
    borderRadius: 6,
    marginBottom: 6,
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  lightboxCloseArea: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  lightboxCloseText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  lightboxImage: {
    width: '90%',
    height: '75%',
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  walletSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 16,
  },
  walletScroll: {
    width: '100%',
  },
  voucherCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderStyle: 'dashed',
  },
  voucherCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  voucherTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
    flex: 1,
  },
  voucherValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2563eb',
    marginLeft: 10,
  },
  voucherDesc: {
    fontSize: 11,
    color: '#1e40af',
    lineHeight: 15,
    marginBottom: 12,
  },
  barcodeContainer: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  barcodeLines: {
    flexDirection: 'row',
    height: 35,
    alignItems: 'center',
  },
  barcodeLine: {
    height: '100%',
    backgroundColor: '#000',
  },
  barcodeNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 3,
    color: '#1f2937',
    marginTop: 4,
  },
  voucherExpiry: {
    fontSize: 9,
    color: '#60a5fa',
    fontWeight: 'bold',
  },
  emptyWalletContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyWalletText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
  partnerBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  partnerBadgeText: {
    color: '#d97706',
    fontSize: 11,
    fontWeight: 'bold',
  },
  storyHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 8,
    marginBottom: 2,
  },
  adminBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  adminBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  adminScroll: {
    width: '100%',
    marginTop: 10,
  },
  adminConfigCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  adminConfigCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  adminConfigHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adminSpotName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  adminSpotSub: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  adminEditBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adminEditBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  adminEditForm: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  toggleSwitch: {
    width: 60,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleSwitchOn: {
    backgroundColor: '#10b981',
  },
  toggleSwitchOff: {
    backgroundColor: '#d1d5db',
  },
  toggleSwitchText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  formInputLabel: {
    fontSize: 11,
    color: '#4b5563',
    marginBottom: 4,
    marginTop: 6,
    fontWeight: '600',
  },
  adminInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    backgroundColor: '#fff',
    color: '#1f2937',
  },
  formActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  formBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  formCancelBtn: {
    backgroundColor: '#f3f4f6',
  },
  formCancelBtnText: {
    color: '#4b5563',
    fontSize: 12,
    fontWeight: 'bold',
  },
  formSaveBtn: {
    backgroundColor: '#10b981',
  },
  formSaveBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  gpsButton: {
    position: 'absolute',
    top: 170,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  gpsButtonText: {
    fontSize: 20,
  },
});
