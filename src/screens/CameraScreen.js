// import React, { useEffect, useRef, useState } from "react";
// import {
//   View,
//   Image,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
// } from "react-native";
// import { Camera ,useCameraDevices} from "react-native-vision-camera";
// import ViewShot from "react-native-view-shot";
// import TemplateSelector from "../components/TemplateSelector";
// import { templates } from "../images/templates";

// export default function CameraScreen({ navigation }) {
//   const cameraRef = useRef(null);
//   const viewShotRef = useRef(null);
//   const devices = useCameraDevices();
//   const device = devices.front;

//   const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
// const [hasPermission, setHasPermission] = useState(false);

// useEffect(() => {
//   (async () => {
//     const status = await Camera.getCameraPermissionStatus();

//     if (status === "authorized") {
//       setHasPermission(true);
//     } else {
//       const result = await Camera.requestCameraPermission();
//       setHasPermission(result === "authorized");
//     }
//   })();
// }, []);


//   if (!hasPermission || !device) {
//   return null; // or loading view
// }

//   const capturePhoto = async () => {
//     try {
//       await cameraRef.current.takePhoto({
//         flash: "off",
//       });

//       const mergedUri = await viewShotRef.current.capture({
//         format: "png",
//         quality: 1,
//       });

//       navigation.navigate("Preview", {
//         mergedImage: mergedUri,
//       });
//     } catch (e) {
//       Alert.alert("Error", "Failed to capture image");
//     }
//   };
// if (!hasPermission || !device) {
//   return (
//     <View style={styles.permission}>
//       <Text style={{ color: "#ba0a0aff" }}>Camera permission required</Text>
//     </View>
//   );
// }
//   return (
//     <View style={styles.container}>
//       {/* THIS VIEW IS CAPTURED */}
//       <ViewShot ref={viewShotRef} style={styles.preview}>
//         {/* LIVE CAMERA */}
//         <Camera
//           style={{ flex: 1 }}
//           device={device}
//           isActive={true}
//           photo={true}
//         />


//         {/* TEMPLATE OVERLAY */}
//         <Image
//           source={selectedTemplate.image}
//           style={styles.template}
//         />
//       </ViewShot>

//       {/* TEMPLATE SLIDER */}
//       <TemplateSelector
//         templates={templates}
//         selectedTemplate={selectedTemplate}
//         onSelect={setSelectedTemplate}
//       />

//       {/* CAPTURE BUTTON */}
//       <View style={styles.controls}>
//         <TouchableOpacity style={styles.captureBtn} onPress={capturePhoto} />
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#000" },

//   preview: {
//     flex: 1,
//     position: "relative",
//   },

//   template: {
//     position: "absolute",
//     width: "100%",
//     height: "100%",
//     resizeMode: "contain",
//   },

//   controls: {
//     position: "absolute",
//     bottom: 25,
//     width: "100%",
//     alignItems: "center",
//   },

//   captureBtn: {
//     width: 75,
//     height: 75,
//     borderRadius: 38,
//     backgroundColor: "#fff",
//     borderWidth: 4,
//     borderColor: "#000",
//   },
// });

// import React, { useEffect, useState } from "react";
// import { View, Text, StyleSheet } from "react-native";
// import { Camera, useCameraDevices } from "react-native-vision-camera";

// export default function CameraScreen() {
//   const devices = useCameraDevices();
//   const device = devices.front;

//   const [hasPermission, setHasPermission] = useState(false);

//   useEffect(() => {
//     (async () => {
//       const status = await Camera.getCameraPermissionStatus();
//       if (status === "authorized") {
//         setHasPermission(true);
//       } else {
//         const res = await Camera.requestCameraPermission();
//         setHasPermission(res === "authorized");
//       }
//     })();
//   }, []);

//   // 🔴 SHOW LOADING INSTEAD OF WHITE SCREEN
//   if (!hasPermission) {
//     console.log(hasPermission)
//     return (
//       <View style={styles.center}>
//         <Text>Requesting camera permission…</Text>
//       </View>
//     );
//   }

//   if (!device) {
//     return (
//       <View style={styles.center}>
//         <Text>Loading camera device…</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={{ flex: 1 }}>
//       <Camera
//         style={StyleSheet.absoluteFill}
//         device={device}
//         isActive={true}
//         photo={true}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   center: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
// });


import React, { useRef, useState, useEffect } from 'react';
import { View, Alert, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import ViewShot from 'react-native-view-shot';
import CameraView from '../components/CameraView';
import TemplateOverlay from '../components/TemplateOverlay';
import TemplateSlider from '../components/TemplateSlider';
import { mergeCameraWithTemplate } from '../services/ImageMergeService';
import { saveToGallery } from '../services/GalleryService';
import { TEMPLATES } from '../constants/templates';
import CaptureButton from '../components/CaptureButton';

export default function CameraScreen() {
  const cameraRef = useRef(null);
  const viewShotRef = useRef(null);
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraPosition, setCameraPosition] = useState('front');
  const [timerSec, setTimerSec] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [containerLayout, setContainerLayout] = useState(null);
  const [overlayLayout, setOverlayLayout] = useState(null);
  const [matchPreview, setMatchPreview] = useState(false);
  const [isCapturingPreview, setIsCapturingPreview] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState(null);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const previewLoadResolver = React.useRef(null);
  const [diagVariants, setDiagVariants] = useState(false); // developer diagnostic: save alternative variants

  useEffect(() => {
    // reset overlay measurements when camera switches
    setOverlayLayout(null);
  }, [cameraPosition]);

  const performCapture = async () => {
    if (!cameraReady) return;
    console.log('TEMPLATE OBJECT:', template, 'cameraPosition=', cameraPosition);

    try {
      // Always take a full-resolution photo first
      const photo = await cameraRef.current.takePhoto({ qualityPrioritization: 'quality' });

      // If Exact Preview mode requested, render the captured photo into the view and save that view-shot
      if (matchPreview) {
        setIsCapturingPreview(true);
        setPreviewLoaded(false);
        setPreviewImageUri(`file://${photo.path}`);

        // Wait for the preview Image to load (or timeout) so the captured view-shot contains the photo
        const loaded = await new Promise(resolve => {
          previewLoadResolver.current = resolve;
          // safety timeout
          setTimeout(() => {
            if (previewLoadResolver.current) {
              previewLoadResolver.current(false);
              previewLoadResolver.current = null;
            }
          }, 900);
        });

        if (!loaded) console.log('Warning: preview image did not finish loading before capture (timeout)');

        // Capture the composed view (exact preview capture)
        const captured = await viewShotRef.current.capture();

        // Cleanup
        setPreviewImageUri(null);
        setIsCapturingPreview(false);
        setPreviewLoaded(false);

        // Save the captured view-shot
        await saveToGallery(captured);
        Alert.alert('Success', 'Photo saved to gallery (exact preview).');
        return;
      }

      // For front-camera high-res merges, capture a small preview image (rendering the captured photo into the same overlay area)
      let previewCapturePath = null;
      try {
        if (cameraPosition === 'front' && viewShotRef.current) {
          setIsCapturingPreview(true);
          setPreviewLoaded(false);
          setPreviewImageUri(`file://${photo.path}`);

          // Wait for the preview Image to load (or timeout) so the captured view-shot contains the photo
          const loaded = await new Promise(resolve => {
            previewLoadResolver.current = resolve;
            // safety timeout
            setTimeout(() => {
              if (previewLoadResolver.current) {
                previewLoadResolver.current(false);
                previewLoadResolver.current = null;
              }
            }, 900);
          });

          if (!loaded) console.log('Warning: preview image did not finish loading before capture (timeout)');

          previewCapturePath = await viewShotRef.current.capture({ format: 'jpg', quality: 0.6 });
          // Cleanup
          setPreviewImageUri(null);
          setIsCapturingPreview(false);
          setPreviewLoaded(false);
          console.log('Captured preview for matching:', previewCapturePath);
        }
      } catch (err) {
        console.log('Preview capture failed:', err);
        setPreviewImageUri(null);
        setIsCapturingPreview(false);
        previewCapturePath = null;
      }

      // Compute overlay rect relative to container
      let overlayRect = null;
      if (containerLayout && overlayLayout) {
        overlayRect = {
          x: overlayLayout.x,
          y: overlayLayout.y,
          width: overlayLayout.width,
          height: overlayLayout.height,
          containerWidth: containerLayout.width,
          containerHeight: containerLayout.height,
          mirror: cameraPosition === 'front',
        };

        if (diagVariants) {
          overlayRect.saveVariants = true;
        }
      }

      console.log('FINAL TEMPLATE ID:', template.id);
      console.log('OVERLAY RECT:', overlayRect);

      const mergedPath = await mergeCameraWithTemplate(
        photo.path,
        template.id,
        overlayRect,
        previewCapturePath
      );

      await saveToGallery(`file://${mergedPath}`);
      Alert.alert('Success', 'Photo saved with template');
    } catch (e) {
      console.log(e);
      Alert.alert('Error', e.message);
    }
  };

  const onCapture = () => {
    if (countdown > 0) return;

    if (timerSec > 0) {
      setCountdown(timerSec);
      let t = timerSec;
      const id = setInterval(() => {
        t -= 1;
        setCountdown(t);
        if (t <= 0) {
          clearInterval(id);
          setCountdown(0);
          performCapture();
        }
      }, 1000);
    } else {
      performCapture();
    }
  };

  const renderCameraContent = () => {
    if ((matchPreview || isCapturingPreview) && previewImageUri) {
      return (
        <ViewShot
          ref={viewShotRef}
          style={{ flex: 1 }}
          options={{ format: 'jpg', quality: 1 }}
        >
          <View style={{ flex: 1 }}>
            {/* Preview image with the same dimensions as camera */}
            {overlayLayout ? (
              <View
                style={{
                  position: 'absolute',
                  left: overlayLayout.x,
                  top: overlayLayout.y,
                  width: overlayLayout.width,
                  height: overlayLayout.height,
                  overflow: 'hidden',
                }}
              >
                <Image
                  source={{ uri: previewImageUri }}
                  style={[{ width: '100%', height: '100%' }, cameraPosition === 'front' ? { transform: [{ scaleX: -1 }] } : null]}
                  resizeMode="cover"
                  onLoad={() => {
                    setPreviewLoaded(true);
                    if (previewLoadResolver.current) {
                      previewLoadResolver.current(true);
                      previewLoadResolver.current = null;
                    }
                  }}
                />
              </View>
            ) : (
              <Image
                source={{ uri: previewImageUri }}
                style={[{ flex: 1 }, cameraPosition === 'front' ? { transform: [{ scaleX: -1 }] } : null]}
                resizeMode="cover"
                onLoad={() => {
                  setPreviewLoaded(true);
                  if (previewLoadResolver.current) {
                    previewLoadResolver.current(true);
                    previewLoadResolver.current = null;
                  }
                }}
              />
            )}

            {/* Template overlay on top of preview */}
            <TemplateOverlay 
              template={template.src} 
              onLayoutOverlay={(layout) => { console.log('ONLAYOUT OVERLAY:', layout); setOverlayLayout(layout); }}
              absolute
            />
          </View>
        </ViewShot>
      );
    }

    // Regular camera view (not capturing preview)
    return (
      <View style={{ flex: 1 }}>
        {overlayLayout ? (
          <View
            style={{
              position: 'absolute',
              left: overlayLayout.x,
              top: overlayLayout.y,
              width: overlayLayout.width,
              height: overlayLayout.height,
              overflow: 'hidden',
            }}
          >
            <CameraView
              ref={cameraRef}
              cameraPosition={cameraPosition}
              template={template.src}
              style={{ flex: 1 }}
              showTemplate={false}
              onReady={() => {
                console.log('Camera ready');
                setCameraReady(true);
              }}
            />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <CameraView
              ref={cameraRef}
              cameraPosition={cameraPosition}
              template={template.src}
              onReady={() => {
                console.log('Camera ready');
                setCameraReady(true);
              }}
            />
          </View>
        )}

        {/* Template overlay for UI preview */}
        <TemplateOverlay 
          template={template.src} 
          onLayoutOverlay={(layout) => setOverlayLayout(layout)}
          absolute
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Main camera/preview area */}
      <View 
        style={styles.cameraContainer}
        onLayout={(e) => setContainerLayout(e.nativeEvent.layout)}
      >
        {renderCameraContent()}

        {/* Top controls */}
        <View style={styles.topControls} pointerEvents="box-none">
          <View style={styles.controlsRow}>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => setTimerSec(timerSec === 0 ? 3 : timerSec === 3 ? 5 : 0)}
            >
              <Text style={styles.buttonText}>
                {timerSec === 0 ? 'Timer: Off' : `Timer: ${timerSec}s`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => setCameraPosition((p) => (p === 'front' ? 'back' : 'front'))}
            >
              <Text style={styles.buttonText}>
                {cameraPosition === 'front' ? 'Front' : 'Back'}
              </Text>
            </TouchableOpacity>
            {/* <TouchableOpacity 
              style={[styles.button, matchPreview && styles.activeButton]} 
              onPress={() => setMatchPreview((v) => !v)}
            >
              <Text style={styles.buttonText}>
                {matchPreview ? '✓ Preview' : 'Preview'}
              </Text>
            </TouchableOpacity> */}

            {/* Diagnostic toggle: save variant images for debugging orientation/mapping */}
            {/* <TouchableOpacity
              style={[styles.button, diagVariants && styles.activeButton]}
              onPress={() => setDiagVariants((v) => !v)}
            >
              <Text style={styles.buttonText}>{diagVariants ? 'Diag: On' : 'Diag'}</Text>
            </TouchableOpacity> */}


          </View>
        </View>

        {/* Countdown overlay */}
        {countdown > 0 && (
          <View style={styles.countdownOverlay} pointerEvents="none">
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}
      </View>

      {/* Template slider at bottom */}
      <TemplateSlider 
        templates={TEMPLATES} 
        onSelect={setTemplate} 
      />

      {/* Capture button */}
      <CaptureButton 
        onPress={onCapture} 
        disabled={!cameraReady}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 7,
    position: 'relative',
    overflow: 'hidden',
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
  },
  button: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  activeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 20,
  },
  countdownText: {
    fontSize: 120,
    color: '#fff',
    fontWeight: 'bold',
  },
});
