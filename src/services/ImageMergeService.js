import { NativeModules } from 'react-native';
import RNFS from 'react-native-fs';

const { ImageMerge } = NativeModules;

export const mergeCameraWithTemplate = async (photoPath, templateOrId, overlayNormalized = null, previewPath = null) => {
  let assetName = '';

  // If it's a template object from the API with a remote URI
  if (templateOrId && typeof templateOrId === 'object' && templateOrId.src && templateOrId.src.uri && templateOrId.src.uri.startsWith('http')) {
    const templateUri = templateOrId.src.uri;
    // Extract file ID or name for the local path
    const photoId = templateOrId.photos && templateOrId.photos.length > 0 ? templateOrId.photos[0] : templateOrId.id;
    const localPath = `${RNFS.CachesDirectoryPath}/template_${photoId}.png`;

    // Download if not already cached
    const exists = await RNFS.exists(localPath);
    if (!exists) {
      console.log('[ImageMergeService] Downloading template:', templateUri);
      await RNFS.downloadFile({
        fromUrl: templateUri,
        toFile: localPath,
      }).promise;
    }
    assetName = localPath;
  } else if (typeof templateOrId === 'number') {
    // require('../assets/foo.png') returns a number on Android
    assetName = `${templateOrId}.png`;
  } else {
    // It's a string ID or local template ID
    const s = String(templateOrId || '');
    if (s.startsWith('asset_')) {
      const digits = s.replace('asset_', '').replace(/\D/g, '');
      assetName = `${digits}.png`;
    } else if (s.startsWith('asset:/')) {
      const match = s.match(/\/([^\/]+)$/);
      assetName = match ? match[1] : s;
    } else {
      assetName = s;
    }
  }

  // Pass normalized overlay rect and optional preview path to native
  try {
    console.log('[ImageMergeService] Calling native merge with assetName:', assetName);
    return await ImageMerge.merge(photoPath, assetName, overlayNormalized ?? null, previewPath ?? null);
  } catch (err) {
    console.error('[ImageMergeService] ImageMerge.merge failed:', err && err.message ? err.message : err);
    throw err;
  }
};
