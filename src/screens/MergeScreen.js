import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Image, ScrollView, RefreshControl } from 'react-native';

const MergeScreen = () => {
  const [photos, setPhotos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const pickImage = () => {
    // Will implement image picker later
  };

  const mergePhotos = () => {
    // Will implement photo merging later
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPhotos([]);
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4CAF50']}
          tintColor="#4CAF50"
        />
      }
    >
      <Text style={styles.title}>Photo Merger</Text>

      <View style={styles.imageGrid}>
        {photos.length === 0 ? (
          <Text style={styles.emptyText}>No photos selected</Text>
        ) : (
          photos.map((photo, index) => (
            <Image key={index} source={{ uri: photo }} style={styles.thumbnail} />
          ))
        )}
      </View>

      <View style={styles.buttonRow}>
        <Button title="Add Photo" onPress={pickImage} />
        <Button title="Merge Photos" onPress={mergePhotos} color="green" />
        <Button title="Clear All" onPress={() => setPhotos([])} color="red" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    minHeight: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
  },
  thumbnail: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 80,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
});

export default MergeScreen;