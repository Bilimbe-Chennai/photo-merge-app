import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import Video from 'react-native-video';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function VideoPlayer({ uri, style, onClose, isSlowMotion = false, slowMotionSegments = [] }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentPlaybackRate, setCurrentPlaybackRate] = useState(1.0);
  const videoRef = useRef(null);
  const currentRateRef = useRef(1.0); // Track current rate to avoid unnecessary updates
  const lastLogTimeRef = useRef(-1); // Track last log time to reduce logging frequency
  const seekTimeRef = useRef(0); // Track time for seek operations
  const isUpdatingRateRef = useRef(false); // Prevent multiple simultaneous rate updates
  
  // Check if we have slow motion segments
  const hasSlowMotionSegments = slowMotionSegments && Array.isArray(slowMotionSegments) && slowMotionSegments.length > 0;
  
  // Function to check if current time is within a slow motion segment
  const isInSlowMotionSegment = (time) => {
    // If we have segments, use segment-based checking (priority)
    if (hasSlowMotionSegments) {
      // Check each segment
      for (const segment of slowMotionSegments) {
        const start = segment.start || 0;
        let end = segment.end;
        
        // Handle open-ended segments (end is null or undefined)
        if (end === null || end === undefined) {
          end = Infinity;
        }
        
        // Check if time is within this segment
        if (time >= start && time <= end) {
          // Only log when entering or exiting a segment (reduce spam)
          const isNearBoundary = Math.abs(time - start) < 0.15 || (end !== Infinity && Math.abs(time - end) < 0.15);
          if (isNearBoundary && Math.abs(time - lastLogTimeRef.current) > 0.5) {
            console.log(`[VideoPlayer] ${time >= start && time < start + 0.2 ? 'ENTERING' : 'IN'} slow motion segment [${start.toFixed(2)}s - ${end === Infinity ? 'end' : end.toFixed(2) + 's'}] at ${time.toFixed(2)}s`);
            lastLogTimeRef.current = time;
          }
          return true;
        }
      }
      // Time is not in any segment, return false (normal speed)
      return false;
    }
    
    // If no segments but isSlowMotion flag is true, entire video is slow motion
    if (isSlowMotion) {
      return true;
    }
    
    // Default: normal speed
    return false;
  };

  // Update playback rate based on current time
  const updatePlaybackRate = (time) => {
    if (isUpdatingRateRef.current) return; // Prevent concurrent updates
    
    const shouldBeSlow = isInSlowMotionSegment(time);
    const newRate = shouldBeSlow ? 0.25 : 1.0;
    
    // Always update the rate state, even if not playing
    if (newRate !== currentRateRef.current) {
      const previousRate = currentRateRef.current;
      currentRateRef.current = newRate;
      setCurrentPlaybackRate(newRate);
      
      // Try to apply rate change if video is playing
      if (videoRef.current && isPlaying) {
        isUpdatingRateRef.current = true;
        seekTimeRef.current = time; // Save current time for seek
        
        try {
          // Method 1: Try setRate directly (most reliable if supported)
          if (videoRef.current.setRate && typeof videoRef.current.setRate === 'function') {
            videoRef.current.setRate(newRate);
            if (Math.abs(time - lastLogTimeRef.current) > 1.0) {
              console.log(`[VideoPlayer] ✓ Rate: ${previousRate} → ${newRate} at ${time.toFixed(2)}s (${shouldBeSlow ? 'SLOW' : 'NORMAL'})`);
              lastLogTimeRef.current = time;
            }
            setTimeout(() => { isUpdatingRateRef.current = false; }, 100);
            return;
          }
          
          // Method 2: Use setNativeProps (works on some platforms)
          if (videoRef.current.setNativeProps && typeof videoRef.current.setNativeProps === 'function') {
            videoRef.current.setNativeProps({ 
              rate: newRate,
              speed: newRate,
              playbackRate: newRate
            });
            if (Math.abs(time - lastLogTimeRef.current) > 1.0) {
              console.log(`[VideoPlayer] ✓ Rate: ${previousRate} → ${newRate} via setNativeProps at ${time.toFixed(2)}s`);
              lastLogTimeRef.current = time;
            }
            setTimeout(() => { isUpdatingRateRef.current = false; }, 100);
            return;
          }
          
          // Method 3: Force update by seeking (last resort)
          if (videoRef.current.seek && typeof videoRef.current.seek === 'function') {
            // Seek slightly back then forward to trigger rate update
            videoRef.current.seek(Math.max(0, time - 0.05));
            setTimeout(() => {
              if (videoRef.current && videoRef.current.seek) {
                videoRef.current.seek(time);
              }
              isUpdatingRateRef.current = false;
            }, 100);
            if (Math.abs(time - lastLogTimeRef.current) > 1.0) {
              console.log(`[VideoPlayer] Using seek method: ${previousRate} → ${newRate} at ${time.toFixed(2)}s`);
              lastLogTimeRef.current = time;
            }
            return;
          }
          
          setTimeout(() => { isUpdatingRateRef.current = false; }, 100);
          if (Math.abs(time - lastLogTimeRef.current) > 1.0) {
            console.warn(`[VideoPlayer] ⚠ No method to update rate from ${previousRate} to ${newRate}`);
            lastLogTimeRef.current = time;
          }
        } catch (e) {
          console.error('[VideoPlayer] ✗ Error updating playback rate:', e);
          isUpdatingRateRef.current = false;
        }
      } else {
        // Not playing - rate will be applied when playback starts
        if (Math.abs(time - lastLogTimeRef.current) > 1.0) {
          console.log(`[VideoPlayer] Rate state updated: ${previousRate} → ${newRate} at ${time.toFixed(2)}s (will apply on play)`);
          lastLogTimeRef.current = time;
        }
      }
    }
  };

  // Force rate update when currentPlaybackRate changes
  useEffect(() => {
    if (videoRef.current && isPlaying && !isLoading) {
      const rate = isInSlowMotionSegment(currentTime) ? 0.25 : 1.0;
      if (rate !== currentRateRef.current) {
        updatePlaybackRate(currentTime);
      }
    }
  }, [currentPlaybackRate, isPlaying, isLoading, currentTime]);

  // Debug logging (only on mount)
  useEffect(() => {
    console.log('[VideoPlayer] Initialized:', {
      hasSlowMotionSegments,
      segmentsCount: slowMotionSegments?.length || 0,
      segments: slowMotionSegments,
      isSlowMotion,
      initialRate: isInSlowMotionSegment(0) ? 0.25 : 1.0,
    });
  }, []);

  const togglePlayPause = () => {
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    
    // Set initial playback rate when starting to play
    if (newPlayingState && videoRef.current) {
      setTimeout(() => {
        const initialRate = isInSlowMotionSegment(currentTime) ? 0.25 : 1.0;
        currentRateRef.current = initialRate;
        setCurrentPlaybackRate(initialRate);
        
        // Force rate update when starting playback
        try {
          if (videoRef.current?.setRate && typeof videoRef.current.setRate === 'function') {
            videoRef.current.setRate(initialRate);
            console.log('[VideoPlayer] Initial rate set to:', initialRate, 'via setRate');
          } else if (videoRef.current?.setNativeProps && typeof videoRef.current.setNativeProps === 'function') {
            videoRef.current.setNativeProps({ rate: initialRate, speed: initialRate, playbackRate: initialRate });
            console.log('[VideoPlayer] Initial rate set to:', initialRate, 'via setNativeProps');
          }
        } catch (e) {
          console.warn('[VideoPlayer] Could not set initial playback rate:', e);
        }
      }, 200);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    // Set initial playback rate based on start time
    const initialRate = isInSlowMotionSegment(0) ? 0.25 : 1.0;
    currentRateRef.current = initialRate;
    setCurrentPlaybackRate(initialRate);
  };

  const handleReadyForDisplay = () => {
    // Video is ready for display
    console.log('[VideoPlayer] Video ready for display');
  };

  // Handle progress updates to check if we need to change playback rate
  const handleProgress = (data) => {
    const time = data.currentTime;
    setCurrentTime(time);
    
    // Update playback rate based on current time
    // This ensures smooth transitions between normal and slow motion segments
    updatePlaybackRate(time);
  };

  const handleError = (error) => {
    console.error('Video error:', error);
    setIsLoading(false);
    setHasError(true);
  };

  // Handle file URI for react-native-video
  // Format URI correctly based on platform
  const getVideoSource = () => {
    if (!uri || typeof uri !== 'string') return null;
    
    // If already a web URL, use as is
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return { uri };
    }
    
    // For local files
    if (Platform.OS === 'android') {
      // Android: react-native-video works with file:// prefix
      const cleanUri = uri.startsWith('file://') ? uri : `file://${uri}`;
      return { uri: cleanUri };
    } else {
      // iOS: react-native-video needs file:// prefix
      const cleanUri = uri.startsWith('file://') ? uri : `file://${uri}`;
      return { uri: cleanUri };
    }
  };

  const videoSource = getVideoSource();

  if (!videoSource) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.overlay}>
          <MaterialCommunityIcons name="alert-circle" size={50} color="#ff3b30" />
        </View>
      </View>
    );
  }

  // Use key to force re-render when rate changes (not on every time update)
  // This ensures the rate prop is applied correctly
  const videoKey = `video-${currentPlaybackRate === 0.25 ? 'slow' : 'normal'}`;

  return (
    <View style={[styles.container, style]}>
      <Video
        key={videoKey}
        ref={videoRef}
        source={videoSource}
        style={styles.video}
        paused={!isPlaying}
        resizeMode="contain"
        onLoad={() => {
          handleLoad();
          // Seek to current position after load if we have a saved position
          if (seekTimeRef.current > 0 && videoRef.current && videoRef.current.seek) {
            setTimeout(() => {
              if (videoRef.current && videoRef.current.seek) {
                videoRef.current.seek(seekTimeRef.current);
                seekTimeRef.current = 0; // Reset
              }
            }, 100);
          }
        }}
        onReadyForDisplay={handleReadyForDisplay}
        onError={handleError}
        onProgress={handleProgress}
        progressUpdateInterval={50}
        controls={false}
        repeat={false}
        playInBackground={false}
        playWhenInactive={false}
        rate={currentPlaybackRate}
        speed={currentPlaybackRate}
        playbackRate={currentPlaybackRate}
        ignoreSilentSwitch="ignore"
        onPlaybackRateChange={(data) => {
          const actualRate = data.playbackRate || data.rate || currentPlaybackRate;
          // Only log significant mismatches (reduce spam)
          if (Math.abs(actualRate - currentPlaybackRate) > 0.1) {
            const expectedRate = isInSlowMotionSegment(currentTime) ? 0.25 : 1.0;
            if (Math.abs(actualRate - expectedRate) > 0.1) {
              console.warn(`[VideoPlayer] Rate mismatch at ${currentTime.toFixed(2)}s: Expected ${expectedRate}, Got ${actualRate}`);
              // Try to fix it
              setTimeout(() => updatePlaybackRate(currentTime), 100);
            }
          }
        }}
      />

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {/* Error message */}
      {hasError && (
        <View style={styles.overlay}>
          <MaterialCommunityIcons name="alert-circle" size={50} color="#ff3b30" />
        </View>
      )}

      {/* Slow motion indicator during playback */}
      {isPlaying && isInSlowMotionSegment(currentTime) && (
        <View style={styles.slowMotionPlaybackIndicator}>
          <MaterialCommunityIcons name="speedometer" size={20} color="#ff3b30" />
          <Text style={styles.slowMotionPlaybackText}>SLOW MOTION</Text>
        </View>
      )}

      {/* Play/Pause overlay */}
      {!isLoading && !hasError && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={togglePlayPause}
          activeOpacity={0.8}
        >
          <View style={styles.playButtonContainer}>
            {!isPlaying && (
              <MaterialCommunityIcons name="play-circle" size={100} color="#fff" />
            )}
            {isPlaying && (
              <MaterialCommunityIcons name="pause-circle" size={100} color="#fff" />
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* Close button */}
      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="close" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  slowMotionPlaybackIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 15,
  },
  slowMotionPlaybackText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});
