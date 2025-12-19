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
      // NOTE: removed `snapshot` prop — some devices/Camera2 configurations
      // throw `session/invalid-output-configuration` when snapshot is present
      onInitialized={onReady}
    >
      {/* TEMPLATE DRAWN INSIDE CAMERA SURFACE */}
      <Image
        source={template}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
      />
    </Camera>
  );
});

export default CameraView;
