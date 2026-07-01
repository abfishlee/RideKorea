import React, { forwardRef } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

interface MapPanelProps {
  mapUrl: string;
  isLoading: boolean;
  loadingLabel: string;
  canCaptureMoment?: boolean;
  onMessage: (event: WebViewMessageEvent) => void;
  onCaptureMoment?: () => void;
  onOpenNearbyPois?: () => void;
  onPanToMyLocation: () => void;
}

export const MapPanel = forwardRef<WebView, MapPanelProps>(function MapPanel(
  {
    mapUrl,
    isLoading,
    loadingLabel,
    canCaptureMoment,
    onMessage,
    onCaptureMoment,
    onOpenNearbyPois,
    onPanToMyLocation,
  },
  ref,
) {
  return (
    <View style={styles.mapContainer}>
      {Platform.OS === 'web' ? (
        <View style={styles.webPlaceholder}>
          <Text style={styles.webPlaceholderText}>
            Web platform placeholder. The map WebView operates on iOS and Android.
          </Text>
        </View>
      ) : (
        <WebView
          ref={ref}
          source={{ uri: mapUrl }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          onMessage={onMessage}
          originWhitelist={['*']}
          allowFileAccess
        />
      )}

      {isLoading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={styles.loaderText}>{loadingLabel}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.gpsButton} onPress={onPanToMyLocation} activeOpacity={0.8}>
        <Text style={styles.gpsButtonText}>GPS</Text>
      </TouchableOpacity>

      {onOpenNearbyPois && (
        <TouchableOpacity style={styles.poiButton} onPress={onOpenNearbyPois} activeOpacity={0.86}>
          <Text style={styles.poiButtonText}>주변</Text>
        </TouchableOpacity>
      )}

      {canCaptureMoment && (
        <TouchableOpacity
          style={styles.momentButton}
          onPress={onCaptureMoment}
          activeOpacity={0.86}>
          <Text style={styles.momentButtonText}>기록</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
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
    padding: 24,
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
    color: '#1E3A8A',
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
    color: '#1E3A8A',
    fontSize: 11,
    fontWeight: '900',
  },
  poiButton: {
    position: 'absolute',
    top: 224,
    right: 20,
    minWidth: 58,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  poiButtonText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '900',
  },
  momentButton: {
    position: 'absolute',
    top: 278,
    right: 20,
    minWidth: 58,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  momentButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
