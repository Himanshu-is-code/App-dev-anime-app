// app/(tabs)/anime/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useTrackedAnime } from '../TrackedAnimeContext'; // adjust path if needed
import VIPSubscriptionCTA, { VIPSubscriptionCTARef } from '../VIPCTA';

const lightColors = {
  background: '#F3F4F6',
  text: '#111827',
  textSecondary: '#6B7280',
  primary: '#38e07b',
  primaryText: '#111827',
  card: '#FFFFFF',
  cardHover: '#F9FAFB',
};

const darkColors = {
  background: '#122017',
  text: '#FFFFFF',
  textSecondary: '#a0aec0',
  primary: '#38e07b',
  primaryText: '#111827',
  card: 'rgba(255, 255, 255, 0.05)',
  cardHover: 'rgba(255, 255, 255, 0.1)',
};

export default function AnimeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ITEM_ID = Number(id);

  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? darkColors : lightColors;
  const styles = useMemo(() => getStyles(themeColors), [colorScheme]);

  const { trackedIds, trackAnime, untrackAnime, watchLaterIds, addWatchLater, removeWatchLater } = useTrackedAnime();

  const [details, setDetails] = useState<any | null>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);

  const vipCtaRef = useRef<VIPSubscriptionCTARef>(null);
  const isTracked = trackedIds.includes(ITEM_ID.toString());
  const isWatchLater = watchLaterIds.includes(ITEM_ID.toString());

  useEffect(() => {
    if (!ITEM_ID) return;
    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);
      setDetails(null);
      setCharacters([]);
      setRecommendations([]);

      try {
        // Always fetch anime details in this screen. Manga logic removed per request.
        const detailsUrl = `https://api.jikan.moe/v4/anime/${ITEM_ID}/full`;
        const charactersUrl = `https://api.jikan.moe/v4/anime/${ITEM_ID}/characters`;
        const recommendationsUrl = `https://api.jikan.moe/v4/anime/${ITEM_ID}/recommendations`;

        const [detailsRes, charactersRes, recommendationsRes] = await Promise.allSettled([
          fetch(detailsUrl),
          fetch(charactersUrl).catch(() => null),
          fetch(recommendationsUrl).catch(() => null),
        ]);

        if (detailsRes.status === 'fulfilled' && (detailsRes.value as Response).ok) {
          const detailsJson = await (detailsRes.value as Response).json();
          setDetails(detailsJson.data ?? detailsJson);
        } else {
          throw new Error('Failed to fetch anime details.');
        }

        if (charactersRes.status === 'fulfilled' && charactersRes.value && (charactersRes.value as Response).ok) {
          const chJson = await (charactersRes.value as Response).json();
          setCharacters(chJson.data ?? []);
        } else {
          setCharacters([]);
        }

        if (recommendationsRes.status === 'fulfilled' && recommendationsRes.value && (recommendationsRes.value as Response).ok) {
          const recJson = await (recommendationsRes.value as Response).json();
          setRecommendations(recJson.data ?? []);
        } else {
          setRecommendations([]);
        }
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [ITEM_ID]);

  const handleTrackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isTracked) untrackAnime(ITEM_ID.toString());
    else trackAnime(ITEM_ID.toString());
  };

  const handleWatchLaterPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isWatchLater) removeWatchLater(ITEM_ID.toString());
    else addWatchLater(ITEM_ID.toString());
  };

  const StatPill = ({ icon, label, value }: { icon: any; label: string; value: string | number | null }) => (
    <View style={styles.statPill}>
      <Ionicons name={icon} size={20} color={themeColors.primary} />
      <Text style={styles.statValue}>{value ?? 'N/A'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const InfoRow = ({ label, value }: { label: string; value: string | number | null }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value ?? 'N/A'}</Text>
    </View>
  );

  const renderCharacter = ({ item }: { item: any }) => {
    const charImg =
      (item && item.character && item.character.images && item.character.images.jpg && item.character.images.jpg.image_url) ||
      (item && item.images && item.images.jpg && item.images.jpg.image_url) ||
      '';

    return (
      <View style={styles.characterCard}>
        {charImg ? (
          <Image source={{ uri: charImg }} style={styles.characterImage} />
        ) : (
          <View style={[styles.characterImage, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: themeColors.textSecondary, fontSize: 12 }}>No image</Text>
          </View>
        )}
        <Text style={styles.characterName} numberOfLines={2}>
          {item?.character?.name ?? item?.name ?? 'Unknown'}
        </Text>
      </View>
    );
  };

  const renderRecommendation = ({ item }: { item: any }) => {
    const entry = item.entry ?? item;
    const id = entry.mal_id ?? entry.entry?.mal_id;
    const title = entry.title ?? entry.name ?? 'Unknown';
    const img = (entry.images && entry.images.jpg && (entry.images.jpg.image_url || entry.images.jpg.large_image_url)) ?? '';

    return (
      <Link href={`/anime/${id}`} asChild>
        <TouchableOpacity style={styles.characterCard}>
          {img ? (
            <Image source={{ uri: img }} style={styles.characterImage} />
          ) : (
            <View style={[styles.characterImage, { justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: themeColors.textSecondary, fontSize: 12 }}>No image</Text>
            </View>
          )}
          <Text style={styles.characterName} numberOfLines={2}>
            {title}
          </Text>
        </TouchableOpacity>
      </Link>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </SafeAreaView>
    );
  }
  if (error || !details) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <Text style={styles.errorText}>{error || 'Could not load details.'}</Text>
      </SafeAreaView>
    );
  }

  const title = details.title ?? details.name ?? 'Unknown';
  const imageUrl = details.images?.jpg?.large_image_url ?? details.images?.jpg?.image_url ?? details.image_url ?? '';
  const synopsis = details.synopsis ?? details.description ?? details.about ?? '';
  const score = details.score ?? details.scored ?? null;
  const rank = details.rank ?? details.ranked ?? null;
  const popularity = details.popularity ?? null;
  const type = details.type ?? '';
  const episodes = details?.episodes ?? null;
  const status = details?.status ?? details?.state ?? '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView>
        {imageUrl ? (
          <ImageBackground source={{ uri: imageUrl }} style={styles.headerImage} resizeMode="cover">
            <View style={styles.headerOverlay} />

            {/* Back button */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={themeColors.text} />
            </TouchableOpacity>

            {/* SEGMENTED CONTROL: Anime (active) / Manga (open external site) */}
            <View style={styles.segmentContainer}>
              <TouchableOpacity onPress={() => {}} style={[styles.segmentButton, styles.segmentActive]}>
                <Text style={[styles.segmentText, styles.segmentTextActive]}>Anime</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  vipCtaRef.current?.open(() => {
                    Linking.openURL('https://mangaplus.shueisha.co.jp/updates');
                  });
                }}
                style={[styles.segmentButton, styles.segmentInactive]}
              >
                <Text style={[styles.segmentText, styles.segmentTextInactive]}>Manga</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        ) : (
          <View style={[styles.headerImage, { backgroundColor: themeColors.card }]}>
            <View style={styles.headerOverlay} />
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={themeColors.text} />
            </TouchableOpacity>
            <View style={styles.segmentContainer}>
              <TouchableOpacity onPress={() => {}} style={[styles.segmentButton, styles.segmentActive]}>
                <Text style={[styles.segmentText, styles.segmentTextActive]}>Anime</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  vipCtaRef.current?.open(() => {
                    Linking.openURL('https://mangaplus.shueisha.co.jp/updates');
                  });
                }}
                style={[styles.segmentButton, styles.segmentInactive]}
              >
                <Text style={[styles.segmentText, styles.segmentTextInactive]}>Manga</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.contentSheet}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.statsContainer}>
            <StatPill icon="star" label="Score" value={score} />
            <StatPill icon="trophy" label="Rank" value={rank ? `#${rank}` : null} />
            <StatPill icon="heart" label="Popularity" value={popularity ? `#${popularity}` : null} />
          </View>

          <View style={styles.actionButtonContainer}>
            <TouchableOpacity style={[styles.actionButton, isTracked ? styles.actionButtonActive : styles.actionButtonInactive]} onPress={handleTrackPress}>
              <Ionicons name={isTracked ? 'checkmark' : 'add'} size={20} color={isTracked ? themeColors.primaryText : themeColors.primary} />
              <Text style={[styles.actionButtonText, isTracked ? styles.actionButtonTextActive : styles.actionButtonTextInactive]}>{isTracked ? 'Tracked' : 'Track'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, isWatchLater ? styles.actionButtonActive : styles.actionButtonInactive]} onPress={handleWatchLaterPress}>
              <Ionicons name={isWatchLater ? 'bookmark' : 'bookmark-outline'} size={20} color={isWatchLater ? themeColors.primaryText : themeColors.primary} />
              <Text style={[styles.actionButtonText, isWatchLater ? styles.actionButtonTextActive : styles.actionButtonTextInactive]}>Watch Later</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.synopsis} numberOfLines={isSynopsisExpanded ? undefined : 4}>
              {synopsis || 'No synopsis available.'}
            </Text>
            {synopsis && synopsis.length > 200 && (
              <TouchableOpacity onPress={() => setIsSynopsisExpanded(!isSynopsisExpanded)}>
                <Text style={styles.readMore}>{isSynopsisExpanded ? 'Show Less' : 'Read More'}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <InfoRow label="Type" value={type} />
            <InfoRow label="Episodes" value={episodes} />
            <InfoRow label="Status" value={status} />
            <InfoRow label="Aired" value={details?.aired?.string ?? ''} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Genres</Text>
            <View style={styles.genreContainer}>
              {(details?.genres || []).map((genre: any) => (
                <View key={genre.mal_id} style={styles.genreTag}>
                  <Text style={styles.genreText}>{genre.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {details?.streaming && details.streaming.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Stream On</Text>
              <View style={styles.genreContainer}>
                {details.streaming.map((service: any) => (
                  <TouchableOpacity key={service.name} style={styles.genreTag} onPress={() => Linking.openURL(service.url)}>
                    <Text style={styles.genreText}>{service.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {characters.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Characters</Text>
              <FlatList
                data={characters.filter((c: any) => c.role === 'Main' || true).slice(0, 20)}
                renderItem={renderCharacter}
                keyExtractor={(item) => (item.character?.mal_id ?? item.mal_id ?? Math.random()).toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}

          {recommendations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              <FlatList
                data={recommendations.slice(0, 10)}
                renderItem={renderRecommendation}
                keyExtractor={(item) => (item.entry?.mal_id ?? item.mal_id ?? Math.random()).toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Add the VIP CTA component here, it will be invisible until opened */}
      <VIPSubscriptionCTA ref={vipCtaRef} />
    </SafeAreaView>
  );
}

const getStyles = (themeColors: typeof lightColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: themeColors.background,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    center: { justifyContent: 'center', alignItems: 'center' },
    errorText: { color: 'red', textAlign: 'center', margin: 20 },
    headerImage: { height: 280, justifyContent: 'flex-end' },
    headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(18, 32, 23, 0.4)' },
    backButton: {
      position: 'absolute',
      top: Platform.OS === 'android' ? 10 : 50,
      left: 16,
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: 8,
      borderRadius: 20,
      zIndex: 20,
    },

    // Visible segmented control styles
    segmentContainer: {
      position: 'absolute',
      top: Platform.OS === 'android' ? 12 : 50,
      right: 12,
      flexDirection: 'row',
      borderRadius: 999,
      backgroundColor: 'rgba(0,0,0,0.25)',
      padding: 3,
      zIndex: 30,
    },
    segmentButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      minWidth: 72,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentActive: {
      backgroundColor: '#fff',
    },
    segmentInactive: {
      backgroundColor: 'transparent',
    },
    segmentText: {
      fontWeight: '600',
    },
    segmentTextActive: {
      color: '#111',
    },
    segmentTextInactive: {
      color: '#fff',
    },

    contentSheet: {
      backgroundColor: themeColors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      marginTop: -24,
      padding: 16,
      paddingBottom: 50,
    },
    title: { color: themeColors.text, fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    statPill: { alignItems: 'center', backgroundColor: themeColors.card, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, minWidth: 90 },
    statValue: { color: themeColors.text, fontSize: 16, fontWeight: 'bold' },
    statLabel: { color: themeColors.textSecondary, fontSize: 12, marginTop: 2 },
    actionButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 24,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
    },
    actionButtonActive: {
      backgroundColor: themeColors.primary,
    },
    actionButtonInactive: {
      backgroundColor: themeColors.cardHover,
      borderWidth: 1,
      borderColor: themeColors.primary,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    actionButtonTextActive: {
      color: themeColors.primaryText,
    },
    actionButtonTextInactive: {
      color: themeColors.primary,
    },
    section: { marginBottom: 24 },
    sectionTitle: { color: themeColors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
    synopsis: { color: themeColors.textSecondary, fontSize: 16, lineHeight: 24 },
    readMore: { color: themeColors.primary, fontSize: 16, fontWeight: 'bold', marginTop: 8 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: themeColors.card },
    infoLabel: { color: themeColors.textSecondary, fontSize: 16 },
    infoValue: { color: themeColors.text, fontSize: 16, fontWeight: '500', flex: 1, textAlign: 'right' },
    genreContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    genreTag: { backgroundColor: themeColors.cardHover, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15, marginRight: 8, marginBottom: 8 },
    genreText: { color: themeColors.textSecondary, fontSize: 14 },
    characterCard: { width: 100, marginRight: 12, alignItems: 'center' },
    characterImage: { width: 100, height: 140, borderRadius: 8, backgroundColor: themeColors.card },
    characterName: { color: themeColors.text, textAlign: 'center', marginTop: 8, fontSize: 14 },
  });
