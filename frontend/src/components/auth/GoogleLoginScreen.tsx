import { BrandLogo } from '@/components/brand/BrandLogo';
import { authCopy, LANGUAGE_LABELS, t } from '@/i18n';
import type { AppLanguage } from '@/types/ridekorea';
import React from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface GoogleLoginScreenProps {
  lang: AppLanguage;
  isLoading: boolean;
  isDevLoginLoading?: boolean;
  onLoginPress: () => void;
  onDevLoginPress?: () => void;
  onChangeLanguage: (lang: AppLanguage) => void;
}

const LANGUAGES: AppLanguage[] = ['ko', 'en', 'ja'];

export function GoogleLoginScreen({
  lang,
  isLoading,
  isDevLoginLoading = false,
  onLoginPress,
  onDevLoginPress,
  onChangeLanguage,
}: GoogleLoginScreenProps) {
  const isAnyLoginLoading = isLoading || isDevLoginLoading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.languageSegmented}>
          {LANGUAGES.map((language) => (
            <TouchableOpacity
              key={language}
              style={[styles.languageSegment, lang === language && styles.languageSegmentActive]}
              onPress={() => onChangeLanguage(language)}>
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

        <View style={styles.brandBlock}>
          <BrandLogo />
          <Text style={styles.subtitle}>{t(lang, authCopy.subtitle)}</Text>
        </View>

        <View style={styles.loginPanel}>
          <Text style={styles.panelTitle}>{t(lang, authCopy.panelTitle)}</Text>
          <Text style={styles.panelCopy}>{t(lang, authCopy.panelCopy)}</Text>

          <TouchableOpacity
            style={[styles.googleButton, isLoading && styles.disabledButton]}
            onPress={onLoginPress}
            disabled={isAnyLoginLoading}
            activeOpacity={0.85}>
            {isLoading ? (
              <ActivityIndicator color="#1E3A8A" />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>{t(lang, authCopy.googleButton)}</Text>
              </>
            )}
          </TouchableOpacity>

          {onDevLoginPress ? (
            <TouchableOpacity
              style={styles.devLoginButton}
              onPress={onDevLoginPress}
              disabled={isAnyLoginLoading}
              activeOpacity={0.72}>
              {isDevLoginLoading ? (
                <ActivityIndicator color="#64748B" size="small" />
              ) : (
                <Text style={styles.devLoginText}>dev_로그인</Text>
              )}
            </TouchableOpacity>
          ) : null}

          <Text style={styles.legalText}>{t(lang, authCopy.legal)}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  languageSegmented: {
    alignSelf: 'flex-end',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    flexDirection: 'row',
    padding: 4,
  },
  languageSegment: {
    alignItems: 'center',
    borderRadius: 8,
    minWidth: 44,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  languageSegmentActive: {
    backgroundColor: '#1E3A8A',
  },
  languageSegmentText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '900',
  },
  languageSegmentTextActive: {
    color: '#FFFFFF',
  },
  brandBlock: {
    alignItems: 'center',
    gap: 12,
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 300,
    textAlign: 'center',
  },
  loginPanel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  panelTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  panelCopy: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    height: 52,
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  googleIcon: {
    color: '#1E3A8A',
    fontSize: 18,
    fontWeight: '900',
  },
  googleButtonText: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '800',
  },
  devLoginButton: {
    alignItems: 'center',
    alignSelf: 'center',
    minHeight: 28,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  devLoginText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  legalText: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
  },
});
