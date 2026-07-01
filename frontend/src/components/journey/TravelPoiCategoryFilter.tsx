import type { AppLanguage, TravelPoiCategory } from '@/types/ridekorea';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TravelPoiCategoryFilterProps {
  lang: AppLanguage;
  activeCategory: TravelPoiCategory | null;
  onChangeCategory: (category: TravelPoiCategory | null) => void;
}

const CATEGORIES: {
  value: TravelPoiCategory | null;
  ko: string;
  en: string;
}[] = [
  { value: null, ko: '전체', en: 'All' },
  { value: 'repair', ko: '수리', en: 'Repair' },
  { value: 'food', ko: '맛집', en: 'Food' },
  { value: 'lodging', ko: '숙소', en: 'Lodging' },
  { value: 'scenic', ko: '경치', en: 'Scenic' },
  { value: 'transport', ko: '교통', en: 'Transport' },
  { value: 'culture', ko: '문화', en: 'Culture' },
];

export function TravelPoiCategoryFilter({
  lang,
  activeCategory,
  onChangeCategory,
}: TravelPoiCategoryFilterProps) {
  const isKo = lang === 'ko';

  return (
    <View style={styles.container} pointerEvents="box-none">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category.value;

          return (
            <TouchableOpacity
              key={category.value ?? 'all'}
              style={[styles.chip, isActive && styles.activeChip]}
              activeOpacity={0.86}
              onPress={() => onChangeCategory(category.value)}>
              <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                {isKo ? category.ko : category.en}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 15,
    right: 15,
    top: 146,
    zIndex: 9,
  },
  scrollContent: {
    gap: 8,
    paddingRight: 12,
  },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  activeChip: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  chipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '900',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
});
