import { NativeModules, Image } from 'react-native';

const { ImageMerge } = NativeModules;

export const mergeCameraWithTemplate = async (photoPath, template, overlayNormalized = null, previewPath = null) => {
  // Support either a numeric require() result (Android asset id) or a filename id like 'template3.png'
  let assetName = '';

  if (typeof template === 'number') {
    // require('../assets/foo.png') returns a number on Android — use that numeric id as the asset filename
    assetName = `${template}.png`;
  } else {
    const s = String(template || '');

    if (s.startsWith('asset_')) {
      // old RN string form like 'asset_8'
      const digits = s.replace('asset_', '').replace(/\D/g, '');
      assetName = `${digits}.png`;
    } else if (s.startsWith('asset:/')) {
      // uri form like 'asset:/3' or 'asset:/3.png'
      const match = s.match(/\/([^\/]+)$/);
      assetName = match ? match[1] : s;
    } else {
      // already a filename (e.g. 'template3.png') — keep as-is
      assetName = s;
    }
  }

  // Pass normalized overlay rect and optional preview path (use null if absent) to native; native will map overlay to photo pixels
  try {
    return await ImageMerge.merge(photoPath, assetName, overlayNormalized ?? null, previewPath ?? null);
  } catch (err) {
    // Log and rethrow so callers can handle the error (no legacy fallbacks — native expects 4 args)
    console.error('ImageMerge.merge failed:', err && err.message ? err.message : err);
    throw err;
  }
};
