import { journeyCopy, LANGUAGE_LABELS, t } from '@/i18n';
import type { AppLanguage, Course, ImportedRouteDraft, UserProfile } from '@/types/ridekorea';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface JourneyHeaderProps {
  lang: AppLanguage;
  courses: Course[];
  selectedCourse: Course | null;
  importedDrafts: ImportedRouteDraft[];
  selectedDraft: ImportedRouteDraft | null;
  userProfile: UserProfile | null;
  onChangeLanguage: (lang: AppLanguage) => void;
  onSelectCourse: (course: Course) => void;
  onSelectDraft: (draft: ImportedRouteDraft) => void;
  onLogout: () => void;
}

export function JourneyHeader({
  lang,
  courses,
  selectedCourse,
  importedDrafts,
  selectedDraft,
  userProfile,
  onChangeLanguage,
  onSelectCourse,
  onSelectDraft,
  onLogout,
}: JourneyHeaderProps) {
  return (
    <View style={styles.floatingHeader}>
      <View style={styles.headerRow}>
        <View style={styles.brandGroup}>
          <Text style={styles.brandTitle}>RideKorea</Text>
          <View style={styles.langSegmented}>
            {(['ko', 'en', 'ja'] as AppLanguage[]).map((language) => (
              <TouchableOpacity
                key={language}
                style={[styles.langSegment, lang === language && styles.langSegmentActive]}
                onPress={() => onChangeLanguage(language)}>
                <Text style={[styles.langSegmentText, lang === language && styles.langSegmentTextActive]}>
                  {LANGUAGE_LABELS[language]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {userProfile ? (
          <View style={styles.profileBox}>
            {userProfile.photoUrl && (
              <Image source={{ uri: userProfile.photoUrl }} style={styles.avatarImage} />
            )}
            <View style={styles.profileTextInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {userProfile.displayName || t(lang, journeyCopy.rider)}
              </Text>
              <Text style={styles.profileSubText}>{t(lang, journeyCopy.rider)}</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
              <Text style={styles.logoutText}>{t(lang, journeyCopy.logout)}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {importedDrafts.length > 0 && (
        <View style={styles.planBlock}>
          <Text style={styles.planLabel}>{t(lang, journeyCopy.importedRoutes)}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {importedDrafts.map((draft) => {
              const isActive = selectedDraft?.id === draft.id;
              return (
                <TouchableOpacity
                  key={draft.id}
                  style={[styles.planBadge, isActive && styles.activePlanBadge]}
                  onPress={() => onSelectDraft(draft)}>
                  <Text style={[styles.planBadgeText, isActive && styles.activePlanBadgeText]}>
                    {draft.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courseScroll}>
        {courses.map((course) => {
          const isActive = !selectedDraft && selectedCourse?.id === course.id;
          return (
            <TouchableOpacity
              key={course.id}
              style={[styles.courseBadge, isActive && styles.activeCourseBadge]}
              onPress={() => onSelectCourse(course)}>
              <Text style={[styles.courseBadgeText, isActive && styles.activeCourseBadgeText]}>
                {lang === 'ko' ? course.name : course.name_en} ({course.distance_km}km)
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingHeader: {
    position: 'absolute',
    top: 50,
    left: 15,
    right: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  langSegmented: {
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    flexDirection: 'row',
    padding: 3,
  },
  langSegment: {
    alignItems: 'center',
    borderRadius: 7,
    justifyContent: 'center',
    minWidth: 30,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  langSegmentActive: {
    backgroundColor: '#1E3A8A',
  },
  langSegmentText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#475569',
  },
  langSegmentTextActive: {
    color: '#FFFFFF',
  },
  profileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 4,
    paddingLeft: 8,
    maxWidth: '68%',
  },
  avatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  profileTextInfo: {
    marginRight: 8,
    maxWidth: 70,
  },
  profileName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155',
  },
  profileSubText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748B',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  courseScroll: {
    flexDirection: 'row',
    marginTop: 4,
  },
  planBlock: {
    marginBottom: 8,
  },
  planLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 6,
  },
  planBadge: {
    maxWidth: 220,
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    marginRight: 6,
  },
  activePlanBadge: {
    backgroundColor: '#0F172A',
  },
  planBadgeText: {
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '900',
  },
  activePlanBadgeText: {
    color: '#FFFFFF',
  },
  courseBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    marginRight: 6,
  },
  activeCourseBadge: {
    backgroundColor: '#1E3A8A',
  },
  courseBadgeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: 'bold',
  },
  activeCourseBadgeText: {
    color: '#fff',
  },
});
