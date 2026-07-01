import { journeyCopy, t } from '@/i18n';
import type { AppLanguage, ImportedRouteDraft, SharedRoute } from '@/types/ridekorea';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ImportedRoutePlanSheetProps {
  lang: AppLanguage;
  draft: ImportedRouteDraft;
  route?: SharedRoute;
  isActive: boolean;
  onClose: () => void;
  onStart: () => void;
  onComplete: () => void;
}

function formatDuration(hours: number, lang: AppLanguage) {
  const roundedHours = Math.floor(hours);
  const minutes = Math.round((hours - roundedHours) * 60);
  const copy = (item: Record<AppLanguage, string>) => t(lang, item);

  if (hours <= 0) return copy(journeyCopy.noRecord);
  if (lang === 'en') {
    if (minutes === 0) return `${roundedHours}${copy(journeyCopy.hours)}`;
    return `${roundedHours}${copy(journeyCopy.hours)} ${minutes}${copy(journeyCopy.minutes)}`;
  }
  if (minutes === 0) return `${roundedHours}${copy(journeyCopy.hours)}`;
  return `${roundedHours}${copy(journeyCopy.hours)} ${minutes}${copy(journeyCopy.minutes)}`;
}

export function ImportedRoutePlanSheet({
  lang,
  draft,
  route,
  isActive,
  onClose,
  onStart,
  onComplete,
}: ImportedRoutePlanSheetProps) {
  const copy = (item: Record<AppLanguage, string>) => t(lang, item);
  const stops = route?.stops ?? [];

  return (
    <View style={styles.sheet}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.badge}>{copy(journeyCopy.importedRoute)}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {draft.title}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>x</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.routeLine} numberOfLines={1}>
        {draft.startName} to {draft.endName}
      </Text>

      <View style={styles.metricRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{draft.distanceKm.toFixed(1)} km</Text>
          <Text style={styles.metricLabel}>{copy(journeyCopy.distance)}</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{formatDuration(draft.durationHours, lang)}</Text>
          <Text style={styles.metricLabel}>{copy(journeyCopy.estimatedTime)}</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{draft.stopCount}{copy(journeyCopy.countSuffix)}</Text>
          <Text style={styles.metricLabel}>{copy(journeyCopy.stops)}</Text>
        </View>
      </View>

      {stops.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stopScroll}>
          {stops.map((stop) => (
            <View key={stop.id} style={styles.stopChip}>
              <Text style={styles.stopTitle} numberOfLines={1}>
                {stop.title}
              </Text>
              <Text style={styles.stopType}>{stop.type}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.actionRow}>
        {isActive ? (
          <TouchableOpacity style={[styles.actionButton, styles.completeButton]} onPress={onComplete}>
            <Text style={styles.actionButtonText}>{copy(journeyCopy.finish)}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.actionButton, styles.startButton]} onPress={onStart}>
            <Text style={styles.actionButtonText}>{copy(journeyCopy.prepareRide)}</Text>
          </TouchableOpacity>
        )}
      </View>
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
    marginBottom: 8,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  badge: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 4,
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
  routeLine: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    minHeight: 58,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
  },
  metricValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
  },
  stopScroll: {
    marginTop: 12,
  },
  stopChip: {
    width: 138,
    minHeight: 56,
    justifyContent: 'center',
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#ECFEFF',
    paddingHorizontal: 10,
  },
  stopTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4,
  },
  stopType: {
    color: '#0369A1',
    fontSize: 11,
    fontWeight: '800',
  },
  actionRow: {
    marginTop: 14,
  },
  actionButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  startButton: {
    backgroundColor: '#0F172A',
  },
  completeButton: {
    backgroundColor: '#0EA5E9',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
