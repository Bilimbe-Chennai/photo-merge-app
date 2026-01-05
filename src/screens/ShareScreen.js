import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  RefreshControl,
} from 'react-native';
import CommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getPhotoById } from '../services/UploadApi';
import { BackHandler } from 'react-native';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ShareScreen = ({ navigation, route }) => {
  const { photoId } = route.params || {};
  const [mergedImage, setMergedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  // Animation values
  const sheetTranslateY = useRef(new Animated.Value(screenHeight / 2)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!photoId) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [photoId]);
  useEffect(() => {
    const backAction = () => true; // block back navigation
    const handler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );
    return () => handler.remove();
  }, []);
  useEffect(() => {
    if (photoId) {
      animateIn();
    }
  }, [photoId]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fetchPhoto = async id => {
    try {
      setLoading(true);
      const data = await getPhotoById(id);
      if (data && data.url) {
        setMergedImage(data.url);
      } else {
        Alert.alert('Error', 'Photo not found');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch photo');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (photoId) {
      await fetchPhoto(photoId);
    }
    setRefreshing(false);
  };

  const handleDownload = () => {
    // Reset to form page (Login)
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const shareOptions = [
    { name: 'Facebook', icon: 'facebook', color: '#1877F2' },
    { name: 'X', icon: 'twitter', color: '#000' },
    { name: 'WhatsApp', icon: 'whatsapp', color: '#25D366' },
    // { name: 'Mail', icon: 'email-outline', color: '#4285F4' },
    { name: 'Instagram', icon: 'instagram', color: '#E4405F' },
  ];

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#CD1C1C" />
        </View>
      ) : (
        <Image
          source={{
            uri: `https://api.bilimbebrandactivations.com/api/upload/file/${photoId}`,
          }}
          style={styles.backgroundImage}
          resizeMode="contain"
        />
      )}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY: sheetTranslateY }],
            opacity: sheetOpacity,
          },
        ]}
      >
        <View style={styles.dragHandle} />
        <View style={styles.sheetContent}>
          <Text style={styles.shareTitle}>Share to</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.socialRow}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#CD1C1C']}
                tintColor="#CD1C1C"
              />
            }
          >
            {shareOptions.map((option, index) => (
              <TouchableOpacity key={index} style={styles.socialItem}>
                <View style={styles.socialIconBg}>
                  <CommunityIcon
                    name={option.icon}
                    size={30}
                    color={option.color}
                  />
                </View>
                <Text style={styles.socialName}>{option.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
            <Text style={styles.downloadBtnText}>Download</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: screenWidth,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 15,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 25,
  },
  sheetContent: {
    width: '100%',
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 20,
    marginLeft: 5,
  },
  socialRow: {
    flexDirection: 'row',
    paddingBottom: 20,
    justifyContent: 'space-between',
    width: '100%',
  },
  socialItem: {
    alignItems: 'center',
    marginRight: 20,
    minWidth: 60,
  },
  socialIconBg: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  socialName: {
    fontSize: 11,
    color: '#666',
  },
  downloadBtn: {
    width: '100%',
    height: 56,
    backgroundColor: '#CD1C1C',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  downloadBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ShareScreen;
