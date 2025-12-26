import React, { forwardRef, useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
} from 'react-native-vision-camera';

const CameraView = forwardRef(
  ({ template, onReady, cameraPosition = 'front' }, ref) => {
    const [hasPermission, setHasPermission] = useState(false);
    const device = useCameraDevice(cameraPosition);

    useEffect(() => {
      (async () => {
        const status = await Camera.requestCameraPermission();
        setHasPermission(status === 'granted');
      })();
    }, []);

    // Use videoResolution: 'max' to select the best "binned" mode (e.g. 12MP/4K)
    // which offers better light sensitivity and matches the preview exposure,
    // rather than the raw "max" photo mode which can be dark/noisy.
    // TARGET: MATCH DEFAULT CAMERA (12MP)
    // The default camera app uses a specific "Sweet Spot" resolution (approx 4000x3000).
    // Standard "max" settings often miss this and pick the wrong one (Too Dark or Too Low Res).
    // This custom logic mimics the default camera's choice.
    const format = React.useMemo(() => {
      if (!device) return null;

      const bestFormat = device.formats.sort((a, b) => {
        // 1. Prioritize HDR Support (Vital for noise reduction/quality)
        if (a.supportsPhotoHdr && !b.supportsPhotoHdr) return -1;
        if (!a.supportsPhotoHdr && b.supportsPhotoHdr) return 1;

        // 2. Prioritize 4:3 Aspect Ratio (approx 1.33)
        const aRatio = a.photoWidth / a.photoHeight;
        const bRatio = b.photoWidth / b.photoHeight;
        const isA43 = Math.abs(aRatio - 1.33) < 0.1;
        const isB43 = Math.abs(bRatio - 1.33) < 0.1;
        if (isA43 && !isB43) return -1;
        if (!isA43 && isB43) return 1;

        // 3. Target "Sweet Spot" 12MP (approx 4000px width)
        const targetWidth = 4000;
        const aDiff = Math.abs(a.photoWidth - targetWidth);
        const bDiff = Math.abs(b.photoWidth - targetWidth);
        if (aDiff !== bDiff) return aDiff - bDiff;

        // 4. Prefer higher Video Resolution for a crisp preview
        return b.videoWidth - a.videoWidth;
      })[0];

      console.log(
        `[Camera] Selected Format: ${bestFormat?.photoWidth}x${bestFormat?.photoHeight} HDR:${bestFormat?.supportsPhotoHdr} Vid:${bestFormat?.videoWidth}x${bestFormat?.videoHeight}`,
      );
      return bestFormat;
    }, [device]);

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

    return (
      <Camera
        ref={ref}
        style={StyleSheet.absoluteFill}
        device={device}
        format={format}
        isActive={true}
        photo={true}
        resizeMode="cover"
        photoQualityBalance="quality"
        photoHdr={format?.supportsPhotoHdr}
        videoHdr={format?.supportsVideoHdr}
        enableZoomGesture={true}
        onInitialized={onReady}
      />
    );
  },
);

export default CameraView;
