import React, { forwardRef } from 'react';
import { StyleSheet, Image } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';

const CameraView = forwardRef(({ template, onReady, cameraPosition = 'front' }, ref) => {
  const device = useCameraDevice(cameraPosition);

  if (!device) return null;

  return (
    <Camera
      ref={ref}
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
      photo={true}
      onInitialized={onReady}
    />
  );
});

export default CameraView;
