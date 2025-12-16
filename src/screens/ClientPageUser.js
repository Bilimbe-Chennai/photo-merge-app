import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
const template1 = require("../images/template1.jpg");
const template2 = require("../images/template2.png");
const template3 = require("../images/template3.png");
const template4 = require("../images/template4.png");
const template5 = require("../images/template5.png");
const template6 = require("../images/template6.png");
import { PermissionsAndroid } from "react-native";


export default function ClientPageUser() {
 const templates = [
  {
    id: 1,
    name: "Professional Red",
    image: template1,
    photoArea: {
      top: "0%",
      left: "0%",
      width: "100%",
      height: "100%",
      borderRadius: "0%",
    },
    color: "#d32f2f",
  },
  {
    id: 2,
    name: "Modern VIP",
    image: template6,
    photoArea: {
      top: "0%",
      left: "0%",
      width: "100%",
      height: "100%",
      borderRadius: "0%",
    },
    color: "#1976d2",
  },
  {
    id: 3,
    name: "Elegant Style",
    image: template3,
    photoArea: {
      top: "0%",
      left: "0%",
      width: "100%",
      height: "100%",
      borderRadius: "0%",
    },
    color: "#388e3c",
  },
  {
    id: 4,
    name: "Premium Card",
    image: template4,
    photoArea: {
      top: "0%",
      left: "0%",
      width: "100%",
      height: "100%",
      borderRadius: "0%",
    },
    color: "#7b1fa2",
  },
  {
    id: 5,
    name: "Business Red",
    image: template5,
    photoArea: {
      top: "0%",
      left: "0%",
      width: "100%",
      height: "100%",
      borderRadius: "0%",
    },
    color: "#d32f2f",
  },
  {
    id: 6,
    name: "Minimalist",
    image: template2,
    photoArea: {
      top: "0%",
      left: "0%",
      width: "100%",
      height: "100%",
      borderRadius: "0%",
    },
    color: "#616161",
  },
  {
    id: 7,
    name: "Classic Blue",
    image: template1,
    photoArea: {
      top: "0%",
      left: "0%",
      width: "100%",
      height: "100%",
      borderRadius: "0%",
    },
    color: "#1565c0",
  },
  {
    id: 8,
    name: "Gold Premium",
    image: template2,
    photoArea: {
      top: "0%",
      left: "0%",
      width: "100%",
      height: "100%",
      borderRadius: "0%",
    },
    color: "#ff9800",
  },
  {
    id: 9,
    name: "Modern Black",
    image: template3,
    photoArea: {
      top: "0%",
      left: "0%",
      width: "100%",
      height: "100%",
      borderRadius: "0%",
    },
    color: "#212121",
  },
  {
    id: 10,
    name: "Vibrant Green",
    image: template4,
    photoArea: {
      top: "0%",
      left: "0%",
      width: "100%",
      height: "100%",
      borderRadius: "0%",
    },
    color: "#2e7d32",
  },
];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [photo, setPhoto] = useState(null);

  // PICK IMAGE FROM GALLERY
  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: "photo",
      quality: 1,
    });

    if (result.didCancel) return;

    if (result.assets && result.assets.length > 0) {
      const picked = result.assets[0];
      setPhoto(picked.uri);
    }
  };

  // OPEN CAMERA
  const takePhoto = async () => {
    await PermissionsAndroid.request(
  PermissionsAndroid.PERMISSIONS.CAMERA
);

    const result = await launchCamera({
      mediaType: "photo",
      quality: 1,
      saveToPhotos: true,
    });

    if (result.didCancel) return;

    if (result.assets && result.assets.length > 0) {
      const captured = result.assets[0];
      setPhoto(captured.uri);
    }
  };

  // SIMULATE MERGE
  const generateMergedImage = () => {
    if (!selectedTemplate) return Alert.alert("Select Template First");
    if (!photo) return Alert.alert("Upload or Capture Photo");

    Alert.alert("Success", "Merged Photo Generated (Demo Only)");
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Photo Merge Maker</Text>

      {/* USER DETAILS */}
      <View style={styles.card}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter email"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>WhatsApp Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Optional"
          keyboardType="phone-pad"
          value={whatsapp}
          onChangeText={setWhatsapp}
        />
      </View>

      {/* TEMPLATE SELECT */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Choose Template</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
       {templates.map(item => (
  <TouchableOpacity
    key={item.id}
    onPress={() => setSelectedTemplate(item)}
    style={{ marginRight: 10 }}
  >
    <Image
      source={item.image}
      style={{ width: 120, height: 150, borderRadius: 10 ,}}
    />
    {/* <Text>{item.name}</Text> */}
  </TouchableOpacity>
))}
        </ScrollView>
      </View>

      {/* PHOTO UPLOAD */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Upload Photo</Text>

        {photo ? (
          <Image source={{ uri: photo }} style={styles.previewImage} />
        ) : (
          <Text style={styles.placeholderText}>No photo selected</Text>
        )}

        <View style={styles.row}>
          <TouchableOpacity onPress={pickImage} style={styles.button}>
            <Text style={styles.buttonText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={takePhoto} style={styles.button}>
            <Text style={styles.buttonText}>Camera</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* GENERATE BUTTON */}
      <TouchableOpacity style={styles.generateBtn} onPress={generateMergedImage}>
        <Text style={styles.generateText}>Generate Image</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  title: { fontSize: 26, fontWeight: "800", color: "#b71c1c", marginBottom: 15,textAlign:"center" },

  card: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },

  label: { marginTop: 6, fontWeight: "600", color: "#444" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },

  sectionTitle: { fontWeight: "700", fontSize: 16, marginBottom: 10 },

  templateBox: {
    width: 140,
    height: 150,
    backgroundColor: "#eee",
    marginRight: 10,
    borderRadius: 10,
    overflow: "hidden",
  },

  selectedTemplate: {
    borderWidth: 2,
    borderColor: "#b71c1c",
  },

  templateImg: { width: "100%", height: 100 },
  templateText: {
    fontSize: 12,
    padding: 6,
    textAlign: "center",
    fontWeight: "600",
  },

  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 10,
    marginTop: 10,
  },

  placeholderText: {
    textAlign: "center",
    color: "#777",
    marginVertical: 10,
  },

  row: { flexDirection: "row", justifyContent: "space-between" },

  button: {
    backgroundColor: "#d32f2f",
    padding: 12,
    borderRadius: 10,
    width: "48%",
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    textAlign: "center",
  },

  generateBtn: {
    backgroundColor: "#b71c1c",
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  generateText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
});
