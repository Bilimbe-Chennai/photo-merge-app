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
//   },
// });

import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, Modal, Alert, ActivityIndicator, ScrollView } from 'react-native';
import ViewShot from 'react-native-view-shot';
import CameraView from '../components/CameraView';
import TemplateOverlay from '../components/TemplateOverlay';
import TemplateSlider from '../components/TemplateSlider';
import { mergeCameraWithTemplate } from '../services/ImageMergeService';
import { saveToGallery } from '../services/GalleryService';
import { TEMPLATES } from '../constants/templates';
import CaptureButton from '../components/CaptureButton';
import NetInfo from '@react-native-community/netinfo';
import { processQueue } from '../services/OfflineUploadQueue';
import { uploadWithOfflineQueue } from '../services/ApiUploadService';
import Icon from 'react-native-vector-icons/MaterialIcons';


export default function CameraScreen({ navigation, route }) {
  const cameraRef = useRef(null);
  const viewShotRef = useRef(null);
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraPosition, setCameraPosition] = useState('front');
  const [timerSec, setTimerSec] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [containerLayout, setContainerLayout] = useState(null);
  const [overlayLayout, setOverlayLayout] = useState(null);

  // Extract user details passed from LoginScreen
  const user = route?.params?.user || {};

  const [isCapturingPreview, setIsCapturingPreview] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState(null);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const previewLoadResolver = React.useRef(null);
  const [diagVariants, setDiagVariants] = useState(false); // developer diagnostic: save alternative variants
  const [finalImageUri, setFinalImageUri] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Dev-only debug panel: shows payload passed to native merge (overlay + preview path)
  const [debugPanelVisible, setDebugPanelVisible] = useState(false);
  const [debugPayload, setDebugPayload] = useState(null);






  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // reset overlay measurements when camera switches
    setOverlayLayout(null);
  }, [cameraPosition]);

  const performCapture = async () => {
    if (!cameraReady || processing) return;
    setProcessing(true);
    console.log('TEMPLATE OBJECT:', template, 'cameraPosition=', cameraPosition);

    try {
      // 1. Take a full-resolution photo (4:3)
      const photo = await cameraRef.current.takePhoto();


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

          if (!loaded) console.log('Warning: preview image timeout');

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
        };

        if (diagVariants) {
          overlayRect.saveVariants = true;
        }
      }

      console.log('FINAL TEMPLATE ID:', template.id);
      console.log('OVERLAY RECT:', overlayRect);

      // Debug: capture the exact payload we'll pass to native so devs can inspect/copy it
      if (__DEV__) {
        setDebugPayload({
          photoPath: photo.path,
          templateId: template.id,
          overlay: overlayRect,
          previewPath: previewCapturePath,
        });
      }

      const mergedPath = await mergeCameraWithTemplate(
        photo.path,
        template.id,
        overlayRect,
        previewCapturePath
      );

      // Defer saving: show preview and let user confirm (tick) to save/upload
      setFinalImageUri(`file://${mergedPath}`);
      setShowPreview(true);
    } catch (e) {
      console.log(e);
      Alert.alert('Error', e.message);
    } finally {
      setProcessing(false);
    }
  };
  const uploadToApi = async (uri) => {
    const formData = new FormData();
    formData.append('image', {
      uri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    });

    await fetch('https://your-api-url.com/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
    // 1. If capturing front-camera preview (ViewShot hack)
    if (isCapturingPreview && previewImageUri) {
      return (
        <ViewShot ref={viewShotRef} style={{ flex: 1 }} options={{ format: 'jpg', quality: 1 }}>
          <View style={{ flex: 1 }}>
            {/* The image of the person needs to cover the same 3:4 area as the camera */}
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
            {/* Template on top */}
            <TemplateOverlay
              template={template.src}
              onLayoutOverlay={(layout) => setOverlayLayout(layout)}
              absolute
            />
          </View>
        </ViewShot>
      );
    }

    // 2. Regular Camera Mode (Matched to 3:4)
    // We render the Camera at the FULL size of the container, and place the Template Overlay on top.
    // This ensures the camera engine uses the full sensor/preview resolution.
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView
          ref={cameraRef}
          cameraPosition={cameraPosition}
          onReady={() => setCameraReady(true)}
        />
        <TemplateOverlay
          template={template.src}
          onLayoutOverlay={(layout) => setOverlayLayout(layout)}
          absolute
        />
      </View>
    );
  };

  const handleConfirmSave = async () => {
    try {
      setIsSaving(true);

      console.log('SAVING PHOTO:', {
        user,
        template: template.name,
        uri: finalImageUri
      });

      // 1️⃣ Save locally
      await saveToGallery(finalImageUri);

      // 2️⃣ Try API upload
      await uploadWithOfflineQueue(finalImageUri);

      Alert.alert('Success', 'Photo saved successfully');
    } catch (e) {
      Alert.alert('Saved', 'Photo saved locally. Will upload when online.');
    } finally {
      setIsSaving(false);
      setShowPreview(false);
      setFinalImageUri(null);
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        processQueue();
      }
    });

    return () => unsubscribe();
  }, []);


  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topIconBtn}
          onPress={() => setTimerSec(timerSec === 0 ? 3 : timerSec === 3 ? 5 : 0)}
        >
          <View style={{ position: 'relative' }}>
            <Icon name="timer" size={28} color="#fff" />
            {timerSec !== 0 && (
              <View style={styles.timerBadge}>
                <Text style={styles.timerBadgeText}>{timerSec}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Main camera/preview area - 3:4 Aspect Ratio */}
      <View
        style={styles.cameraContainer}
        onLayout={(e) => setContainerLayout(e.nativeEvent.layout)}
      >
        {renderCameraContent()}

        {/* Countdown overlay */}
        {countdown > 0 && (
          <View style={styles.countdownOverlay} pointerEvents="none">
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}
      </View>

      {/* Template slider area */}
      <View style={styles.sliderContainer}>
        <TemplateSlider
          templates={TEMPLATES}
          onSelect={setTemplate}
        />
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.sideButton} onPress={() => Alert.alert('Gallery', 'Opening Gallery...')}>
          <Icon name="photo-library" size={32} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.captureBtnWrapper}
          onPress={onCapture}
          disabled={processing || !cameraReady}
        >
          <View style={styles.captureBtnOuter}>
            <View style={styles.captureBtnInner} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sideButton}
          onPress={() => setCameraPosition(prev => prev === 'front' ? 'back' : 'front')}
        >
          <Icon name="cached" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Final Preview Overlay */}
      {showPreview && finalImageUri && (
        <View style={styles.previewOverlay}>
          <Image source={{ uri: finalImageUri }} style={styles.fullPreviewImage} resizeMode="contain" />
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.previewBtn} onPress={() => { setShowPreview(false); setFinalImageUri(null); }}>
              <Icon name="close" size={30} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.previewBtn, { backgroundColor: '#4CAF50' }]} onPress={handleConfirmSave}>
              {isSaving ? <ActivityIndicator color="#fff" /> : <Icon name="check" size={30} color="#fff" />}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Processing Indicator */}
      {processing && (
        <View style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={{ color: 'white', marginTop: 20, fontWeight: 'bold' }}>Enhancing Image...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const screenWidth = Dimensions.get('window').width;
const cameraHeight = (screenWidth * 4) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  topBar: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  topIconBtn: {
    padding: 10,
  },
  timerBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#ff4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cameraContainer: {
    width: screenWidth,
    height: cameraHeight,
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
  },
  sliderContainer: {
    marginVertical: 10,
    height: 100,
  },
  bottomControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 30,
  },
  sideButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#fff',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  countdownText: {
    fontSize: 120,
    color: '#fff',
    fontWeight: 'bold',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 100,
  },
  fullPreviewImage: {
    flex: 1,
  },
  previewActions: {
    height: 120,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingBottom: 20,
  },
  previewBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
