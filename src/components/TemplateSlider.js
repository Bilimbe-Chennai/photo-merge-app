import React from 'react';
import { FlatList, Image, TouchableOpacity } from 'react-native';

export default function TemplateSlider({ templates, onSelect }) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={templates}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => onSelect(item)} style={{ margin: 8 }}>
          <Image
            source={item.src}
            style={{ width: 70, height: 90 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
    />
  );
}
