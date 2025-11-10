import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface AnimeCardProps {
  item: {
    imageUrl: string;
    title: string;
    episode?: string;
    genre?: string;
  };
  themeColors: {
    text: string;
    textSecondary: string;
  };
}

const AnimeCard: React.FC<AnimeCardProps> = ({ item, themeColors }) => {
  const styles = getStyles(themeColors);

  return (
    <View style={styles.cardContainer}>
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.cardSubtitle}>
        {item.episode ? item.episode : item.genre}
      </Text>
    </View>
  );
};

const getStyles = (themeColors: AnimeCardProps['themeColors']) => StyleSheet.create({
  cardContainer: {
    flex: 1,
  },
  cardImage: {
    width: '100%',
    height: 208,
    borderRadius: 8,
    marginBottom: 8,
  },
  cardTitle: {
    color: themeColors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  cardSubtitle: {
    color: themeColors.textSecondary,
    fontSize: 14,
  },
});

export default AnimeCard;