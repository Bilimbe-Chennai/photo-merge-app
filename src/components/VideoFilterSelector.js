import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const VIDEO_FILTERS = [
  { id: 'none', name: 'None', color: '#FFFFFF' },
  { id: 'sepia', name: 'Sepia', color: '#C9A961' },
  { id: 'blackwhite', name: 'B&W', color: '#000000' },
  { id: 'vintage', name: 'Vintage', color: '#D4A574' },
  { id: 'cool', name: 'Cool', color: '#87CEEB' },
  { id: 'warm', name: 'Warm', color: '#FFA500' },
];

export default function VideoFilterSelector({ selectedFilter, onSelectFilter }) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {VIDEO_FILTERS.map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterItem,
              selectedFilter === filter.id && styles.filterItemActive,
            ]}
            onPress={() => onSelectFilter(filter.id)}
          >
            <View
              style={[
                styles.filterCircle,
                { backgroundColor: filter.color },
                selectedFilter === filter.id && styles.filterCircleActive,
              ]}
            />
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.id && styles.filterTextActive,
              ]}
            >
              {filter.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  filterItem: {
    alignItems: 'center',
    marginHorizontal: 10,
    paddingVertical: 5,
  },
  filterItemActive: {
    opacity: 1,
  },
  filterCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 5,
  },
  filterCircleActive: {
    borderWidth: 3,
    borderColor: '#fff',
    transform: [{ scale: 1.1 }],
  },
  filterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  filterTextActive: {
    fontWeight: 'bold',
    color: '#fff',
  },
});
