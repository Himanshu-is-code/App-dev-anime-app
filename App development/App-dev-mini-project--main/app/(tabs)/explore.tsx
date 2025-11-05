import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import Animated from 'react-native-reanimated';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
// --- ADD THIS IMPORT ---
import { useScroll } from '@/components/ScrollContext';
import { Link } from 'expo-router'; // ✅ 1. IMPORT Link
import { useTrackedAnime } from './TrackedAnimeContext'; // Adjust path if needed

// --- TYPE DEFINITIONS ---
interface Broadcast {
  day: string | null;
  time: string | null;
  timezone: string | null;
  string: string | null;
}

interface AnimeSchedule {
  mal_id: number;
  title: string;
  images: { jpg: { image_url: string } };
  broadcast: Broadcast;
  score: number | null;
  url: string;
}

// --- NEW LIGHT & DARK COLOR PALETTES ---
const lightColors = {
  background: '#F3F4F6',
  text: '#111827',
  textSecondary: '#6B7280',
  primary: '#38e07b',
  primaryText: '#111827', // Dark text for on top of the green primary color
  card: '#FFFFFF',
  cardHover: '#F9FAFB',
  inputBackground: '#E5E7EB',
};

const darkColors = {
  background: '#122017',
  text: '#FFFFFF',
  textSecondary: '#a0aec0',
  primary: '#38e07b',
  primaryText: '#111827', // Dark text is still best on the bright green
  card: 'rgba(255, 255, 255, 0.05)',
  cardHover: 'rgba(255, 255, 255, 0.1)',
  inputBackground: '#2d3748',
};

// --- DATE HELPER FUNCTIONS ---
const getWeekDays = (date: Date): Date[] => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay()); // Start from Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });
};

const formatDateRange = (week: Date[]): string => {
  const start = week[0];
  const end = week[6];
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`;
};

const isSameDay = (d1: Date, d2: Date): boolean =>
  d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

const dayOfWeekNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayOfWeekApiFilter = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// --- MAIN COMPONENT ---
export default function ScheduleScreen() {
  const colorScheme = useColorScheme();
  const themeColors = colorScheme === 'dark' ? darkColors : lightColors;
  const styles = useMemo(() => getStyles(themeColors), [colorScheme]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [listData, setListData] = useState<AnimeSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Get all tracking and filtering logic from the context ---
  const { trackedIds, trackAnime, untrackAnime, showTrackedOnly, setShowTrackedOnly, getFilteredData } = useTrackedAnime();
  const { scrollRef, onScroll } = useScroll();

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const filteredListData = useMemo(() => {
    // Use the filtering function from the context
    return getFilteredData(listData);
  }, [listData, getFilteredData]);

  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      setError(null);
      const dayFilter = dayOfWeekApiFilter[selectedDate.getDay()];
      const url = `https://api.jikan.moe/v4/schedules?filter=${dayFilter}&sfw`;

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data.');
        const json = await response.json();
        const sortedData = json.data.sort((a: AnimeSchedule, b: AnimeSchedule) => {
          return (b.score || 0) - (a.score || 0);
        });
        setListData(sortedData);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [selectedDate]);

  const changeWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(prevDate.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  // --- UPDATED RENDER FUNCTION ---
  const renderListItem = ({ item }: { item: AnimeSchedule }) => {
    const isTracked = trackedIds.includes(item.mal_id.toString());

    const handleTrackPress = () => {
      if (isTracked) {
        untrackAnime(item.mal_id.toString());
      } else {
        trackAnime(item.mal_id.toString());
      }
    };

    return (
      // ✅ 2. WRAP THE CARD IN <Link>
      <Link href={`/anime/${item.mal_id}`} asChild>
        <TouchableOpacity style={styles.episodeCard}>
          {/* --- Image Container for positioning the button --- */}
          <View>
            <Image source={{ uri: item.images.jpg.image_url }} style={styles.episodeImage} />
            <TouchableOpacity
              style={[styles.trackButton, isTracked && styles.trackedButton]}
              onPress={handleTrackPress}
            >
              <Ionicons
                name={isTracked ? "checkmark-circle" : "add-circle-outline"}
                size={20}
                color={isTracked ? themeColors.primaryText : themeColors.text}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.episodeDetails}>
            <Text style={styles.episodeTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.episodeTime}>{`Score: ${item.score || 'N/A'} • Airs ${item.broadcast.time || 'TBA'}`}</Text>
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  const renderListHeader = () => (
    <>
      <View style={styles.main}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Upcoming Episodes</Text>
          {/* --- ADD THE FILTER BUTTON BACK --- */}
          <TouchableOpacity
            onPress={() => setShowTrackedOnly(prev => !prev)}
            style={styles.filterButton}
          >
            <Ionicons name={showTrackedOnly ? "funnel" : "funnel-outline"} size={24} color={showTrackedOnly ? themeColors.primary : themeColors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.contentGrid}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => changeWeek('prev')} style={styles.chevronButton}>
                <Ionicons name="chevron-back" size={18} color={themeColors.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.dateRangeText}>{formatDateRange(weekDays)}</Text>
              <TouchableOpacity onPress={() => changeWeek('next')} style={styles.chevronButton}>
                <Ionicons name="chevron-forward" size={18} color={themeColors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.dayNamesGrid}>
              {dayOfWeekNames.map(day => <Text key={day} style={styles.dayName}>{day}</Text>)}
            </View>
            <View style={styles.dateGrid}>
              {weekDays.map(date => {
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, new Date());
                return (
                  <TouchableOpacity
                    key={date.toISOString()}
                    style={[styles.dateButton, isSelected && styles.dateButtonSelected, isToday && !isSelected && styles.dateButtonToday]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>{date.getDate()}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.episodeListContainer}>
          <Text style={styles.listHeaderTitle}>
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text> 
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Header with no search bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={26} color={themeColors.text} />
        </TouchableOpacity>
        <Image
          source={{ uri: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }}
          style={styles.profileImage}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={themeColors.primary} style={{ flex: 1 }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <Animated.FlatList
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={16}
          data={filteredListData}
          renderItem={renderListItem}
          keyExtractor={(item) => item.mal_id.toString()}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={{ paddingBottom: 90 }}
          ListEmptyComponent={<Text style={styles.emptyListText}>{showTrackedOnly ? 'No tracked anime airing on this day.' : 'No episodes found for this day.'}</Text>}
        />
      )}
    </SafeAreaView>
  );
}

// --- STYLESHEET ---
const getStyles = (themeColors: typeof lightColors | typeof darkColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Aligns items to the right
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.card,
  },
  iconButton: {},
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 16,
  },
  main: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // To position the button correctly
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: themeColors.text,
  },
  // --- ADD THIS STYLE FOR THE FILTER BUTTON ---
  filterButton: {
    padding: 8,
    marginRight: -8, // To align it nicely with the edge
  },
  contentGrid: { marginTop: 24, gap: 48 },
  calendarContainer: {
    backgroundColor: themeColors.card,
    borderRadius: 12,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chevronButton: { padding: 8 },
  dateRangeText: { fontSize: 16, fontWeight: 'bold', color: themeColors.text },
  dayNamesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  dayName: {
    fontSize: 14,
    color: themeColors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    width: '14%',
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 4,
  },
  dateButton: {
    width: '14%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
  },
  dateButtonSelected: { backgroundColor: themeColors.primary },
  dateButtonToday: { borderWidth: 2, borderColor: themeColors.primary },
  dateText: { fontSize: 14, color: themeColors.text },
  dateTextSelected: { color: themeColors.primaryText, fontWeight: 'bold' },
  episodeListContainer: { gap: 16, marginTop: 32 },
  listHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeColors.text,
    paddingHorizontal: 16,
  },
  episodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Reduced gap
    backgroundColor: themeColors.cardHover,
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  episodeImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: themeColors.card,
  },
  episodeDetails: { flex: 1 },
  episodeTitle: { fontSize: 16, fontWeight: '500', color: themeColors.text },
  episodeTime: { fontSize: 14, color: themeColors.textSecondary, marginTop: 4 },
  errorText: { color: 'red', textAlign: 'center', marginTop: 20 },
  emptyListText: {
    color: themeColors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    paddingBottom: 20
  },
  // --- ADD THESE STYLES FOR THE BUTTON ---
  trackButton: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 999,
    padding: 2,
  },
  trackedButton: {
    backgroundColor: themeColors.primary,
  },
  trackButtonText: {
    marginLeft: 6,
    color: themeColors.textSecondary,
    fontSize: 12,
  },
});