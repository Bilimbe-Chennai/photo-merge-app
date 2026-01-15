import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function AccessTypeSelectionScreen({ navigation, route }) {
  const { user } = route.params || {};

  const handleSelectAccessType = (accessType) => {
    navigation.navigate('Camera', {
      user: user,
      selectedAccessType: accessType,
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4a0012', '#9a1b2d', '#c22f42']}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose Your Mode</Text>
            <Text style={styles.subtitle}>Select the type of content you want to create</Text>
          </View>

          <View style={styles.optionsContainer}>
            {/* Photo Merge Option */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handleSelectAccessType('photomerge')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#fff', '#f8f8f8']}
                style={styles.cardGradient}
              >
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="camera" size={60} color="#7f0020" />
                </View>
                <Text style={styles.optionTitle}>Photo Merge</Text>
                <Text style={styles.optionDescription}>
                  Take photos and merge them with templates
                </Text>
                <View style={styles.arrowContainer}>
                  <Icon name="arrow-forward" size={24} color="#7f0020" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Video Merge Option */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handleSelectAccessType('videomerge')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#fff', '#f8f8f8']}
                style={styles.cardGradient}
              >
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="video" size={60} color="#7f0020" />
                </View>
                <Text style={styles.optionTitle}>Video Merge</Text>
                <Text style={styles.optionDescription}>
                  Record videos with filters and effects
                </Text>
                <View style={styles.arrowContainer}>
                  <Icon name="arrow-forward" size={24} color="#7f0020" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4a0012',
  },
  gradientBackground: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 0,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  optionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardGradient: {
    padding: 30,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 0,
  },
  optionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7f0020',
    marginBottom: 10,
  },
  optionDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  arrowContainer: {
    marginTop: 10,
  },
});
