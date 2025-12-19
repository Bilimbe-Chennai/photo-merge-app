import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { requestGalleryPermission } from '../permissions/galleryPermission';

export const saveToGallery = async (filePath) => {
  const granted = await requestGalleryPermission();
  if (!granted) throw new Error('Gallery permission denied');

  await CameraRoll.save(filePath, { type: 'photo' });
};
