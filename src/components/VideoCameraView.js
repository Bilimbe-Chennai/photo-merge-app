import React, { forwardRef, useState, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import {
  Camera,
  useCameraDevice,
} from 'react-native-vision-camera';

const VideoCameraView = forwardRef(
  ({ onReady, cameraPosition = 'front', filter = 'none', slowMotion = false }, ref) => {
    const [hasPermission, setHasPermission] = useState(false);
    const device = useCameraDevice(cameraPosition);
    const formatRef = React.useRef(null);
    const cameraRef = React.useRef(null); // actual VisionCamera ref

    useEffect(() => {
      (async () => {
        const status = await Camera.requestCameraPermission();
        setHasPermission(status === 'granted');
      })();
    }, []);

    // Select best video format
    // Always prioritize high FPS formats when available to enable slow motion capability
    // Don't force orientation - let outputOrientation="device" handle orientation automatically
    // Videos will be saved in the orientation they were recorded (portrait or landscape)
    const format = React.useMemo(() => {
      if (!device) return null;

      // Helper to calculate aspect ratio
      const getAspectRatio = (f) => f.videoWidth / f.videoHeight;
      
      // Helper to check if format is portrait (height > width)
      const isPortrait = (f) => f.videoHeight > f.videoWidth;
      
      // Helper to check if format has common video aspect ratios (16:9 landscape or 9:16 portrait)
      const isCommonVideoRatio = (f) => {
        const ratio = getAspectRatio(f);
        // 16:9 = 1.78, 9:16 = 0.56, allow some tolerance
        return Math.abs(ratio - 1.78) < 0.1 || Math.abs(ratio - 0.56) < 0.1;
      };

      // Log all available formats for debugging
      const allPortraitFormats = device.formats.filter(isPortrait);
      const allLandscapeFormats = device.formats.filter(f => !isPortrait(f));
      console.log(`[VideoCamera] Available formats: ${device.formats.length} total, ${allPortraitFormats.length} portrait, ${allLandscapeFormats.length} landscape`);
      if (allPortraitFormats.length > 0) {
        console.log(`[VideoCamera] Portrait formats sample:`, allPortraitFormats.slice(0, 3).map(f => `${f.videoWidth}x${f.videoHeight} @ ${f.maxFps}fps`));
      }

      // First, try to find high FPS formats (120fps+) for slow motion capability
      const highFpsFormats = device.formats.filter(f => f.maxFps >= 120);
      if (highFpsFormats.length > 0) {
        // Prefer formats with common video aspect ratios (16:9 or 9:16) for better compatibility
        // Don't force orientation - let outputOrientation="device" handle orientation automatically
        const commonRatioFormats = highFpsFormats.filter(isCommonVideoRatio);
        const formatsToUse = commonRatioFormats.length > 0 ? commonRatioFormats : highFpsFormats;
        
        const selectedFormat = formatsToUse.sort((a, b) => {
          // Prefer highest frame rate
          if (a.maxFps !== b.maxFps) {
            return b.maxFps - a.maxFps;
          }
          // Then prefer higher resolution
          const aRes = a.videoWidth * a.videoHeight;
          const bRes = b.videoWidth * b.videoHeight;
          return bRes - aRes;
        })[0];
        formatRef.current = selectedFormat;
        const aspectRatio = getAspectRatio(selectedFormat).toFixed(2);
        const orientation = isPortrait(selectedFormat) ? 'Portrait' : 'Landscape';
        console.log(`[VideoCamera] Selected high FPS format: ${selectedFormat.videoWidth}x${selectedFormat.videoHeight} @ ${selectedFormat.maxFps}fps (${orientation}, ${aspectRatio}:1) - slow motion enabled`);
        console.log(`[VideoCamera] Note: outputOrientation="device" will record in actual device orientation`);
        return selectedFormat;
      }

      // Fallback: use the highest available FPS format with common video ratios
      const commonRatioFormats = device.formats.filter(isCommonVideoRatio);
      const formatsToUse = commonRatioFormats.length > 0 ? commonRatioFormats : device.formats;
      
      const highestFpsFormat = formatsToUse.sort((a, b) => {
        // Prioritize highest frame rate
        if (a.maxFps !== b.maxFps) {
          return b.maxFps - a.maxFps;
        }
        // Then prefer higher resolution
        const aRes = a.videoWidth * a.videoHeight;
        const bRes = b.videoWidth * b.videoHeight;
        return bRes - aRes;
      })[0];
      formatRef.current = highestFpsFormat;
      const aspectRatio = getAspectRatio(highestFpsFormat).toFixed(2);
      const orientation = isPortrait(highestFpsFormat) ? 'Portrait' : 'Landscape';
      console.log(`[VideoCamera] Selected format: ${highestFpsFormat.videoWidth}x${highestFpsFormat.videoHeight} @ ${highestFpsFormat.maxFps}fps (${orientation}, ${aspectRatio}:1)`);
      console.log(`[VideoCamera] Note: outputOrientation="device" will record in actual device orientation`);
      return highestFpsFormat;
    }, [device]);

    // Expose camera methods + format info via ref
    React.useImperativeHandle(ref, () => ({
      startRecording: (...args) => cameraRef.current?.startRecording?.(...args),
      stopRecording: () => cameraRef.current?.stopRecording?.(),
      getFormat: () => formatRef.current,
      getFps: () => formatRef.current?.maxFps || 30,
    }));

    // Apply filter effect (using colorMatrix or similar)
    // For now, we'll use the filter prop to apply visual effects
    const filterStyle = React.useMemo(() => {
      const filters = {
        none: {},
        sepia: { tint: '#C9A961', opacity: 0.5 },
        blackwhite: { tint: '#000000', opacity: 0.3 },
        vintage: { tint: '#D4A574', opacity: 0.4 },
        cool: { tint: '#87CEEB', opacity: 0.3 },
        warm: { tint: '#FFA500', opacity: 0.3 },
      };
      return filters[filter] || filters.none;
    }, [filter]);

    if (!hasPermission)
      return (
        <View style={StyleSheet.absoluteFill}>
          <Text style={{ color: 'white', textAlign: 'center', marginTop: 50 }}>
            No Camera Permission
          </Text>
        </View>
      );
    if (!device)
      return (
        <View style={StyleSheet.absoluteFill}>
          <Text style={{ color: 'white', textAlign: 'center', marginTop: 50 }}>
            No Camera Device
          </Text>
        </View>
      );

    // Apply horizontal flip (mirror) for front camera to match user's expectation
    // Front camera typically shows mirrored view, so we flip it to show non-mirrored
    const shouldMirror = cameraPosition === 'front';
    
    return (
      <View style={StyleSheet.absoluteFill}>
        <Camera
          ref={cameraRef}
          style={[
            StyleSheet.absoluteFill,
            shouldMirror && {
              transform: [{ scaleX: -1 }],
            },
          ]}
          device={device}
          format={format}
          isActive={true}
          video={true}
          resizeMode="cover"
          videoHdr={format?.supportsVideoHdr}
          enableZoomGesture={true}
          outputOrientation="device"
          onInitialized={onReady}
        />
        {/* Filter overlay - using a colored overlay for visual effect */}
        {filter !== 'none' && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: filterStyle.tint,
                opacity: filterStyle.opacity,
                pointerEvents: 'none',
              },
            ]}
          />
        )}
      </View>
    );
  },
);

export default VideoCameraView;
