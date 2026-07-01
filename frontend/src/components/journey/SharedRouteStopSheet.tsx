import { mediaUrl } from '@/services/api';
import type { AppLanguage, SharedRouteStop } from '@/types/ridekorea';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SharedRouteStopSheetProps {
  lang: AppLanguage;
  stop: SharedRouteStop;
  canWriteDiary?: boolean;
  onClose: () => void;
  onWriteDiary?: () => void;
}

const STOP_LABELS: Record<string, { ko: string; en: string }> = {
  photo: { ko: '사진 기록', en: 'Photo' },
  repair: { ko: '수리', en: 'Repair' },
  food: { ko: '맛집', en: 'Food' },
  lodging: { ko: '숙소', en: 'Lodging' },
  scenic: { ko: '경치', en: 'Scenic' },
  transport: { ko: '교통', en: 'Transport' },
  note: { ko: '메모', en: 'Note' },
};

export function SharedRouteStopSheet({
  canWriteDiary = false,
  lang,
  stop,
  onClose,
  onWriteDiary,
}: SharedRouteStopSheetProps) {
  const isKo = lang === 'ko';
  const label = STOP_LABELS[stop.type] || STOP_LABELS.note;
  const imageUrl = stop.photoUrl ? mediaUrl(stop.photoUrl) : null;

  return (
    <View style={styles.sheet}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{isKo ? label.ko : label.en}</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {stop.title}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>x</Text>
        </TouchableOpacity>
      </View>

      {imageUrl && <Image source={{ uri: imageUrl }} style={styles.image} />}

      <Text style={styles.body}>
        {stop.body || (isKo ? '이 스팟에는 아직 상세 메모가 없습니다.' : 'No detail note for this stop yet.')}
      </Text>

      <Text style={styles.locationText}>
        {stop.location.lat.toFixed(5)}, {stop.location.lng.toFixed(5)}
      </Text>

      {canWriteDiary && (
        <TouchableOpacity style={styles.writeButton} onPress={onWriteDiary}>
          <Text style={styles.writeButtonText}>
            {isKo ? '이 스팟에 내 기록 남기기' : 'Add my note here'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 15,
    right: 15,
    bottom: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginBottom: 7,
  },
  badgeText: {
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '900',
  },
  title: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 23,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  closeButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '900',
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  body: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 10,
  },
  locationText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
  },
  writeButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0F172A',
    marginTop: 14,
  },
  writeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
