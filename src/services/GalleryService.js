import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { requestGalleryPermission } from '../permissions/galleryPermission';

export const saveToGallery = async (filePath, fileType = 'photo') => {
  const granted = await requestGalleryPermission();
  if (!granted) throw new Error('Gallery permission denied');

  // Save with original dimensions preserved (portrait/landscape aspect ratio maintained)
  // CameraRoll.save preserves the original video dimensions without resizing
  await CameraRoll.save(filePath, { 
    type: fileType,
  });
  
};
