import { journeyCopy, t } from '@/i18n';
import type { AppLanguage, LatLng, Spot } from '@/types/ridekorea';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface DiaryComposerModalProps {
  visible: boolean;
  lang: AppLanguage;
  selectedSpot: Spot | null;
  diaryLocation?: LatLng | null;
  diaryLocationMode?: 'current' | 'planned-stop' | null;
  diaryLocationLabel?: string | null;
  diaryTitle: string;
  diaryText: string;
  selectedPhoto: string | null;
  isSubmitting: boolean;
  onDiaryTitleChange: (value: string) => void;
  onDiaryTextChange: (value: string) => void;
  onPhotoChange: (value: string | null) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

const samplePhotos = [
  {
    copyKey: 'samplePhotoRiverside',
    uri: 'https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?w=500',
  },
  {
    copyKey: 'samplePhotoBike',
    uri: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500',
  },
  {
    copyKey: 'samplePhotoValley',
    uri: 'https://images.unsplash.com/photo-1502759683299-cdcd6974244f?w=500',
  },
] satisfies {
  copyKey: 'samplePhotoRiverside' | 'samplePhotoBike' | 'samplePhotoValley';
  uri: string;
}[];

export function DiaryComposerModal({
  visible,
  lang,
  selectedSpot,
  diaryLocation,
  diaryLocationMode,
  diaryLocationLabel,
  diaryTitle,
  diaryText,
  selectedPhoto,
  isSubmitting,
  onDiaryTitleChange,
  onDiaryTextChange,
  onPhotoChange,
  onCancel,
  onSubmit,
}: DiaryComposerModalProps) {
  const isKo = lang === 'ko';
  const copy = (item: Record<AppLanguage, string>) => t(lang, item);
  const plannedStopLabel = diaryLocationLabel || copy(journeyCopy.selectedRouteStop);
  const subtitle = selectedSpot
    ? isKo ? selectedSpot.name : selectedSpot.name_en
    : diaryLocationMode === 'planned-stop'
      ? lang === 'en'
        ? `${copy(journeyCopy.plannedStopDiarySubtitle)} ${plannedStopLabel}`
        : `${plannedStopLabel}${copy(journeyCopy.plannedStopDiarySubtitle)}`
      : diaryLocation
        ? copy(journeyCopy.currentPhotoSpotSubtitle)
        : copy(journeyCopy.waitingForLocationShort);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{copy(journeyCopy.diaryModalTitle)}</Text>
          <Text style={styles.modalSubtitle}>{subtitle}</Text>

          <TextInput
            placeholder={copy(journeyCopy.diaryTitlePlaceholder)}
            style={styles.titleInput}
            value={diaryTitle}
            onChangeText={onDiaryTitleChange}
            maxLength={80}
          />

          <TextInput
            placeholder={copy(journeyCopy.diaryBodyPlaceholder)}
            style={styles.textInput}
            multiline
            numberOfLines={6}
            value={diaryText}
            onChangeText={onDiaryTextChange}
          />

          {selectedPhoto ? (
            <View style={styles.thumbnailContainer}>
              <Image source={{ uri: selectedPhoto }} style={styles.attachedThumbnail} />
              <TouchableOpacity style={styles.removePhotoBtn} onPress={() => onPhotoChange(null)}>
                <Text style={styles.removePhotoText}>x</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoSelectPlaceholder}>
              <Text style={styles.photoSelectHint}>
                {copy(journeyCopy.photoPinHint)}
              </Text>
              <View style={styles.photoMockRow}>
                {samplePhotos.map((photo) => (
                  <TouchableOpacity
                    key={photo.uri}
                    style={styles.photoMockBadge}
                    onPress={() => onPhotoChange(photo.uri)}>
                    <Text style={styles.photoMockText}>
                      {copy(journeyCopy[photo.copyKey])}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.modalBtnGroup}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.cancelBtn]}
              onPress={onCancel}
              disabled={isSubmitting}>
              <Text style={styles.cancelBtnText}>{copy(journeyCopy.cancel)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, styles.submitBtn]}
              onPress={onSubmit}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {copy(journeyCopy.saveDiaryAction)}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  titleInput: {
    height: 46,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
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
    backgroundColor: '#1E3A8A',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
