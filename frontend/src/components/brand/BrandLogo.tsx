import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

const natureCodeLogo = require('@/assets/images/naturecode-logo.png');

interface BrandLogoProps {
  compact?: boolean;
}

export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <Image
        source={natureCodeLogo}
        style={[styles.logo, compact && styles.compactLogo]}
        resizeMode="contain"
      />
      <View style={styles.textBlock}>
        <Text style={[styles.title, compact && styles.compactTitle]}>RideKorea</Text>
        {!compact && (
          <Text style={styles.company}>by NatureCode</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  compactContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  logo: {
    height: 86,
    width: 86,
  },
  compactLogo: {
    height: 30,
    width: 30,
  },
  textBlock: {
    alignItems: 'center',
  },
  title: {
    color: '#0F172A',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
  },
  compactTitle: {
    color: '#1E3A8A',
    fontSize: 20,
    lineHeight: 24,
  },
  company: {
    color: '#2D6A4F',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    marginTop: 2,
  },
});
