import { useAuthSession } from '@/context/AuthSessionContext';
import { LANGUAGE_LABELS, momentsCopy, t } from '@/i18n';
import {
  createPublicSharedRouteComment,
  getPublicSharedRoute,
  getPublicSharedRouteComments,
  getPublishedSharedRoute,
  importPublicSharedRoute,
  likePublicSharedRoute,
  mediaUrl,
  recordPublicSharedRouteShare,
  updatePublishedSharedRouteVisibility,
} from '@/services/api';
import type {
  AppLanguage,
  PublishedSharedRoute,
  PublishedSharedRouteStop,
  SharedRouteComment,
} from '@/types/ridekorea';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const LANGUAGES: AppLanguage[] = ['ko', 'en', 'ja'];

function formatDateTime(value: string | null | undefined, lang: AppLanguage) {
  if (!value) return t(lang, momentsCopy.noTime);
  const locale = lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : 'en-US';
  return new Date(value).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function sortStops(stops: PublishedSharedRouteStop[]) {
  return [...stops].sort((a, b) => a.sort_order - b.sort_order);
}

function visibilityLabel(value: string | undefined, lang: AppLanguage) {
  return value === 'public' ? t(lang, momentsCopy.public) : t(lang, momentsCopy.privateDraft);
}

export default function PublishedSharedRoutePreviewScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { token, isAuthChecked } = useAuthSession();
  const [lang, setLang] = useState<AppLanguage>('ko');
  const [route, setRoute] = useState<PublishedSharedRoute | null>(null);
  const [comments, setComments] = useState<SharedRouteComment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stops = useMemo(() => sortStops(route?.stops || []), [route?.stops]);
  const coverPhoto = useMemo(() => {
    const photo = stops.find((stop) => stop.photo_urls?.[0])?.photo_urls?.[0];
    return photo ? mediaUrl(photo) : null;
  }, [stops]);

  const hasLiked = route?.liked_by_me ?? false;

  const loadRoute = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (!isAuthChecked) return;
    if (!params.id) {
      setIsLoading(false);
      return;
    }

    if (mode === 'refresh') {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      setError(null);
      let nextRoute: PublishedSharedRoute;
      try {
        nextRoute = token
          ? await getPublishedSharedRoute(token, params.id)
          : await getPublicSharedRoute(params.id, token);
      } catch {
        nextRoute = await getPublicSharedRoute(params.id, token);
      }

      setRoute(nextRoute);
      if (nextRoute.visibility === 'public') {
        setComments(await getPublicSharedRouteComments(nextRoute.id));
      } else {
        setComments([]);
      }
    } catch (err: any) {
      setError(err.message || t(lang, momentsCopy.routeLoadFailed));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthChecked, lang, params.id, token]);

  const handleToggleVisibility = useCallback(async () => {
    if (!token || !route || isUpdatingVisibility) return;

    setIsUpdatingVisibility(true);
    try {
      const nextVisibility = route.visibility === 'public' ? 'private' : 'public';
      const nextRoute = await updatePublishedSharedRouteVisibility(token, route.id, nextVisibility);
      setRoute({ ...nextRoute, liked_by_me: route.liked_by_me });
      if (nextRoute.visibility !== 'public') {
        setComments([]);
      }
    } catch (err: any) {
      setError(err.message || t(lang, momentsCopy.visibilityUpdateFailed));
    } finally {
      setIsUpdatingVisibility(false);
    }
  }, [isUpdatingVisibility, lang, route, token]);

  const handleRecordShare = useCallback(async () => {
    if (!route || route.visibility !== 'public' || isSharing) return;

    setIsSharing(true);
    try {
      const nextRoute = await recordPublicSharedRouteShare(route.id);
      setRoute({ ...nextRoute, liked_by_me: route.liked_by_me });
    } catch (err: any) {
      setError(err.message || t(lang, momentsCopy.shareRecordFailed));
    } finally {
      setIsSharing(false);
    }
  }, [isSharing, lang, route]);

  const handleLikeRoute = useCallback(async () => {
    if (!token || !route || route.visibility !== 'public' || isLiking || hasLiked) return;

    setIsLiking(true);
    try {
      const result = await likePublicSharedRoute(token, route.id);
      setRoute(result.route);
    } catch (err: any) {
      setError(err.message || t(lang, momentsCopy.likeRecordFailed));
    } finally {
      setIsLiking(false);
    }
  }, [hasLiked, isLiking, lang, route, token]);

  const handleImportRoute = useCallback(async () => {
    if (!token || !route || route.visibility !== 'public' || isImporting) return;

    setIsImporting(true);
    try {
      const journey = await importPublicSharedRoute(token, route.id);
      router.push(`/journeys/${journey.id}` as never);
    } catch (err: any) {
      setError(err.message || t(lang, momentsCopy.importPublicRouteFailed));
    } finally {
      setIsImporting(false);
    }
  }, [isImporting, lang, route, token]);

  const handleCreateComment = useCallback(async () => {
    if (!token || !route || route.visibility !== 'public' || isCommenting) return;
    const normalizedBody = commentBody.trim();
    if (!normalizedBody) return;

    setIsCommenting(true);
    try {
      const nextComment = await createPublicSharedRouteComment(token, route.id, normalizedBody);
      setComments((current) => [...current, nextComment]);
      setCommentBody('');
      setRoute((current) =>
        current ? { ...current, comment_count: current.comment_count + 1 } : current,
      );
    } catch (err: any) {
      setError(err.message || t(lang, momentsCopy.commentCreateFailed));
    } finally {
      setIsCommenting(false);
    }
  }, [commentBody, isCommenting, lang, route, token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadRoute();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadRoute]);

  if (!isAuthChecked || isLoading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>{t(lang, momentsCopy.loadingSharedRoute)}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => loadRoute('refresh')} />
      }>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>{t(lang, momentsCopy.back)}</Text>
      </TouchableOpacity>
      <View style={styles.languageSegmented}>
        {LANGUAGES.map((language) => (
          <TouchableOpacity
            key={language}
            style={[styles.languageSegment, lang === language && styles.languageSegmentActive]}
            onPress={() => setLang(language)}>
            <Text
              style={[
                styles.languageSegmentText,
                lang === language && styles.languageSegmentTextActive,
              ]}>
              {LANGUAGE_LABELS[language]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{t(lang, momentsCopy.routeOpenFailedTitle)}</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadRoute()}>
            <Text style={styles.retryButtonText}>{t(lang, momentsCopy.retry)}</Text>
          </TouchableOpacity>
        </View>
      ) : route ? (
        <>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>{t(lang, momentsCopy.sharedRoutePreview)}</Text>
            <Text style={styles.title}>{route.title}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{visibilityLabel(route.visibility, lang)}</Text>
            </View>
          </View>

          {coverPhoto && <Image source={{ uri: coverPhoto }} style={styles.coverImage} />}

          <View style={styles.summaryPanel}>
            <Text style={styles.summaryText}>
              {route.summary || t(lang, momentsCopy.routeDraftFallback)}
            </Text>
            <View style={styles.routeLine}>
              <Text style={styles.routePoint} numberOfLines={1}>
                {route.start_name || t(lang, momentsCopy.unknownStart)}
              </Text>
              <View style={styles.routeDivider} />
              <Text style={styles.routePoint} numberOfLines={1}>
                {route.end_name || t(lang, momentsCopy.unknownEnd)}
              </Text>
            </View>
          </View>

          <View style={styles.checkPanel}>
            <Text style={styles.checkTitle}>{t(lang, momentsCopy.publishCheckTitle)}</Text>
            <Text style={styles.checkText}>
              {t(lang, momentsCopy.publishCheckBody)}
            </Text>
            {token && (
              <TouchableOpacity
                style={[
                  styles.visibilityButton,
                  route.visibility === 'public' && styles.visibilityButtonPublic,
                ]}
                disabled={isUpdatingVisibility}
                onPress={handleToggleVisibility}>
                <Text style={styles.visibilityButtonText}>
                  {isUpdatingVisibility
                    ? t(lang, momentsCopy.changing)
                    : route.visibility === 'public'
                    ? t(lang, momentsCopy.makePrivate)
                    : t(lang, momentsCopy.publishToMoments)}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{route.like_count}</Text>
              <Text style={styles.statLabel}>{t(lang, momentsCopy.likes)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{route.comment_count}</Text>
              <Text style={styles.statLabel}>{t(lang, momentsCopy.comments)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{route.share_count}</Text>
              <Text style={styles.statLabel}>{t(lang, momentsCopy.shares)}</Text>
            </View>
          </View>

          {route.visibility === 'public' && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, hasLiked && styles.actionButtonMuted]}
                disabled={!token || isLiking || hasLiked}
                onPress={handleLikeRoute}>
                <Text style={styles.actionButtonText}>
                  {!token
                    ? t(lang, momentsCopy.loginToLike)
                    : hasLiked
                    ? t(lang, momentsCopy.likeDone)
                    : isLiking
                    ? t(lang, momentsCopy.liking)
                    : t(lang, momentsCopy.likeAction)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButtonSecondary}
                disabled={isSharing}
                onPress={handleRecordShare}>
                <Text style={styles.actionButtonSecondaryText}>
                  {isSharing ? t(lang, momentsCopy.recordingShare) : t(lang, momentsCopy.recordShare)}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {route.visibility === 'public' && (
            <TouchableOpacity
              style={[
                styles.importButton,
                (!token || isImporting) && styles.importButtonDisabled,
              ]}
              disabled={!token || isImporting}
              onPress={handleImportRoute}>
              <Text style={styles.importButtonText}>
                {!token
                  ? t(lang, momentsCopy.loginToImportRoute)
                  : isImporting
                  ? t(lang, momentsCopy.importing)
                  : t(lang, momentsCopy.importToJourney)}
              </Text>
            </TouchableOpacity>
          )}

          {route.visibility === 'public' && (
            <View style={styles.commentSection}>
              <Text style={styles.sectionTitle}>{t(lang, momentsCopy.commentsTitle)}</Text>
              {comments.length === 0 ? (
                <View style={styles.commentEmptyBox}>
                  <Text style={styles.commentEmptyText}>
                    {t(lang, momentsCopy.noCommentsBody)}
                  </Text>
                </View>
              ) : (
                <View style={styles.commentList}>
                  {comments.map((comment) => (
                    <View key={comment.id} style={styles.commentCard}>
                      <View style={styles.commentMetaRow}>
                        {comment.author.profile_photo_url ? (
                          <Image
                            source={{ uri: comment.author.profile_photo_url }}
                            style={styles.commentAvatar}
                          />
                        ) : (
                          <View style={styles.commentAvatarFallback} />
                        )}
                        <View style={styles.commentAuthorBlock}>
                          <Text style={styles.commentAuthor} numberOfLines={1}>
                            {comment.author.display_name || 'RideKorea Rider'}
                          </Text>
                          <Text style={styles.commentDate}>
                            {formatDateTime(comment.created_at, lang)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.commentBody}>{comment.body}</Text>
                    </View>
                  ))}
                </View>
              )}

              {token ? (
                <View style={styles.commentComposer}>
                  <TextInput
                    style={styles.commentInput}
                    value={commentBody}
                    onChangeText={setCommentBody}
                    placeholder={t(lang, momentsCopy.commentPlaceholder)}
                    placeholderTextColor="#94A3B8"
                    multiline
                    maxLength={1000}
                  />
                  <TouchableOpacity
                    style={[
                      styles.commentButton,
                      (!commentBody.trim() || isCommenting) && styles.commentButtonDisabled,
                    ]}
                    disabled={!commentBody.trim() || isCommenting}
                    onPress={handleCreateComment}>
                    <Text style={styles.commentButtonText}>
                      {isCommenting ? t(lang, momentsCopy.registering) : t(lang, momentsCopy.leaveComment)}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.commentLoginBox}>
                  <Text style={styles.commentLoginText}>
                    {t(lang, momentsCopy.commentLoginBody)}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.timelineSection}>
            <Text style={styles.sectionTitle}>{t(lang, momentsCopy.sharedTimeline)}</Text>
            {stops.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>{t(lang, momentsCopy.noShareRecordsTitle)}</Text>
                <Text style={styles.emptyText}>
                  {t(lang, momentsCopy.noShareRecordsBody)}
                </Text>
              </View>
            ) : (
              <View style={styles.timelineList}>
                {stops.map((stop, index) => {
                  const photoUrl = stop.photo_urls?.[0];
                  return (
                    <View key={stop.id} style={styles.timelineItem}>
                      <View style={styles.timelineRail}>
                        <View style={styles.timelineDot} />
                        {index < stops.length - 1 && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.timelineCard}>
                        <Text style={styles.timelineTime}>{formatDateTime(stop.created_at, lang)}</Text>
                        <Text style={styles.timelineTitle}>{stop.title || t(lang, momentsCopy.untitledStop)}</Text>
                        {!!stop.body && <Text style={styles.timelineBody}>{stop.body}</Text>}
                        {photoUrl && (
                          <Image source={{ uri: mediaUrl(photoUrl) }} style={styles.timelineImage} />
                        )}
                        {stop.location && (
                          <Text style={styles.locationText}>
                            {stop.location.lat.toFixed(5)}, {stop.location.lng.toFixed(5)}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{t(lang, momentsCopy.draftNotFoundTitle)}</Text>
          <Text style={styles.emptyText}>{t(lang, momentsCopy.draftNotFoundBody)}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    paddingTop: 54,
    paddingBottom: 38,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  backButtonText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  languageSegmented: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    flexDirection: 'row',
    marginBottom: 14,
    padding: 3,
  },
  languageSegment: {
    alignItems: 'center',
    borderRadius: 6,
    justifyContent: 'center',
    minWidth: 34,
    paddingHorizontal: 7,
    paddingVertical: 6,
  },
  languageSegmentActive: {
    backgroundColor: '#0F172A',
  },
  languageSegmentText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '900',
  },
  languageSegmentTextActive: {
    color: '#FFFFFF',
  },
  header: {
    marginBottom: 16,
  },
  eyebrow: {
    color: '#1E3A8A',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: '#0F172A',
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 34,
    marginBottom: 10,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '900',
  },
  coverImage: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    marginBottom: 14,
  },
  summaryPanel: {
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
  },
  summaryText: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routePoint: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  routeDivider: {
    width: 34,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#38BDF8',
  },
  checkPanel: {
    borderRadius: 8,
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 14,
    marginBottom: 14,
  },
  checkTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 5,
  },
  checkText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  visibilityButton: {
    alignSelf: 'flex-start',
    minHeight: 42,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    marginTop: 12,
  },
  visibilityButtonPublic: {
    backgroundColor: '#334155',
  },
  visibilityButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },
  statBox: {
    flex: 1,
    minHeight: 72,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
  },
  statValue: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },
  timelineSection: {
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
  },
  actionButtonMuted: {
    backgroundColor: '#334155',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  actionButtonSecondary: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
  },
  actionButtonSecondaryText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  importButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0F172A',
    marginBottom: 20,
    paddingHorizontal: 14,
  },
  importButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  importButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  commentSection: {
    marginBottom: 20,
  },
  commentEmptyBox: {
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
  },
  commentEmptyText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
  },
  commentList: {
    gap: 10,
    marginBottom: 12,
  },
  commentCard: {
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  commentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 9,
  },
  commentAvatarFallback: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 9,
    backgroundColor: '#CBD5E1',
  },
  commentAuthorBlock: {
    flex: 1,
    minWidth: 0,
  },
  commentAuthor: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  commentDate: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  commentBody: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 21,
  },
  commentComposer: {
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  commentInput: {
    minHeight: 82,
    color: '#0F172A',
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  commentButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  commentButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  commentButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  commentLoginBox: {
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  commentLoginText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 14,
  },
  timelineList: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineRail: {
    width: 28,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1E3A8A',
    marginTop: 8,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 140,
    backgroundColor: '#BFDBFE',
  },
  timelineCard: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
  },
  timelineTime: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  timelineTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 7,
  },
  timelineBody: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 10,
  },
  timelineImage: {
    width: '100%',
    height: 170,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    marginBottom: 10,
  },
  locationText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyState: {
    minHeight: 210,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 22,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 42,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    marginTop: 14,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
