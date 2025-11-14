// app/(tabs)/profile.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  StatusBar,
  Image,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTrackedAnime } from '../TrackedAnimeContext';
import { useAuth } from '../AuthContext';

// --- Color palettes for light and dark modes ---
const lightColors = {
  background: '#F3F4F6',
  text: '#111827',
  textSecondary: '#6B7280',
  card: '#FFFFFF',
  cardHover: '#F9FAFB',
  primary: '#38e07b',
};

const darkColors = {
  background: '#122017',
  text: '#FFFFFF',
  textSecondary: '#a0aec0',
  card: 'rgba(255, 255, 255, 0.05)',
  cardHover: 'rgba(255, 255, 255, 0.1)',
  primary: '#38e07b',
};

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? darkColors : lightColors;
  const styles = useMemo(() => getStyles(themeColors), [colorScheme]);

  // Get tracked/watch-later and auth info
  const { trackedIds = [], watchLaterIds = [], isLoading: isContextLoading } = useTrackedAnime();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [airingWatchLater, setAiringWatchLater] = useState<any[]>([]);
  const [isAiringLoading, setIsAiringLoading] = useState(false);

  useEffect(() => {
    // Only fetch airing list when user is logged in and context finished loading
    if (!user) {
      setAiringWatchLater([]);
      setIsAiringLoading(false);
      return;
    }

    if (isContextLoading) {
      // context still loading; don't fetch yet
      return;
    }

    const fetchAiringFromWatchLater = async () => {
      if (!Array.isArray(watchLaterIds) || watchLaterIds.length === 0) {
        setAiringWatchLater([]);
        setIsAiringLoading(false);
        return;
      }

      setIsAiringLoading(true);
      try {
        const promises = watchLaterIds.map((id: string) =>
          fetch(`https://api.jikan.moe/v4/anime/${id}`)
            .then(res => (res.ok ? res.json() : Promise.reject(`Failed to fetch ${id}`)))
            .then(json => json.data)
            .catch(err => {
              console.warn(`Could not fetch details for anime ID ${id}:`, err);
              return null;
            })
        );

        const results = await Promise.all(promises);
        const currentlyAiring = results.filter(
          anime => anime && anime.status === 'Currently Airing'
        );

        setAiringWatchLater(currentlyAiring);
      } catch (err) {
        console.error('An unexpected error occurred while fetching airing anime:', err);
      } finally {
        setIsAiringLoading(false);
      }
    };

    fetchAiringFromWatchLater();
  }, [watchLaterIds, isContextLoading, user]);

  // --- Enhanced User Info Logic ---
  const displayName = useMemo(() => {
    if (user?.displayName) {
      return user.displayName;
    }
    if (user?.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return 'Guest User';
  }, [user]);

  const avatarUrl = useMemo(() => {
    if (user?.photoURL) {
      return user.photoURL;
    }
    if (displayName !== 'Guest User' && displayName.length > 0) {
      return `https://ui-avatars.com/api/?name=${displayName.charAt(0)}&background=random&color=fff&size=128`;
    }
    return ''; // Return empty string for guest or if no name can be derived
  }, [user, displayName]);

  // Render
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>My Profile</Text>
          <TouchableOpacity onPress={() => { /* Navigate to settings */ }} style={styles.iconButton}>
            <Ionicons name="settings-outline" size={24} color={themeColors.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileHeader}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <Text style={styles.username}>{displayName}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{Array.isArray(trackedIds) ? trackedIds.length : 0}</Text>
              <Text style={styles.statLabel}>Tracked</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{Array.isArray(watchLaterIds) ? watchLaterIds.length : 0}</Text>
              <Text style={styles.statLabel}>Watch Later</Text>
            </View>
          </View>
        </View>

        {/* VIP CTA Banner */}
        <View
          style={{
            backgroundColor: themeColors.card,
            marginHorizontal: 16,
            padding: 20,
            borderRadius: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: 'rgba(128,128,128,0.2)',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 18,
              color: themeColors.text,
              fontWeight: 'bold',
              marginBottom: 8,
            }}
          >
            Upgrade to VIP
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: themeColors.textSecondary,
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            Get unlimited tracking, no ads, and early access to features!
          </Text>
          <TouchableOpacity onPress={() => router.push('/VIPCTAmain')} style={styles.vipButton}>
            <Text style={styles.vipButtonText}>Subscribe</Text>
          </TouchableOpacity>
        </View>

        {/* Airing From Watch Later - only visible when logged in */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Airing From Your List</Text>

          {isAuthLoading ? (
            // waiting for auth state
            <ActivityIndicator color={themeColors.primary} />
          ) : !user ? (
            // not logged in -> prompt to sign in
            <View style={{ paddingHorizontal: 16, alignItems: 'center' }}>
              <Text style={styles.text}>
                Sign in to see which of your "Watch Later" anime are currently airing.
              </Text>
              <TouchableOpacity
                style={[styles.signOutButton, { marginTop: 12 }]}
                onPress={() => router.push('/authmodel')}
              >
                <Text style={[styles.signOutText]}>Sign in / Manage Account</Text>
              </TouchableOpacity>
            </View>
          ) : isAiringLoading ? (
            <ActivityIndicator color={themeColors.primary} />
          ) : airingWatchLater.length > 0 ? (
            <FlatList
              data={airingWatchLater}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.mal_id.toString()}
              renderItem={({ item }) => (
                <Link href={`/anime/${item.mal_id}`} asChild>
                  <TouchableOpacity style={styles.animeCard}>
                    <Image source={{ uri: item.images.jpg.image_url }} style={styles.animeImage} />
                    <Text style={styles.animeTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                </Link>
              )}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              style={{ marginHorizontal: -16 }}
            />
          ) : (
            <Text style={styles.text}>None of the anime in your "Watch Later" list are currently airing.</Text>
          )}
        </View>

        <View style={styles.content}>
          <TouchableOpacity style={styles.signOutButton} onPress={() => router.push('/authmodel')}>
            <Text style={styles.signOutText}>Account & Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (themeColors: typeof lightColors | typeof darkColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    iconButton: { padding: 8, marginRight: -8 },
    content: { marginTop: 24, paddingHorizontal: 16 },
    profileHeader: {
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 32,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: 12,
      backgroundColor: themeColors.card,
    },
    username: {
      fontSize: 22,
      fontWeight: 'bold',
      color: themeColors.text,
      marginBottom: 16,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '80%',
    },
    statBox: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: themeColors.text,
    },
    statLabel: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginTop: 4,
    },
    section: {
      marginBottom: 32,
      paddingHorizontal: 16,
    },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: themeColors.text },
    text: { fontSize: 16, color: themeColors.textSecondary, textAlign: 'center' },
    animeCard: {
      width: 120,
      marginRight: 12,
    },
    animeImage: {
      width: '100%',
      height: 170,
      borderRadius: 12,
      backgroundColor: themeColors.card,
    },
    animeTitle: {
      color: themeColors.text,
      fontSize: 14,
      fontWeight: '500',
      marginTop: 8,
    },
    signOutButton: {
      backgroundColor: themeColors.card,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(128,128,128,0.2)',
    },
    signOutText: { color: themeColors.text, fontWeight: '600', fontSize: 16 },
    vipButton: {
      backgroundColor: themeColors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
    },
    vipButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold'
    },
  });
