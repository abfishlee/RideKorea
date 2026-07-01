import { mediaUrl } from '@/services/api';
import type { AppLanguage, Diary } from '@/types/ridekorea';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PublicDiarySheetProps {
  diary: Diary;
  lang: AppLanguage;
  onClose: () => void;
  onOpenMoments?: () => void;
}

function formatDate(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

export function PublicDiarySheet({ diary, lang, onClose, onOpenMoments }: PublicDiarySheetProps) {
  const isKo = lang === 'ko';
  const photoUrl = diary.photo_urls?.[0] ? mediaUrl(diary.photo_urls[0]) : null;
  const author = diary.user?.display_name || 'RideKorea Rider';

  return (
    <View style={styles.sheet}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>{isKo ? '공개 라이딩 기록' : 'Public Diary'}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {diary.title || (isKo ? '제목 없는 기록' : 'Untitled diary')}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {author} · {formatDate(diary.created_at)}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>x</Text>
        </TouchableOpacity>
      </View>

      {photoUrl && <Image source={{ uri: photoUrl }} style={styles.image} />}

      <Text style={styles.body} numberOfLines={5}>
        {diary.diary_text || (isKo ? '아직 본문이 없는 공개 기록입니다.' : 'No diary text yet.')}
      </Text>

      {diary.lat && diary.lng && (
        <Text style={styles.locationText}>
          {diary.lat.toFixed(5)}, {diary.lng.toFixed(5)}
        </Text>
      )}

      {onOpenMoments && (
        <TouchableOpacity style={styles.momentsButton} onPress={onOpenMoments}>
          <Text style={styles.momentsButtonText}>
            {isKo ? 'Moments에서 더 보기' : 'Open Moments'}
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
  eyebrow: {
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 5,
  },
  title: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 23,
  },
  meta: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 5,
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
  momentsButton: {
    alignSelf: 'flex-start',
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    marginTop: 12,
  },
  momentsButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
