import { journeyCopy, t } from '@/i18n';
import type { AppLanguage, Spot } from '@/types/ridekorea';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SpotBottomSheetProps {
  lang: AppLanguage;
  spot: Spot;
  hasActiveJourney: boolean;
  onClose: () => void;
  onStartJourney: () => void;
  onOpenDiary: () => void;
  onCompleteJourney: () => void;
}

export function SpotBottomSheet({
  lang,
  spot,
  hasActiveJourney,
  onClose,
  onStartJourney,
  onOpenDiary,
  onCompleteJourney,
}: SpotBottomSheetProps) {
  const isKo = lang === 'ko';
  const copy = (item: Record<AppLanguage, string>) => t(lang, item);

  return (
    <View style={styles.bottomSheet}>
      <View style={styles.bottomSheetHeader}>
        <View style={styles.badgeRow}>
          <View style={styles.spotTypeBadge}>
            <Text style={styles.spotTypeBadgeText}>{copy(journeyCopy.spotCertification)}</Text>
          </View>
          {spot.is_voucher_active && (
            <View style={styles.partnerBadge}>
              <Text style={styles.partnerBadgeText}>
                {copy(journeyCopy.localReward)} {(spot.voucher_amount || 0).toLocaleString()} KRW
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>x</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.spotName}>{isKo ? spot.name : spot.name_en}</Text>
      <Text style={styles.spotNameEn}>{isKo ? spot.name_en : spot.name}</Text>
      <Text style={styles.storyHeader}>{copy(journeyCopy.regionStory)}</Text>
      <Text style={styles.spotDesc}>
        {isKo
          ? spot.description || copy(journeyCopy.noDescription)
          : spot.description_en || copy(journeyCopy.noDescription)}
      </Text>

      {hasActiveJourney ? (
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.diaryBtn]} onPress={onOpenDiary}>
            <Text style={styles.actionBtnText}>
              {copy(journeyCopy.certifyDiary)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.stopBtn]} onPress={onCompleteJourney}>
            <Text style={styles.actionBtnText}>{copy(journeyCopy.completeJourneyAction)}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={[styles.actionBtn, styles.startBtn]} onPress={onStartJourney}>
          <Text style={styles.actionBtnText}>
            {copy(journeyCopy.startJourneyAction)}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
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
  partnerBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  partnerBadgeText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '900',
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
  storyHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginTop: 8,
    marginBottom: 2,
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
    minHeight: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  startBtn: {
    backgroundColor: '#1E3A8A',
  },
  diaryBtn: {
    backgroundColor: '#0EA5E9',
  },
  stopBtn: {
    backgroundColor: '#334155',
    flex: 0.45,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
