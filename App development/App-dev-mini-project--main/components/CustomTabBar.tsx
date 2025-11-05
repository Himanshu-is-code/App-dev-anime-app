import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme, ViewStyle } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { AnimatedStyle } from 'react-native-reanimated';

type CustomTabBarProps = BottomTabBarProps & {
  animatedStyle?: AnimatedStyle<ViewStyle>;
};
// Updated icons to better match the video
const getIconName = (routeName: string): keyof typeof FontAwesome.glyphMap => {
  if (routeName === 'index') return 'home';
  if (routeName === 'explore') return 'search'; // Changed from 'paper-plane'
  return 'circle';
};

export default function CustomTabBar({ state, descriptors, navigation, animatedStyle }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  const isDarkMode = colorScheme === 'dark';  
  // Updated colors to match the Google app style (green/grey)
  const activeColor = isDarkMode ? '#38e07b' : '#38e07b';
  const inactiveColor = isDarkMode ? '#9e9e9e' : '#5f6368';
  const backgroundColor = isDarkMode ? '#023020' : '#ffffff';
  const borderColor = isDarkMode ? '#3c4043' : '#e0e0e0';

  return (
    // We removed the outer View with 'position: absolute'
    // This Animated.View replaces the 'BlurView'
    <Animated.View style={[
      styles.tabBar,
      { 
        backgroundColor: backgroundColor,
        borderTopColor: borderColor,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 10 // Handle safe area
      },
      animatedStyle
    ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title !== undefined ? options.title : route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
          >
            <FontAwesome
              name={getIconName(route.name)}
              size={isFocused ? 25 : 24} // Slightly adjusted size
              color={isFocused ? activeColor : inactiveColor}
            />
            <Text style={{ color: isFocused ? activeColor : inactiveColor, fontSize: 11, marginTop: 4 }}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Removed the 'container' style that had 'position: absolute'
  // Renamed 'blurView' to 'tabBar'
  tabBar: {
    flexDirection: 'row',
    // Make it absolute to overlay content
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    paddingTop: 10, // Added padding to the top
    borderTopWidth: 0.5, // Added a top border for the divider line
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});