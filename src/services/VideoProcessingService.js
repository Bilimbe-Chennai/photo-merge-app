import RNFS from 'react-native-fs';
import { NativeModules } from 'react-native';

const { VideoProcessing } = NativeModules;

/**
 * Process video to apply slow motion to specific segments
 * 
 * NOTE: FFmpeg processing is not available due to dependency issues.
 * The video will be saved with metadata (slowMotionSegments) that can be
 * processed on the backend server using FFmpeg.
 * 
 * The preview player will still show slow motion correctly using dynamic
 * playback rate changes.
 * 
 * @param {string} inputVideoPath - Path to the input video file
 * @param {Array} slowMotionSegments - Array of {start, end} timestamps in seconds
 * @returns {Promise<string>} Path to the processed video file (returns original for now)
 */
export const processVideoWithSlowMotion = async (inputVideoPath, slowMotionSegments = []) => {
  try {
    // Remove file:// prefix if present
    const cleanInputPath = inputVideoPath.replace('file://', '');
    
    // Check if input file exists
    const inputExists = await RNFS.exists(cleanInputPath);
    if (!inputExists) {
      throw new Error(`Input video file not found: ${cleanInputPath}`);
    }
    
    // If no slow motion segments, return original video
    if (!slowMotionSegments || slowMotionSegments.length === 0) {
      console.log('[VideoProcessingService] No slow motion segments, returning original video');
      return inputVideoPath;
    }
    
    console.log('[VideoProcessingService] Processing video with slow motion segments:', slowMotionSegments);
    
    // Try native module first
    if (VideoProcessing && VideoProcessing.processVideoWithSlowMotion) {
      try {
        console.log('[VideoProcessingService] Using native video processing module...');
        const outputPath = `${RNFS.CachesDirectoryPath}/processed_video_${Date.now()}.mp4`;
        await VideoProcessing.processVideoWithSlowMotion(
          cleanInputPath,
          slowMotionSegments,
          outputPath
        );
        
        const outputExists = await RNFS.exists(outputPath);
        if (outputExists) {
          console.log('[VideoProcessingService] ✓ Native processing completed');
          return `file://${outputPath}`;
        }
      } catch (nativeError) {
        console.warn('[VideoProcessingService] Native processing failed, trying alternative:', nativeError);
      }
    }
    
    // Note: FFmpeg packages have dependency issues, using native module only
    
    // Final fallback: return original with warning
    console.warn('[VideoProcessingService] ⚠️ Video processing not available - returning original video');
    console.warn('[VideoProcessingService] Slow motion will work in preview but not in saved video');
    console.warn('[VideoProcessingService] Metadata (slowMotionSegments) is saved and can be processed on backend');
    return inputVideoPath;
    
  } catch (error) {
    console.error('[VideoProcessingService] Error:', error);
    // Return original video on error
    return inputVideoPath;
  }
};

/**
 * Check if video processing is available
 * @returns {Promise<boolean>}
 */
export const isVideoProcessingAvailable = async () => {
  // FFmpeg processing is not available
  return false;
};
