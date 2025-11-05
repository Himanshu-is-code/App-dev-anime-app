// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import CustomTabBar from '@/components/CustomTabBar'; // Adjust path
import { useScroll } from '@/components/ScrollContext'; // Import context

// A new component to get the animated style from the context
function AnimatedTabs() {
  const { tabBarAnimatedStyle } = useScroll(); // Get style from context

  return (
    <Tabs
      tabBar={(props) => (
        // Pass the animated style to the custom tab bar
        <CustomTabBar {...props} animatedStyle={tabBarAnimatedStyle} />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
        }}
      />
    </Tabs>
  );
}

// Default export wraps everything in the Provider
export default function TabLayout() { 
  return <AnimatedTabs />;
}