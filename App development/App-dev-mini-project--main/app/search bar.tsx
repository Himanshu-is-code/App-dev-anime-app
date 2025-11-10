import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router'; // ✅ 1. IMPORT Link
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

// --- Type Definition ---
interface AnimeSearch {
  mal_id: number;
  title: string;
  images: { jpg: { image_url: string } };
  synopsis: string | null;
  score: number | null;
  type: string;
}

// --- Color palettes (can be imported from a shared file) ---
const lightColors = {
  background: '#F3F4F6',
  text: '#111827',
  textSecondary: '#6B7280',
  inputBackground: '#E5E7EB',
  primary: '#38e07b',
};

const darkColors = {
  background: '#122017',
  text: '#FFFFFF',
  textSecondary: '#a0aec0',
  inputBackground: '#2d3748',
  primary: '#38e07b',
};

// --- Main Search Screen Component ---
export default function SearchBarScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? darkColors : lightColors;
  const styles = useMemo(() => getStyles(themeColors), [colorScheme]);

  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const [searchResults, setSearchResults] = useState<AnimeSearch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effect to fetch search results when query changes
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const handler = setTimeout(() => {
      const fetchSearch = async () => {
        setIsSearching(true);
        setError(null);
        // Added limit=10 to keep results manageable
        const url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchQuery)}&sfw&limit=10`;

        try {
          const response = await fetch(url);
          if (!response.ok) throw new Error('Failed to fetch search results.');
          const json = await response.json();
          setSearchResults(json.data);
        } catch (e: any) {
          setError(e.message);
        } finally {
          setIsSearching(false);
        }
      };
      fetchSearch();
    }, 500); // Debounce API calls

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // ✅ 2. WRAP YOUR CARD WITH THE <Link> COMPONENT
  const renderSearchResultItem = ({ item }: { item: AnimeSearch }) => (
    <Link href={`/anime/${item.mal_id}`} asChild>
      <TouchableOpacity style={styles.searchResultCard}>
        <Image source={{ uri: item.images.jpg.image_url }} style={styles.searchResultImage} />
        <View style={styles.searchResultDetails}>
          <Text style={styles.searchResultTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.searchResultMeta} numberOfLines={2}>{`Type: ${item.type} • Score: ${item.score || 'N/A'}`}</Text>
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* --- Header with Back Button and Live Search Input --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={themeColors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search for anime..."
            placeholderTextColor={themeColors.textSecondary}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true} // Automatically focus the input
          />
        </View>
      </View>

      {/* --- Search Results List --- */}
      <View style={styles.listContainer}>
        {isSearching ? (
          <ActivityIndicator size="large" color={themeColors.primary} style={{marginTop: 50}} />
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResultItem}
            keyExtractor={(item) => item.mal_id.toString()}
            ListEmptyComponent={
                <Text style={styles.emptySearchText}>
                  {searchQuery.length < 3 ? 'Type at least 3 characters to search.' : `No results for "${searchQuery}"`}
                </Text>
            }
          />
        )}
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.inputBackground,
  },
  backButton: { paddingRight: 12 },
  searchContainer: { flex: 1, position: 'relative' },
  searchIcon: { position: 'absolute', left: 16, top: 12, zIndex: 1 },
  searchInput: { backgroundColor: themeColors.inputBackground, color: themeColors.text, borderRadius: 9999, height: 44, paddingLeft: 48, paddingRight: 16, fontSize: 16 },
  listContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  searchResultCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  searchResultImage: { width: 60, height: 90, borderRadius: 8, backgroundColor: themeColors.inputBackground },
  searchResultDetails: { flex: 1, marginLeft: 12 },
  searchResultTitle: { fontSize: 16, fontWeight: 'bold', color: themeColors.text },
  searchResultMeta: { fontSize: 14, color: themeColors.textSecondary, marginTop: 4 },
  emptySearchText: { color: themeColors.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 },
});