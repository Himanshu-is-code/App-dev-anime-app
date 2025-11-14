import React, { createContext, useContext, ReactNode } from 'react';
import {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withTiming,
  AnimatedRef,
  AnimatedStyle,
  useAnimatedRef,
} from 'react-native-reanimated';
import type { AnimatedProps } from 'react-native-reanimated';
import type { ScrollView, View, NativeScrollEvent, NativeSyntheticEvent, ViewStyle } from 'react-native';

// Define the height of your tab bar. 
// 65 (from your old style) + ~25 for safe area padding = 90
const TAB_BAR_HEIGHT = 90;

interface ScrollContextType {
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  tabBarAnimatedStyle: AnimatedStyle<ViewStyle>;
  scrollRef: AnimatedRef<any>; // Use a more generic type
}

const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

export const ScrollContextProvider = ({ children }: { children: ReactNode }) => {
  const translateY = useSharedValue(0);
  const prevScrollY = useSharedValue(0);
  const scrollRef = useAnimatedRef<any>(); // Use a more generic type

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentScrollY = event.contentOffset.y;
      const diff = currentScrollY - prevScrollY.value;

      // Don't do anything if at the top or scrolling less than a threshold
      if (currentScrollY <= 0) {
        // Always show tab bar when at the top
        translateY.value = withTiming(0);
      } else if (diff > 10) { // Scrolling down
        // Hide tab bar
        translateY.value = withTiming(TAB_BAR_HEIGHT);
      } else if (diff < -10) { // Scrolling up
        // Show tab bar
        translateY.value = withTiming(0);
      }
      
      prevScrollY.value = currentScrollY;
    },
  });

  const tabBarAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: translateY.value,
        },
      ],
    };
  });

  return (
    <ScrollContext.Provider value={{ onScroll, tabBarAnimatedStyle, scrollRef }}>
      {children}
    </ScrollContext.Provider>
  );
};

// Custom hook to use the context
export const useScroll = () => {
  const context = useContext(ScrollContext);
  if (context === undefined) {
    throw new Error('useScroll must be used within a ScrollContextProvider');
  }
  return context;
};