import { momentsCopy, t } from '@/i18n';
import type { AppLanguage, SharedRoute } from '@/types/ridekorea';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SharedRouteCardProps {
  lang: AppLanguage;
  route: SharedRoute;
  onImport: (route: SharedRoute) => void;
  onOpen?: (route: SharedRoute) => void;
}

function formatDuration(hours: number, lang: AppLanguage) {
  const copy = (item: Record<AppLanguage, string>) => t(lang, item);
  if (hours <= 0) return copy(momentsCopy.noRecord);

  const roundedHours = Math.floor(hours);
  const minutes = Math.round((hours - roundedHours) * 60);

  if (minutes === 0) {
    return `${roundedHours}${copy(momentsCopy.hours)}`;
  }

  return `${roundedHours}${copy(momentsCopy.hours)} ${minutes}${copy(momentsCopy.minutes)}`;
}

export function SharedRouteCard({ lang, route, onImport, onOpen }: SharedRouteCardProps) {
  const firstStop = route.stops[0];
  const copy = (item: Record<AppLanguage, string>) => t(lang, item);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => onOpen?.(route)}
      disabled={!onOpen}>
      {route.coverImageUrl && (
        <Image source={{ uri: route.coverImageUrl }} style={styles.coverImage} />
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={2}>
              {route.title}
            </Text>
            <Text style={styles.author} numberOfLines={1}>
              {route.authorName}
              {route.authorCountry ? ` / ${route.authorCountry}` : ''}
            </Text>
          </View>

          <View style={[styles.statPill, route.likedByMe && styles.statPillActive]}>
            <Text style={[styles.statPillText, route.likedByMe && styles.statPillTextActive]}>
              {route.likedByMe ? copy(momentsCopy.liked) : `${route.likeCount} ${copy(momentsCopy.likes)}`}
            </Text>
          </View>
        </View>

        <Text style={styles.summary} numberOfLines={3}>
          {route.summary}
        </Text>

        <View style={styles.routeLine}>
          <Text style={styles.routePoint} numberOfLines={1}>
            {route.startName}
          </Text>
          <Text style={styles.routeArrow}>to</Text>
          <Text style={styles.routePoint} numberOfLines={1}>
            {route.endName}
          </Text>
        </View>

        <View style={styles.metricGrid}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>{copy(momentsCopy.distance)}</Text>
            <Text style={styles.metricValue}>{route.distanceKm.toFixed(1)} km</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>{copy(momentsCopy.time)}</Text>
            <Text style={styles.metricValue}>{formatDuration(route.durationHours, lang)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>{copy(momentsCopy.records)}</Text>
            <Text style={styles.metricValue}>{route.stops.length} {copy(momentsCopy.stops)}</Text>
          </View>
        </View>

        {firstStop && (
          <View style={styles.highlightBox}>
            <Text style={styles.highlightLabel}>{copy(momentsCopy.featuredNote)}</Text>
            <Text style={styles.highlightTitle}>{firstStop.title}</Text>
            <Text style={styles.highlightBody} numberOfLines={2}>
              {firstStop.body || copy(momentsCopy.defaultStopNote)}
            </Text>
          </View>
        )}

        <View style={styles.tags}>
          {route.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.socialText}>
            {copy(momentsCopy.comments)} {route.commentCount} / {copy(momentsCopy.shares)} {route.shareCount}
          </Text>
          <TouchableOpacity
            style={styles.importButton}
            onPress={(event) => {
              event.stopPropagation();
              onImport(route);
            }}>
            <Text style={styles.importButtonText}>{copy(momentsCopy.importRoute)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCE4EC',
  },
  coverImage: {
    width: '100%',
    height: 188,
    backgroundColor: '#E2E8F0',
  },
  body: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 25,
  },
  author: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 5,
  },
  statPill: {
    borderRadius: 999,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statPillActive: {
    backgroundColor: '#DCFCE7',
  },
  statPillText: {
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '900',
  },
  statPillTextActive: {
    color: '#047857',
  },
  summary: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  routePoint: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  routeArrow: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    minHeight: 58,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
  },
  metricLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  highlightBox: {
    borderLeftWidth: 3,
    borderLeftColor: '#0EA5E9',
    backgroundColor: '#F8FAFC',
    padding: 12,
    marginBottom: 12,
  },
  highlightLabel: {
    color: '#0EA5E9',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 5,
  },
  highlightTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 4,
  },
  highlightBody: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 14,
  },
  tag: {
    borderRadius: 999,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  tagText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  socialText: {
    flex: 1,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },
  importButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
  },
  importButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
