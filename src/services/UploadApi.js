import { Platform } from 'react-native';
import RNFetchBlob from 'react-native-blob-util';
import RNFS from 'react-native-fs';
import useAxios from './useAxios';

const API_URL =
  'https://api.bilimbebrandactivations.com/api/client/client/test';

/**
 * Normalize file path for different platforms and formats
 */
const normalizeFilePath = (uri) => {
  if (!uri) return null;

  let normalizedPath = uri;

  // Remove file:// prefix if present
  if (normalizedPath.startsWith('file://')) {
    normalizedPath = normalizedPath.replace('file://', '');
  }

  // For Android, ensure path starts with /
  if (Platform.OS === 'android' && !normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }

  console.log('[Upload] Normalized path:', { original: uri, normalized: normalizedPath });
  return normalizedPath;
};

/**
 * Validate photo file exists and is accessible
 */
const validatePhotoFile = async (uri) => {
  try {
    const normalizedPath = normalizeFilePath(uri);

    if (!normalizedPath) {
      throw new Error('Invalid file path: path is null or empty');
    }

    // Check if file exists
    const exists = await RNFS.exists(normalizedPath);
    if (!exists) {
      throw new Error(`File does not exist at path: ${normalizedPath}`);
    }

    // Get file info
    const fileInfo = await RNFS.stat(normalizedPath);
    console.log('[Upload] File validation:', {
      path: normalizedPath,
      size: fileInfo.size,
      isFile: fileInfo.isFile(),
    });

    // Check if file is empty
    if (fileInfo.size === 0) {
      throw new Error('File is empty (0 bytes)');
    }

    // Check if file is too large (e.g., > 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (fileInfo.size > maxSize) {
      throw new Error(`File is too large: ${(fileInfo.size / 1024 / 1024).toFixed(2)}MB (max 50MB)`);
    }

    return { normalizedPath, fileInfo };
  } catch (error) {
    console.error('[Upload] File validation failed:', error);
    throw error;
  }
};

/**
 * Check if error is retryable (network issues, timeouts, etc.)
 */
const isRetryableError = (error) => {
  const retryableMessages = [
    'network',
    'timeout',
    'connection',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
  ];

  const errorMessage = error.message?.toLowerCase() || '';
  return retryableMessages.some(msg => errorMessage.includes(msg));
};

/**
 * Upload photo to API with robust error handling
 */
export const uploadToApi = async (photo, metadata = {}, retryCount = 0) => {
  const MAX_RETRIES = 2;

  try {
    console.log('[Upload] Starting upload attempt', {
      attempt: retryCount + 1,
      platform: Platform.OS,
      photoUri: photo?.uri,
      metadata,
    });

    if (!photo?.uri) {
      throw new Error('No photo to upload: photo.uri is missing');
    }

    // Validate file exists and get normalized path
    const { normalizedPath, fileInfo } = await validatePhotoFile(photo.uri);

    // Prepare upload data
    const uploadData = [
      {
        name: 'photo',
        filename: photo.name || `photo_${Date.now()}.png`,
        type: photo.type || 'image/png',
        data: RNFetchBlob.wrap(normalizedPath),
      },
      { name: 'clientName', data: String(metadata.clientName || '') },
      { name: 'whatsapp', data: String(metadata.whatsapp || '') },
      { name: 'email', data: String(metadata.email || '') },
      { name: 'template_name', data: String(metadata.template_name || '') },
      { name: 'source', data: String(metadata.source || 'Photo Merge App') },
      { name: 'adminid', data: String(metadata.adminid || '') },
      { name: 'branchid', data: String(metadata.branchid || '') },
    ];

    console.log('[Upload] Uploading file:', {
      path: normalizedPath,
      size: `${(fileInfo.size / 1024).toFixed(2)}KB`,
      filename: photo.name,
      type: photo.type,
    });

    // Perform upload with increased timeout
    const response = await RNFetchBlob.config({
      timeout: 120000, // 120 seconds timeout
    }).fetch(
      'POST',
      API_URL,
      {
        Accept: 'application/json',
        // Content-Type is automatically set by RNFetchBlob
      },
      uploadData,
    );

    const responseText = await response.text();
    console.log('[Upload] Response received:', {
      status: response.info().status,
      responseLength: responseText.length,
    });

    // Parse response
    try {
      const respJson = JSON.parse(responseText);
      console.log('[Upload] Upload successful:', respJson);
      return respJson;
    } catch (parseError) {
      console.error('[Upload] Failed to parse response:', parseError);
      throw new Error(
        `Server returned invalid JSON. Status: ${response.info().status}, Response: ${responseText.substring(0, 100)}`,
      );
    }
  } catch (error) {
    console.error('[Upload] Upload failed:', {
      attempt: retryCount + 1,
      error: error.message,
      stack: error.stack,
    });

    // Retry logic for network errors
    if (retryCount < MAX_RETRIES && isRetryableError(error)) {
      console.log(`[Upload] Retrying upload (attempt ${retryCount + 2}/${MAX_RETRIES + 1})...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      return uploadToApi(photo, metadata, retryCount + 1);
    }

    // Enhance error message with more context
    const enhancedError = new Error(
      `Upload failed: ${error.message}\nPlatform: ${Platform.OS}\nAttempt: ${retryCount + 1}/${MAX_RETRIES + 1}`,
    );
    enhancedError.originalError = error;
    throw enhancedError;
  }
};

export const shareApi = async (type, link, whatsappNumber, id, name, email) => {
  const axiosData = useAxios();
  try {
    if (!link) throw new Error('No url to share');
    if (type === 'email') {
      const responseemail = axiosData.post(
        `client/client/share/${email}`,
        { viewUrl: link, typeSend: type, name: name, id: id },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );
    } else {
      const responsewhatsapp = axiosData.post(
        `client/client/share/${whatsappNumber}`,
        { typeSend: type, viewUrl: link, name: name, id: id },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
    // console.log('Share API Status:', response);
  } catch (err) {
    console.error('Share error:', err);
    throw err;
  }
};

export const getPhotoById = async id => {
  try {
    const response = await fetch(
      `https://api.bilimbebrandactivations.com/api/client/client/get-photo/${id}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
    );
    const respJson = await response.json();
    return respJson;
  } catch (err) {
    console.error('Fetch photo error:', err);
    throw err;
  }
};
