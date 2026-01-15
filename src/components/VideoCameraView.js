import React, { forwardRef, useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  Camera,
  useCameraDevice,
} from 'react-native-vision-camera';

const VideoCameraView = forwardRef(
  ({ onReady, cameraPosition = 'front', filter = 'none', slowMotion = false }, ref) => {
    const [hasPermission, setHasPermission] = useState(false);
    const device = useCameraDevice(cameraPosition);

    useEffect(() => {
      (async () => {
        const status = await Camera.requestCameraPermission();
        setHasPermission(status === 'granted');
      })();
    }, []);

    // Select best video format
    // Always prioritize high FPS formats when available to enable slow motion capability
    const format = React.useMemo(() => {
      if (!device) return null;

      // First, try to find high FPS formats (120fps+) for slow motion capability
      const highFpsFormats = device.formats.filter(f => f.maxFps >= 120);
      if (highFpsFormats.length > 0) {
        const selectedFormat = highFpsFormats.sort((a, b) => {
          // Prefer highest frame rate
          if (a.maxFps !== b.maxFps) {
            return b.maxFps - a.maxFps;
          }
          // Then prefer higher resolution
          return b.videoWidth - a.videoWidth;
        })[0];
        console.log(`[VideoCamera] Selected high FPS format: ${selectedFormat.videoWidth}x${selectedFormat.videoHeight} @ ${selectedFormat.maxFps}fps (slow motion enabled)`);
        return selectedFormat;
      }

      // Fallback: use the highest available FPS format
      const highestFpsFormat = device.formats.sort((a, b) => {
        // Prioritize highest frame rate
        if (a.maxFps !== b.maxFps) {
          return b.maxFps - a.maxFps;
        }
        // Then prefer higher resolution
        return b.videoWidth - a.videoWidth;
      })[0];
      console.log(`[VideoCamera] Selected format: ${highestFpsFormat.videoWidth}x${highestFpsFormat.videoHeight} @ ${highestFpsFormat.maxFps}fps`);
      return highestFpsFormat;
    }, [device]);

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
          ref={ref}
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
