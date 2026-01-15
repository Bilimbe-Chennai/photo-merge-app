import { Platform } from 'react-native';
import RNFetchBlob from 'react-native-blob-util';
import RNFS from 'react-native-fs';
import useAxios from './useAxios';

const API_BASE_URL = 'https://api.bilimbebrandactivations.com/api/client/client';

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

    // Check if file is empty
    if (fileInfo.size === 0) {
      throw new Error('File is empty (0 bytes)');
    }

    // Check if file is too large
    // Videos can be larger, so check file extension
    const isVideo = normalizedPath.match(/\.(mp4|mov|avi|mkv)$/i);
    const maxSize = isVideo ? 500 * 1024 * 1024 : 50 * 1024 * 1024; // 500MB for video, 50MB for photo
    const maxSizeLabel = isVideo ? '500MB' : '50MB';
    if (fileInfo.size > maxSize) {
      throw new Error(`File is too large: ${(fileInfo.size / 1024 / 1024).toFixed(2)}MB (max ${maxSizeLabel})`);
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
  // First check error object properties (most reliable)
  if (error.isRetryable === true) {
    return true;
  }
  
  // Check status code
  if (error.status === 504 || error.status === 503 || error.status === 502 || error.status === 500) {
    return true;
  }
  
  // Then check error message for retryable keywords
  const retryableMessages = [
    'network',
    'timeout',
    'connection',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    '504', // Gateway timeout
    '503', // Service unavailable
    '502', // Bad gateway
    '500', // Internal server error
    'gateway timeout',
    'service unavailable',
    'bad gateway',
    'internal server error',
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

    if (!photo?.uri) {
      throw new Error('No photo to upload: photo.uri is missing');
    }

    // Validate file exists and get normalized path
    const { normalizedPath, fileInfo } = await validatePhotoFile(photo.uri);

    // Determine if it's a video or photo based on file type
    const isVideo = photo.type?.includes('video') || photo.name?.match(/\.(mp4|mov|avi)$/i);
    // API expects "photo" field name for both photos and videos
    // The API will use this buffer as video2 for video merge templates
    const fieldName = 'photo'; // API always expects "photo" field name
    const defaultExtension = isVideo ? 'mp4' : 'png';
    const defaultMimeType = isVideo ? 'video/mp4' : 'image/png';
    
    // Prepare upload data
    const uploadData = [
      {
        name: fieldName,
        filename: photo.name || `${fieldName}_${Date.now()}.${defaultExtension}`,
        type: photo.type || defaultMimeType,
        data: RNFetchBlob.wrap(normalizedPath),
      },
      { name: 'clientName', data: String(metadata.clientName || '') },
      { name: 'whatsapp', data: String(metadata.whatsapp || '') },
      { name: 'email', data: String(metadata.email || '') },
      { name: 'template_name', data: String(metadata.template_name || '') },
      { name: 'source', data: String(metadata.source || 'photo merge app') },
      { name: 'adminid', data: String(metadata.adminid || '') },
      { name: 'branchid', data: String(metadata.branchid || '') },
      // { name: 'isSlowMotion', data: String(metadata.isSlowMotion || 'false') },
      // { name: 'videoSpeed', data: String(metadata.videoSpeed || 'normal') },
      // { name: 'slowMotionSegments', data: String(metadata.slowMotionSegments || '') },
    ];

    // Build API URL with template name in path (API route: /client/:temp_name)
    // Use template_name from metadata, or fallback to "test" if not provided
    const templateName = metadata.template_name || 'test';
    const API_URL = `${API_BASE_URL}/${templateName}`;
    
    console.log('[Upload] Uploading to:', API_URL, 'with field name:', fieldName);
    
    // Perform upload with increased timeout for video uploads
    // Videos can take longer to process, especially with slow motion
    const isVideoUpload = photo.type?.includes('video') || photo.name?.match(/\.(mp4|mov|avi)$/i);
    const uploadTimeout = isVideoUpload ? 300000 : 120000; // 5 minutes for videos, 2 minutes for photos
    
    console.log('[Upload] Starting upload with timeout:', uploadTimeout / 1000, 'seconds');
    
    const response = await RNFetchBlob.config({
      timeout: uploadTimeout,
    }).fetch(
      'POST',
      API_URL,
      {
        Accept: 'application/json',
        // Content-Type is automatically set by RNFetchBlob
      },
      uploadData,
    );

    const status = response.info().status;
    const responseText = await response.text();
    
    // Check for HTTP errors
    if (status >= 400) {
      let errorMessage = `Server error (${status})`;
      let isRetryable = false;
      
      // Check if status code is retryable
      if (status === 504 || status === 503 || status === 502 || status === 500) {
        isRetryable = true;
        if (status === 504) {
          errorMessage = `Gateway timeout (504). Server is taking too long to respond. This may be retried.`;
        } else if (status === 503) {
          errorMessage = `Service unavailable (503). Server is temporarily unavailable. This may be retried.`;
        } else if (status === 502) {
          errorMessage = `Bad gateway (502). Server error. This may be retried.`;
        } else {
          errorMessage = `Internal server error (500). This may be retried.`;
        }
      } else {
        // Try to parse error message from response
        try {
          const errorJson = JSON.parse(responseText);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch (e) {
          // If response is HTML (like 404 page), extract meaningful info
          if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
            if (status === 404) {
              errorMessage = `Endpoint not found (404). Check if template name "${templateName}" is correct.`;
            } else {
              errorMessage = `Server returned HTML error page (${status}). Check API endpoint.`;
            }
          } else {
            errorMessage = `${errorMessage}: ${responseText.substring(0, 200)}`;
          }
        }
      }
      
      console.error('[Upload] Server error:', {
        status,
        url: API_URL,
        templateName,
        message: errorMessage,
        isRetryable,
      });
      
      const error = new Error(errorMessage);
      error.status = status;
      error.isRetryable = isRetryable;
      throw error;
    }
    
    // Parse successful response
    try {
      const respJson = JSON.parse(responseText);
      return respJson;
    } catch (parseError) {
      console.error('[Upload] Failed to parse response:', parseError);
      throw new Error(
        `Server returned invalid JSON. Status: ${status}, Response: ${responseText.substring(0, 100)}`,
      );
    }
  } catch (error) {
    console.error('[Upload] Upload failed:', {
      attempt: retryCount + 1,
      error: error.message,
      status: error.status,
      isRetryable: error.isRetryable,
      stack: error.stack,
    });

    // Retry logic for network errors and retryable HTTP errors
    const isRetryableByMessage = isRetryableError(error);
    const isRetryableByProperty = error.isRetryable === true;
    const isRetryableByStatus = error.status === 504 || error.status === 503 || error.status === 502 || error.status === 500;
    
    const shouldRetry = retryCount < MAX_RETRIES && (
      isRetryableByMessage || 
      isRetryableByProperty ||
      isRetryableByStatus
    );
    
    console.log('[Upload] Retry decision:', {
      retryCount,
      MAX_RETRIES,
      shouldRetry,
      isRetryableByMessage,
      isRetryableByProperty,
      isRetryableByStatus,
      errorStatus: error.status,
    });
    
    if (shouldRetry) {
      // Exponential backoff: 2s, 4s, 8s
      const delay = Math.min(2000 * Math.pow(2, retryCount), 8000);
      console.log(`[Upload] Retrying upload (attempt ${retryCount + 2}/${MAX_RETRIES + 1}) after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
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
