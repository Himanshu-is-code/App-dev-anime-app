import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Generic Type for items that can be tracked ---
type TrackableItem = {
  mal_id: number;
  [key: string]: any; // Allow other properties
};

// --- Storage Keys ---
const TRACKED_ANIME_KEY = 'tracked_anime_ids';
const WATCH_LATER_KEY = 'watch_later_ids'; // ✅ 1. Add key for watch later

// --- Define the shape of the context data ---
interface TrackedAnimeContextType {
  trackedIds: string[];
  trackAnime: (id: string) => void;
  untrackAnime: (id: string) => void;
  isLoading: boolean;
  showTrackedOnly: boolean;
  setShowTrackedOnly: React.Dispatch<React.SetStateAction<boolean>>;
  getFilteredData: <T extends TrackableItem>(data: T[]) => T[];

  // ✅ 2. Add watch later types
  watchLaterIds: string[];
  addWatchLater: (id: string) => void;
  removeWatchLater: (id: string) => void;
}

// --- Create the context with a default value ---
const TrackedAnimeContext = createContext<TrackedAnimeContextType | undefined>(undefined);

// --- Create the Provider component ---
export const TrackedAnimeProvider = ({ children }: { children: ReactNode | null }) => {
  const [trackedIds, setTrackedIds] = useState<string[]>([]);
  // ✅ 3. Add watch later state
  const [watchLaterIds, setWatchLaterIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTrackedOnly, setShowTrackedOnly] = useState(false);

  // Load tracked IDs from storage on initial app load
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load both lists at the same time
        const [storedIds, storedWatchLaterIds] = await Promise.all([
          AsyncStorage.getItem(TRACKED_ANIME_KEY),
          AsyncStorage.getItem(WATCH_LATER_KEY),
        ]);

        if (storedIds) {
          try {
            const parsed = JSON.parse(storedIds);
            if (Array.isArray(parsed)) setTrackedIds(parsed.map(String));
          } catch (e) {
            console.warn('Failed to parse tracked anime ids from storage', e);
          }
        }

        if (storedWatchLaterIds) {
          try {
            const parsed = JSON.parse(storedWatchLaterIds);
            if (Array.isArray(parsed)) setWatchLaterIds(parsed.map(String));
          } catch (e) {
            console.warn('Failed to parse watch later ids from storage', e);
          }
        }
      } catch (error) {
        console.error('Failed to load data from storage', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // --- Track/Untrack Functions ---
  const trackAnime = useCallback((id: string) => {
    setTrackedIds(prevIds => {
      if (prevIds.includes(id)) return prevIds;
      const newTrackedIds = [...prevIds, id];
      AsyncStorage.setItem(TRACKED_ANIME_KEY, JSON.stringify(newTrackedIds)).catch(error => console.error("Failed to save tracked anime", error));
      return newTrackedIds;
    });
  }, []);

  const untrackAnime = useCallback((id: string) => {
    setTrackedIds(prevIds => {
      const newTrackedIds = prevIds.filter((trackedId) => trackedId !== id);
      AsyncStorage.setItem(TRACKED_ANIME_KEY, JSON.stringify(newTrackedIds)).catch(error => console.error("Failed to save tracked anime", error));
      return newTrackedIds;
    });
  }, []);

  // ✅ 4. Add watch later functions
  const addWatchLater = useCallback((id: string) => {
    setWatchLaterIds(prevIds => {
      if (prevIds.includes(id)) return prevIds;
      const newIds = [...prevIds, id];
      AsyncStorage.setItem(WATCH_LATER_KEY, JSON.stringify(newIds)).catch(error => console.error("Failed to save watch later", error));
      return newIds;
    });
  }, []);

  const removeWatchLater = useCallback((id: string) => {
    setWatchLaterIds(prevIds => {
      const newIds = prevIds.filter((currentId) => currentId !== id);
      AsyncStorage.setItem(WATCH_LATER_KEY, JSON.stringify(newIds)).catch(error => console.error("Failed to save watch later", error));
      return newIds;
    });
  }, []);


  const getFilteredData = useCallback(<T extends TrackableItem>(data: T[]): T[] => {
    if (showTrackedOnly) {
      return data.filter(item => trackedIds.includes(item.mal_id.toString()));
    }
    return data;
  }, [showTrackedOnly, trackedIds]);

  // ✅ 5. Add new values to the context provider
  const value = useMemo(() => ({
    trackedIds,
    trackAnime,
    untrackAnime,
    isLoading,
    showTrackedOnly,
    setShowTrackedOnly,
    getFilteredData,
    watchLaterIds,
    addWatchLater,
    removeWatchLater,
  }), [
    trackedIds, trackAnime, untrackAnime, isLoading, showTrackedOnly, getFilteredData,
    watchLaterIds, addWatchLater, removeWatchLater,
  ]);

  return (
    <TrackedAnimeContext.Provider value={value}>
      {children}
    </TrackedAnimeContext.Provider>
  );
};

// --- Create the custom hook for easy consumption ---
export const useTrackedAnime = () => {
  const context = useContext(TrackedAnimeContext);
  if (context === undefined) {
    throw new Error('useTrackedAnime must be used within a TrackedAnimeProvider');
  }
  return context;
};