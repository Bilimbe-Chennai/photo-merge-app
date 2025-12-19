import React from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function PreviewScreen({ route, navigation }) {
  const { mergedImage } = route.params;

  return (
    <View style={styles.container}>
      <Image source={{ uri: mergedImage }} style={styles.preview} />

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancel}
          onPress={() => navigation.goBack()}
        />
        <TouchableOpacity
          style={styles.done}
          onPress={() => navigation.popToTop()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  preview: { flex: 1, resizeMode: "contain" },
  actions: {
    height: 90,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  cancel: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e53935",
  },
  done: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#43a047",
  },
});
