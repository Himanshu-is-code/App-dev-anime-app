import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
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
import { useTrackedAnime } from '../(tabs)/TrackedAnimeContext'; // Make sure path is correct

// --- TYPE DEFINITIONS ---
interface AnimeDetails {
  mal_id: number;
  title: string;
  images: { jpg: { large_image_url: string } };
  synopsis: string;
  score: number | null;
  rank: number | null;
  popularity: number | null;
  type: string;
  episodes: number | null;
  status: string;
  rating: string;
  aired: { string: string };
  genres: { mal_id: number; name: string }[];
  streaming: { name: string; url: string }[];
}

interface Character {
  character: {
    mal_id: number;
    name: string;
    images: { jpg: { image_url: string } };
  };
  role: string;
}

interface Recommendation {
  entry: {
    mal_id: number;
    title: string;
    images: { jpg: { image_url: string } };
  };
}

// --- COLOR PALETTES ---
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

// --- MAIN COMPONENT ---
export default function AnimeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const ANIME_ID = Number(id);

  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? darkColors : lightColors;
  const styles = useMemo(() => getStyles(themeColors), [colorScheme]);

  const { 
    trackedIds, trackAnime, untrackAnime,
    watchLaterIds, addWatchLater, removeWatchLater
  } = useTrackedAnime();

  const [details, setDetails] = useState<AnimeDetails | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);

  const isTracked = trackedIds.includes(ANIME_ID.toString());
  const isWatchLater = watchLaterIds.includes(ANIME_ID.toString());

  useEffect(() => {
    if (!ANIME_ID) return;
    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [detailsRes, charactersRes, recommendationsRes] = await Promise.all([
          fetch(`https://api.jikan.moe/v4/anime/${ANIME_ID}/full`),
          fetch(`https://api.jikan.moe/v4/anime/${ANIME_ID}/characters`),
          fetch(`https://api.jikan.moe/v4/anime/${ANIME_ID}/recommendations`),
        ]);
        if (!detailsRes.ok) throw new Error('Failed to fetch anime details.');
        const detailsJson = await detailsRes.json();
        const charactersJson = await charactersRes.json();
        const recommendationsJson = await recommendationsRes.json();
        setDetails(detailsJson.data);
        setCharacters(charactersJson.data);
        setRecommendations(recommendationsJson.data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, [ANIME_ID]);

  const handleTrackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isTracked) {
      untrackAnime(ANIME_ID.toString());
    } else {
      trackAnime(ANIME_ID.toString());
    }
  };

  const handleWatchLaterPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isWatchLater) {
      removeWatchLater(ANIME_ID.toString());
    } else {
      addWatchLater(ANIME_ID.toString());
    }
  };


  // --- Reusable Render Components ---
  const StatPill = ({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string | number | null }) => (
    <View style={styles.statPill}>
      <Ionicons name={icon} size={20} color={themeColors.primary} />
      <Text style={styles.statValue}>{value || 'N/A'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const InfoRow = ({ label, value }: { label: string; value: string | number | null }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'N/A'}</Text>
    </View>
  );

  const renderCharacter = ({ item }: { item: Character }) => (
    <View style={styles.characterCard}>
      <Image source={{ uri: item.character.images.jpg.image_url }} style={styles.characterImage} />
      <Text style={styles.characterName} numberOfLines={2}>{item.character.name}</Text>
    </View>
  );

  const renderRecommendation = ({ item }: { item: Recommendation }) => (
     <Link href={`/anime/${item.entry.mal_id}`} asChild>
      <TouchableOpacity style={styles.characterCard}>
        <Image source={{ uri: item.entry.images.jpg.image_url }} style={styles.characterImage} />
        <Text style={styles.characterName} numberOfLines={2}>{item.entry.title}</Text>
      </TouchableOpacity>
    </Link>
  );


  // --- Loading / Error / Main Content ---
  if (isLoading) {
    return <SafeAreaView style={[styles.safeArea, styles.center]}><ActivityIndicator size="large" color={themeColors.primary} /></SafeAreaView>;
  }
  if (error || !details) {
    return <SafeAreaView style={[styles.safeArea, styles.center]}><Text style={styles.errorText}>{error || 'Could not load anime details.'}</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView>
        <ImageBackground source={{ uri: details.images.jpg.large_image_url }} style={styles.headerImage} resizeMode="cover">
          <View style={styles.headerOverlay} />
          
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          
          {/* ✅ HEADER TRACK BUTTON REMOVED */}
          
        </ImageBackground>

        <View style={styles.contentSheet}>
          <Text style={styles.title}>{details.title}</Text>
          <View style={styles.statsContainer}>
            <StatPill icon="star" label="Score" value={details.score} />
            <StatPill icon="trophy" label="Rank" value={`#${details.rank}`} />
            <StatPill icon="heart" label="Popularity" value={`#${details.popularity}`} />
          </View>

          <View style={styles.actionButtonContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, isTracked ? styles.actionButtonActive : styles.actionButtonInactive]}
              onPress={handleTrackPress}
            >
              <Ionicons 
                name={isTracked ? "checkmark" : "add"} 
                size={20} 
                color={isTracked ? themeColors.primaryText : themeColors.primary} 
              />
              <Text style={[styles.actionButtonText, isTracked ? styles.actionButtonTextActive : styles.actionButtonTextInactive]}>
                {isTracked ? "Tracked" : "Track"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, isWatchLater ? styles.actionButtonActive : styles.actionButtonInactive]}
              onPress={handleWatchLaterPress}
            >
              <Ionicons 
                name={isWatchLater ? "bookmark" : "bookmark-outline"} 
                size={20} 
                color={isWatchLater ? themeColors.primaryText : themeColors.primary}
              />
              <Text style={[styles.actionButtonText, isWatchLater ? styles.actionButtonTextActive : styles.actionButtonTextInactive]}>
                Watch Later
              </Text>
            </TouchableOpacity>
          </View>

          {/* ... Rest of your component JSX ... */}
          <View style={styles.section}>
            <Text style={styles.synopsis} numberOfLines={isSynopsisExpanded ? undefined : 4}>
              {details.synopsis || 'No synopsis available.'}
            </Text>
            {details.synopsis && details.synopsis.length > 200 && (
              <TouchableOpacity onPress={() => setIsSynopsisExpanded(!isSynopsisExpanded)}>
                <Text style={styles.readMore}>{isSynopsisExpanded ? 'Show Less' : 'Read More'}</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.section}>
            <InfoRow label="Type" value={details.type} />
            <InfoRow label="Episodes" value={details.episodes} />
            <InfoRow label="Status" value={details.status} />
            <InfoRow label="Aired" value={details.aired.string} />
            <InfoRow label="Rating" value={details.rating} />
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Genres</Text>
            <View style={styles.genreContainer}>
              {details.genres.map(genre => (
                <View key={genre.mal_id} style={styles.genreTag}>
                  <Text style={styles.genreText}>{genre.name}</Text>
                </View>
              ))}
            </View>
          </View>
          {details.streaming.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Stream On</Text>
              <View style={styles.genreContainer}>
                {details.streaming.map(service => (
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
                data={characters.filter(c => c.role === 'Main')}
                renderItem={renderCharacter}
                keyExtractor={(item) => item.character.mal_id.toString()}
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
                keyExtractor={(item) => item.entry.mal_id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- STYLESHEET ---
const getStyles = (themeColors: typeof lightColors) => StyleSheet.create({
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
    top: Platform.OS === "android" ? 10 : 50,
    left: 16, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    padding: 8, 
    borderRadius: 20 
  },
  
  // ✅ TRACK BUTTON STYLES IN HEADER REMOVED
  
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
  genreTag: { backgroundColor: themeColors.cardHover, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15 },
  genreText: { color: themeColors.textSecondary, fontSize: 14 },
  characterCard: { width: 100, marginRight: 12, alignItems: 'center' },
  characterImage: { width: 100, height: 140, borderRadius: 8, backgroundColor: themeColors.card },
  characterName: { color: themeColors.text, textAlign: 'center', marginTop: 8, fontSize: 14 },
});