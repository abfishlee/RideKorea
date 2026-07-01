import { authCopy, LANGUAGE_LABELS, nextLanguage, t } from '@/i18n';
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
  onLoginPress: () => void;
  onToggleLanguage: () => void;
}

export function GoogleLoginScreen({
  lang,
  isLoading,
  onLoginPress,
  onToggleLanguage,
}: GoogleLoginScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.langButton} onPress={onToggleLanguage}>
          <Text style={styles.langButtonText}>{LANGUAGE_LABELS[nextLanguage(lang)]}</Text>
        </TouchableOpacity>

        <View style={styles.brandBlock}>
          <Text style={styles.logoMark}>RK</Text>
          <Text style={styles.title}>RideKorea</Text>
          <Text style={styles.subtitle}>{t(lang, authCopy.subtitle)}</Text>
        </View>

        <View style={styles.loginPanel}>
          <Text style={styles.panelTitle}>{t(lang, authCopy.panelTitle)}</Text>
          <Text style={styles.panelCopy}>{t(lang, authCopy.panelCopy)}</Text>

          <TouchableOpacity
            style={[styles.googleButton, isLoading && styles.disabledButton]}
            onPress={onLoginPress}
            disabled={isLoading}
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
  langButton: {
    alignSelf: 'flex-end',
    borderColor: '#CBD5E1',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  langButtonText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
  },
  brandBlock: {
    alignItems: 'center',
    gap: 12,
  },
  logoMark: {
    backgroundColor: '#1E3A8A',
    borderRadius: 16,
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  title: {
    color: '#0F172A',
    fontSize: 34,
    fontWeight: '900',
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
  legalText: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
  },
});
