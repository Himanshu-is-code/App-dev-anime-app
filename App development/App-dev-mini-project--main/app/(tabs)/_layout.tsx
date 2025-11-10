// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';
import CustomTabBar from '@/components/CustomTabBar'; // keep your custom tab bar
import { useScroll } from '@/components/ScrollContext';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

function AnimatedTabs() {
  const { tabBarAnimatedStyle } = useScroll();
  const colorScheme = useColorScheme();
  const activeTintColor = colorScheme === 'dark' ? '#38e07b' : '#0f766e';
  const inactiveTintColor = colorScheme === 'dark' ? '#94a3b8' : '#6b7280';

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} animatedStyle={tabBarAnimatedStyle} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeTintColor,
        tabBarInactiveTintColor: inactiveTintColor,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size ?? 22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size ?? 22} color={color} />,
        }}
      />

      {/* New Profile tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size ?? 22} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return <AnimatedTabs />;
}
