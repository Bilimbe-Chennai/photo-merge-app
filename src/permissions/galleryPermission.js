import { PermissionsAndroid, Platform } from 'react-native';

export const requestGalleryPermission = async () => {
  if (Platform.OS !== 'android') return true;

  if (Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
};
