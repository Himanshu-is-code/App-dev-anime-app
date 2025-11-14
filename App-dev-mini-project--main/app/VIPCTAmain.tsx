import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import VIPSubscriptionCTA, { VIPSubscriptionCTARef } from './VIPCTA';
import { Ionicons } from '@expo/vector-icons';

// --- Color palettes for light and dark modes ---
const lightColors = {
  background: '#F3F4F6',
  text: '#111827',
  textSecondary: '#6B7280',
  card: '#FFFFFF',
  primary: '#38e07b',
  border: 'rgba(128,128,128,0.2)',
  cardSecondary: '#F9FAFB',
  primaryText: '#111827',
};

const darkColors = {
  background: '#122017',
  text: '#FFFFFF',
  textSecondary: '#a0aec0',
  card: 'rgba(255, 255, 255, 0.05)',
  primary: '#38e07b',
  border: 'rgba(128,128,128,0.4)',
  cardSecondary: '#2d3748',
  primaryText: '#111827',
};

const FeatureItem = ({ icon, text, themeColors }: { icon: any; text: string; themeColors: typeof lightColors }) => (
  <View style={getStyles(themeColors).featureItem}>
    <Ionicons name={icon} size={22} color={themeColors.primary} />
    <Text style={[getStyles(themeColors).featureText, { color: themeColors.text }]}>{text}</Text>
  </View>
);

export default function VIPCTAScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? darkColors : lightColors;
  const styles = useMemo(() => getStyles(themeColors), [colorScheme]);
  const vipCtaRef = useRef<VIPSubscriptionCTARef>(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Unlock Everything</Text>
          <Text style={styles.heroSubtitle}>
            Get unlimited tracking, an ad-free experience, and early access to new features.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <FeatureItem icon="star-outline" text="Unlimited Anime Tracking" themeColors={themeColors} />
          <FeatureItem icon="shield-checkmark-outline" text="Ad-Free Experience" themeColors={themeColors} />
          <FeatureItem icon="rocket-outline" text="Early Access to New Features" themeColors={themeColors} />
          <FeatureItem icon="heart-outline" text="Priority Support" themeColors={themeColors} />
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          <TouchableOpacity style={styles.planCard}>
            <Text style={styles.planTitle}>Monthly</Text>
            <Text style={styles.planPrice}>299 INR</Text>
            <Text style={styles.planPeriod}>per month</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.planCard, styles.planCardRecommended]}>
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>SAVE 20%</Text>
            </View>
            <Text style={styles.planTitle}>Yearly</Text>
            <Text style={styles.planPrice}>2,999 INR</Text>
            <Text style={styles.planPeriod}>per year</Text>
          </TouchableOpacity>
        </View>

        {/* Continue button → directly goes to VIPCTA.tsx */}
        <TouchableOpacity style={styles.continueButton}
          onPress={() => {
            vipCtaRef.current?.open();
          }}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 24 }}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>
      </ScrollView>
      <VIPSubscriptionCTA ref={vipCtaRef} />
    </SafeAreaView>
  );
}

const getStyles = (themeColors: typeof lightColors | typeof darkColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backButton: {
      padding: 8,
      marginLeft: -8,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingBottom: 40,
    },
    heroSection: {
      alignItems: 'center',
      marginVertical: 24,
    },
    heroTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 16,
      color: themeColors.textSecondary,
      textAlign: 'center',
    },
    featuresContainer: {
      marginBottom: 32,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    featureText: {
      fontSize: 16,
      marginLeft: 16,
    },
    plansContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 16,
    },
    planCard: {
      flex: 1,
      backgroundColor: themeColors.card,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: themeColors.border,
    },
    planCardRecommended: {
      borderColor: themeColors.primary,
    },
    recommendedBadge: {
      position: 'absolute',
      top: -12,
      backgroundColor: themeColors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    recommendedText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
    },
    planTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: themeColors.text,
    },
    planPrice: {
      fontSize: 24,
      fontWeight: 'bold',
      color: themeColors.text,
      marginVertical: 8,
    },
    planPeriod: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    continueButton: {
      backgroundColor: themeColors.primary,
      padding: 16,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: 32,
    },
    continueButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    restoreText: {
      color: themeColors.textSecondary,
      textAlign: 'center',
      fontSize: 14,
    },
  });
