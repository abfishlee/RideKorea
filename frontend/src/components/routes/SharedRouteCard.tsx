import { NeoOutdoors, NeoOutdoorStyles } from '@/constants/neo-outdoors';
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
      style={[NeoOutdoorStyles.editorialCard, styles.card]}
      onPress={() => onOpen?.(route)}
      disabled={!onOpen}>
      <View style={styles.coverWrap}>
        {route.coverImageUrl ? (
          <Image source={{ uri: route.coverImageUrl }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverFallback} />
        )}
        <View style={styles.coverScrim} />
        <View style={styles.coverMeta}>
          <Text style={styles.coverKicker}>{copy(momentsCopy.sharedRoutes)}</Text>
          <Text style={styles.coverTitle} numberOfLines={2}>
            {route.title}
          </Text>
        </View>
      </View>

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
  },
  coverWrap: {
    height: 214,
    backgroundColor: NeoOutdoors.color.line,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    backgroundColor: NeoOutdoors.color.line,
  },
  coverFallback: {
    flex: 1,
    backgroundColor: NeoOutdoors.color.cyanWash,
  },
  coverScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(11,18,32,0.22)',
  },
  coverMeta: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
  },
  coverKicker: {
    color: NeoOutdoors.color.electricCyan,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  coverTitle: {
    color: NeoOutdoors.color.white,
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 28,
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
    color: NeoOutdoors.color.inkSoft,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 23,
  },
  author: {
    color: NeoOutdoors.color.slateMuted,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 5,
  },
  statPill: {
    borderRadius: 999,
    backgroundColor: NeoOutdoors.color.cyanWash,
    borderColor: NeoOutdoors.color.electricCyan,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statPillActive: {
    backgroundColor: '#DCFCE7',
  },
  statPillText: {
    color: NeoOutdoors.color.deepCyan,
    fontSize: 12,
    fontWeight: '900',
  },
  statPillTextActive: {
    color: '#047857',
  },
  summary: {
    color: NeoOutdoors.color.slate,
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
    color: NeoOutdoors.color.inkSoft,
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
    backgroundColor: NeoOutdoors.color.paper,
    paddingHorizontal: 10,
  },
  metricLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricValue: {
    color: NeoOutdoors.color.inkSoft,
    fontSize: 13,
    fontWeight: '900',
  },
  highlightBox: {
    ...NeoOutdoorStyles.editorialSurface,
    padding: 12,
    marginBottom: 12,
  },
  highlightLabel: {
    color: NeoOutdoors.color.sunsetAmber,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 5,
  },
  highlightTitle: {
    color: NeoOutdoors.color.inkSoft,
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
    ...NeoOutdoorStyles.routeBadge,
    minHeight: 26,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  tagText: {
    color: NeoOutdoors.color.deepCyan,
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
    backgroundColor: NeoOutdoors.color.ink,
    paddingHorizontal: 14,
  },
  importButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
