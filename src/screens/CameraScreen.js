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

// import React, { useRef, useState, useEffect } from 'react';
// import { View, Alert, StyleSheet, Text, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
// import ViewShot from 'react-native-view-shot';
// import CameraView from '../components/CameraView';
// import TemplateOverlay from '../components/TemplateOverlay';
// import TemplateSlider from '../components/TemplateSlider';
// import { mergeCameraWithTemplate } from '../services/ImageMergeService';
// import { saveToGallery } from '../services/GalleryService';
// import { TEMPLATES } from '../constants/templates';
// import CaptureButton from '../components/CaptureButton';
// import NetInfo from '@react-native-community/netinfo';
// import { processQueue } from '../services/OfflineUploadQueue';
// import { uploadWithOfflineQueue } from '../services/ApiUploadService';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// export default function CameraScreen({ navigation, route }) {
//   const cameraRef = useRef(null);
//   const viewShotRef = useRef(null);
//   const [template, setTemplate] = useState(TEMPLATES[0]);
//   const [cameraReady, setCameraReady] = useState(false);
//   const [cameraPosition, setCameraPosition] = useState('front');
//   const [timerSec, setTimerSec] = useState(0);
//   const [countdown, setCountdown] = useState(0);
//   const [containerLayout, setContainerLayout] = useState(null);
//   const [overlayLayout, setOverlayLayout] = useState(null);

//   const [isCapturingPreview, setIsCapturingPreview] = useState(false);
//   const [previewImageUri, setPreviewImageUri] = useState(null);
//   const [previewLoaded, setPreviewLoaded] = useState(false);
//   const previewLoadResolver = React.useRef(null);
//   const [diagVariants, setDiagVariants] = useState(false); // developer diagnostic: save alternative variants
//   const [finalImageUri, setFinalImageUri] = useState(null);
//   const [capturedPhoto, setCapturedPhoto] = useState(null);
//   const [showPreview, setShowPreview] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const user = (route && route.params && route.params.user) ? route.params.user : {};

//   // Dev-only debug panel: shows payload passed to native merge (overlay + preview path)
//   const [debugPanelVisible, setDebugPanelVisible] = useState(false);
//   const [debugPayload, setDebugPayload] = useState(null);

//   useEffect(() => {
//     // reset overlay measurements when camera switches
//     setOverlayLayout(null);
//   }, [cameraPosition]);

//   const performCapture = async () => {
//     if (!cameraReady) return;
//     console.log('TEMPLATE OBJECT:', template, 'cameraPosition=', cameraPosition);

//     try {
//       // Always take a full-resolution photo first
//       const photo = await cameraRef.current.takePhoto({ qualityPrioritization: 'quality' });
//       // For front-camera high-res merges, capture a small preview image (rendering the captured photo into the same overlay area)
//       let previewCapturePath = null;
//       try {
//         if (cameraPosition === 'front' && viewShotRef.current) {
//           setIsCapturingPreview(true);
//           setPreviewLoaded(false);
//           setPreviewImageUri(`file://${photo.path}`);

//           // Wait for the preview Image to load (or timeout) so the captured view-shot contains the photo
//           const loaded = await new Promise(resolve => {
//             previewLoadResolver.current = resolve;
//             // safety timeout
//             setTimeout(() => {
//               if (previewLoadResolver.current) {
//                 previewLoadResolver.current(false);
//                 previewLoadResolver.current = null;
//               }
//             }, 900);
//           });

//           if (!loaded) console.log('Warning: preview image did not finish loading before capture (timeout)');

//           previewCapturePath = await viewShotRef.current.capture({ format: 'jpg', quality: 0.6 });
//           // Cleanup
//           setPreviewImageUri(null);
//           setIsCapturingPreview(false);
//           setPreviewLoaded(false);
//           console.log('Captured preview for matching:', previewCapturePath);
//         }
//       } catch (err) {
//         console.log('Preview capture failed:', err);
//         setPreviewImageUri(null);
//         setIsCapturingPreview(false);
//         previewCapturePath = null;
//       }

//       // Compute overlay rect relative to container
//       let overlayRect = null;
//       if (containerLayout && overlayLayout) {
//         overlayRect = {
//           x: overlayLayout.x,
//           y: overlayLayout.y,
//           width: overlayLayout.width,
//           height: overlayLayout.height,
//           containerWidth: containerLayout.width,
//           containerHeight: containerLayout.height,
//         };

//         if (diagVariants) {
//           overlayRect.saveVariants = true;
//         }
//       }

//       console.log('FINAL TEMPLATE ID:', template.id);
//       console.log('OVERLAY RECT:', overlayRect);

//       // Debug: capture the exact payload we'll pass to native so devs can inspect/copy it
//       if (__DEV__) {
//         setDebugPayload({
//           photoPath: photo.path,
//           templateId: template.id,
//           overlay: overlayRect,
//           previewPath: previewCapturePath,
//         });
//       }

//       const mergedPath = await mergeCameraWithTemplate(
//         photo.path,
//         template.id,
//         overlayRect,
//         previewCapturePath
//       );
// const uploadPhoto = {
//   uri: `file://${mergedPath}`,
//   name: `photo_${Date.now()}.jpg`,
//   type: 'image/jpeg',
// };
//       // Defer saving: show preview and let user confirm (tick) to save/upload
//       setFinalImageUri(`file://${mergedPath}`);
//       setCapturedPhoto(uploadPhoto);
//       setShowPreview(true);
//     } catch (e) {
//       console.log(e);
//       Alert.alert('Error', e.message);
//     }
//   };

//   const onCapture = () => {
//     if (countdown > 0) return;

//     if (timerSec > 0) {
//       setCountdown(timerSec);
//       let t = timerSec;
//       const id = setInterval(() => {
//         t -= 1;
//         setCountdown(t);
//         if (t <= 0) {
//           clearInterval(id);
//           setCountdown(0);
//           performCapture();
//         }
//       }, 1000);
//     } else {
//       performCapture();
//     }
//   };

//   const renderCameraContent = () => {
//     if (isCapturingPreview && previewImageUri) {
//       return (
//         <ViewShot
//           ref={viewShotRef}
//           style={{ flex: 1 }}
//           options={{ format: 'jpg', quality: 1 }}
//         >
//           <View style={{ flex: 1 }}>
//             {/* Preview image with the same dimensions as camera */}
//             {overlayLayout ? (
//               <View
//                 style={{
//                   position: 'absolute',
//                   left: overlayLayout.x,
//                   top: overlayLayout.y,
//                   width: overlayLayout.width,
//                   height: overlayLayout.height,
//                   overflow: 'hidden',
//                 }}
//               >
//                 <Image
//                   source={{ uri: previewImageUri }}
//                   style={[{ width: '100%', height: '100%' }, cameraPosition === 'front' ? { transform: [{ scaleX: -1 }] } : null]}
//                   resizeMode="cover"
//                   onLoad={() => {
//                     setPreviewLoaded(true);
//                     if (previewLoadResolver.current) {
//                       previewLoadResolver.current(true);
//                       previewLoadResolver.current = null;
//                     }
//                   }}
//                 />
//               </View>
//             ) : (
//               <Image
//                 source={{ uri: previewImageUri }}
//                 style={[{ flex: 1 }, cameraPosition === 'front' ? { transform: [{ scaleX: -1 }] } : null]}
//                 resizeMode="cover"
//                 onLoad={() => {
//                   setPreviewLoaded(true);
//                   if (previewLoadResolver.current) {
//                     previewLoadResolver.current(true);
//                     previewLoadResolver.current = null;
//                   }
//                 }}
//               />
//             )}

//             {/* Template overlay on top of preview */}
//             <TemplateOverlay
//               template={template.src}
//               onLayoutOverlay={(layout) => { console.log('ONLAYOUT OVERLAY:', layout); setOverlayLayout(layout); }}
//               absolute
//             />
//           </View>
//         </ViewShot>
//       );
//     }

//     // Regular camera view (not capturing preview)
//     return (
//       <View style={{ flex: 1 }}>
//         {overlayLayout ? (
//           <View
//             style={{
//               position: 'absolute',
//               left: overlayLayout.x,
//               top: overlayLayout.y,
//               width: overlayLayout.width,
//               height: overlayLayout.height,
//               overflow: 'hidden',
//             }}
//           >
//             <CameraView
//               ref={cameraRef}
//               cameraPosition={cameraPosition}
//               template={template.src}
//               style={{ flex: 1 }}
//               showTemplate={false}
//               onReady={() => {
//                 console.log('Camera ready');
//                 setCameraReady(true);
//               }}
//             />
//           </View>
//         ) : (
//           <View style={{ flex: 1 }}>
//             <CameraView
//               ref={cameraRef}
//               cameraPosition={cameraPosition}
//               template={template.src}
//               onReady={() => {
//                 console.log('Camera ready');
//                 setCameraReady(true);
//               }}
//             />
//           </View>
//         )}

//         {/* Template overlay for UI preview */}
//         <TemplateOverlay
//           template={template.src}
//           onLayoutOverlay={(layout) => setOverlayLayout(layout)}
//           absolute
//         />
//       </View>
//     );
//   };

//   const handleConfirmSave = async () => {
//     try {
//       setIsSaving(true);

//       // 1️⃣ Save locally
//       await saveToGallery(finalImageUri);

//       // 2️⃣ Try API upload (include user data mapped to API fields)
//       const uploadUserData = {
//         clientName: user && (user.name) ? (user.name) : '',
//         email: user && (user.email || '') ? user.email : '',
//         whatsapp: user && (user.whatsapp) ? (user.whatsapp) : '',
//         template_name: template && (template.id || template.name) ? (template.id || template.name) : '',
//         source: 'Photo Merge App',
//       };
//       await uploadWithOfflineQueue(capturedPhoto, uploadUserData);
//       Alert.alert('Success', 'Photo saved successfully');
//     } catch (e) {
//       Alert.alert('Success', 'Photo saved check your gallery');
//       // Alert.alert('Saved', 'Photo saved locally. Will upload when online.');
//     } finally {
//       setIsSaving(false);
//       setShowPreview(false);
//       setFinalImageUri(null);
//     }
//   };

//   useEffect(() => {
//     const unsubscribe = NetInfo.addEventListener(state => {
//       if (state.isConnected) {
//         processQueue();
//       }
//     });

//     return () => unsubscribe();
//   }, []);

//   return (
//     <View style={styles.container}>
//       {/* Main camera/preview area */}
//       <View
//         style={styles.cameraContainer}
//         onLayout={(e) => setContainerLayout(e.nativeEvent.layout)}
//       >
//         {renderCameraContent()}

//         {/* Top controls */}
//         <View style={styles.topControls} pointerEvents="box-none">
//           <View style={styles.controlsRow}>
//             {/* Diagnostic toggle: save variant images for debugging orientation/mapping */}
//             {/* <TouchableOpacity
//               style={[styles.button, diagVariants && styles.activeButton]}
//               onPress={() => setDiagVariants((v) => !v)}
//             >
//               <Text style={styles.buttonText}>{diagVariants ? 'Diag: On' : 'Diag'}</Text>
//             </TouchableOpacity> */}
//           </View>
//         </View>

//         {/* Countdown overlay */}
//         {countdown > 0 && (
//           <View style={styles.countdownOverlay} pointerEvents="none">
//             <Text style={styles.countdownText}>{countdown}</Text>
//           </View>
//         )}

//         {/* Dev-only debug panel: shows last payload passed to native */}
//         {/* {__DEV__ && debugPanelVisible && debugPayload && (
//           <View style={styles.debugPanel}>
//             <ScrollView style={{ flex: 1, padding: 8 }}>
//               <Text style={styles.debugText}>{JSON.stringify(debugPayload, null, 2)}</Text>
//             </ScrollView>
//             <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 8 }}>
//               <TouchableOpacity
//                 style={[styles.button, { paddingHorizontal: 16 }]}
//                 onPress={() => console.log('DEBUG PAYLOAD:', debugPayload)}
//               >
//                 <Text style={styles.buttonText}>Log</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.button, { paddingHorizontal: 16 }]}
//                 onPress={() => { setDebugPanelVisible(false); setDebugPayload(null); }}
//               >
//                 <Text style={styles.buttonText}>Close</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         )}  */}
//       </View>

//       {/* Template slider at bottom */}
//       <TemplateSlider
//         templates={TEMPLATES}
//         onSelect={setTemplate}
//       />

//       {/* Capture button */}
//       <View style={styles.bottomControls}>
//         <TouchableOpacity
//           style={styles.iconButton}
//           onPress={() => setTimerSec(timerSec === 0 ? 3 : timerSec === 3 ? 5 : 0)}
//         >
//           <View style={{ alignItems: 'center' }}>
//             <MaterialIcons  name="timer" size={22} color="#fff" />
//             {timerSec !== 0 && <Text style={styles.iconSubText}>{`${timerSec}s`}</Text>}
//           </View>
//         </TouchableOpacity>

//         <CaptureButton
//           onPress={onCapture}
//           disabled={!cameraReady}
//         />

//         <TouchableOpacity
//           style={styles.iconButton}
//           onPress={() => setCameraPosition((p) => (p === 'front' ? 'back' : 'front'))}
//         >
//           <MaterialIcons  name="flip-camera-android" size={24} color="#fff" />
//         </TouchableOpacity>
//       </View>
//       {showPreview && finalImageUri && (
//         <View style={styles.previewOverlay}>
//           <Image source={{ uri: finalImageUri }} style={styles.previewImage} />

//           <View style={styles.previewActions}>
//             {/* CLOSE */}
//             <TouchableOpacity
//               style={[styles.previewBtn, styles.closeBtn]}
//               onPress={() => {
//                 setShowPreview(false);
//                 setFinalImageUri(null);
//               }}
//             >
//               <Text style={styles.btnText}>✕</Text>
//             </TouchableOpacity>

//             {/* TICK */}
//             <TouchableOpacity
//               disabled={isSaving}
//               style={[
//                 styles.previewBtn,
//                 styles.tickBtn,
//                 isSaving && { opacity: 0.6 }
//               ]}
//               onPress={handleConfirmSave}
//             >
//               {isSaving ? (
//                 <ActivityIndicator size="large" color="#fff" />
//               ) : (
//                 <Text style={styles.btnText}>✓</Text>
//               )}
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}

//     </View>

//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   cameraContainer: {
//     flex: 7,
//     position: 'relative',
//     overflow: 'hidden',
//   },
//   topControls: {
//     position: 'absolute',
//     top: 50,
//     left: 0,
//     right: 0,
//     zIndex: 10,
//     paddingHorizontal: 16,
//   },
//   controlsRow: {
//     flexDirection: 'row',
//     justifyContent: 'flex-start',
//     gap: 8,
//   },
//   button: {
//     backgroundColor: 'rgba(0, 0, 0, 0.6)',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 8,
//   },
//   activeButton: {
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   countdownOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     zIndex: 20,
//   },
//   countdownText: {
//     fontSize: 120,
//     color: '#fff',
//     fontWeight: 'bold',
//   },
//   previewOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: '#000',
//     zIndex: 50,
//   },

//   previewImage: {
//     flex: 1,
//     resizeMode: 'contain',
//   },

//   previewActions: {
//     position: 'absolute',
//     bottom: 40,
//     left: 0,
//     right: 0,
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//   },

//   previewBtn: {
//     width: 70,
//     height: 70,
//     borderRadius: 35,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   closeBtn: {
//     backgroundColor: '#ff3b30',
//   },

//   tickBtn: {
//     backgroundColor: '#4cd964',
//   },

//   btnText: {
//     fontSize: 32,
//     color: '#fff',
//     fontWeight: 'bold',
//   },

//   // Bottom control row (capture + icons)
//   bottomControls: {
//     position: 'absolute',
//     bottom: 20,
//     left: 0,
//     right: 0,
//     zIndex: 40,
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     paddingHorizontal: 32,
//   },

//   iconButton: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },

//   iconText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '600',
//   },

//   iconSubText: {
//     color: '#fff',
//     fontSize: 12,
//     marginTop: 2,
//   },

//   debugPanel: {
//     position: 'absolute',
//     bottom: 16,
//     left: 12,
//     right: 12,
//     height: 180,
//     backgroundColor: 'rgba(0,0,0,0.85)',
//     borderRadius: 8,
//     zIndex: 60,
//     overflow: 'hidden',
//   },
//   debugText: {
//     color: '#fff',
//     fontSize: 12,
//   },

// });
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { uploadToApi } from '../services/UploadApi';
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
import { PERMISSIONS, RESULTS, request, check } from 'react-native-permissions';

// Camera permissions based on platform
const CAMERA_PERMISSION = Platform.select({
  ios: PERMISSIONS.IOS.CAMERA,
  android: PERMISSIONS.ANDROID.CAMERA,
});

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
  const [isCapturingPreview, setIsCapturingPreview] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState(null);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const previewLoadResolver = React.useRef(null);
  const [diagVariants, setDiagVariants] = useState(false);
  const [finalImageUri, setFinalImageUri] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  console.log('Uploading photo:', capturedPhoto);

  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);

  const user =
    route && route.params && route.params.user ? route.params.user : {};
  const [debugPanelVisible, setDebugPanelVisible] = useState(false);
  const [debugPayload, setDebugPayload] = useState(null);

  // Check and request camera permission on mount
  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    try {
      const result = await check(CAMERA_PERMISSION);
      console.log('Camera permission check result:', result);

      if (result === RESULTS.GRANTED) {
        setHasCameraPermission(true);
      } else if (result === RESULTS.DENIED) {
        // Request permission for first time
        requestCameraPermission();
      } else if (result === RESULTS.BLOCKED) {
        // Permission was denied and cannot be requested again
        setHasCameraPermission(false);
        showPermissionDeniedAlert();
      } else {
        setHasCameraPermission(false);
      }
    } catch (error) {
      console.error('Error checking camera permission:', error);
      setHasCameraPermission(false);
    } finally {
      setIsCheckingPermission(false);
    }
  };

  const requestCameraPermission = async () => {
    try {
      const result = await request(CAMERA_PERMISSION);
      console.log('Camera permission request result:', result);

      if (result === RESULTS.GRANTED) {
        setHasCameraPermission(true);
      } else if (result === RESULTS.BLOCKED) {
        setHasCameraPermission(false);
        showPermissionDeniedAlert();
      } else {
        setHasCameraPermission(false);
        showPermissionRequiredAlert();
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setHasCameraPermission(false);
    }
  };

  const showPermissionDeniedAlert = () => {
    Alert.alert(
      'Camera Permission Required',
      'Camera permission is required to use this feature. Please enable it in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => openAppSettings(),
        },
      ],
    );
  };

  const showPermissionRequiredAlert = () => {
    Alert.alert(
      'Camera Permission Required',
      'This app needs access to your camera to take photos.',
      [
        {
          text: 'Grant Permission',
          onPress: () => requestCameraPermission(),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const openAppSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // reset overlay measurements when camera switches
    setOverlayLayout(null);
  }, [cameraPosition]);
const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: "photo",
      quality: 1,
    });

    if (result.didCancel) return;

    if (result.assets && result.assets.length > 0) {
      const picked = result.assets[0];
     //setPhoto(picked.uri);
    }
  };

  const performCapture = async () => {
    if (!cameraReady || !hasCameraPermission || processing) return;

    // Double-check permission before capture
    const permissionStatus = await check(CAMERA_PERMISSION);
    if (permissionStatus !== RESULTS.GRANTED) {
      showPermissionRequiredAlert();
      return;
    }

    setProcessing(true);
    console.log(
      'TEMPLATE OBJECT:',
      template,
      'cameraPosition=',
      cameraPosition,
    );

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

          previewCapturePath = await viewShotRef.current.capture({
            format: 'jpg',
            quality: 0.6,
          });
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
        previewCapturePath,
      );
      const uploadPhoto = {
        uri: `file://${mergedPath}`,
        name: `photo_${Date.now()}.jpg`,
        type: 'image/jpeg',
      };

      // Defer saving: show preview and let user confirm (tick) to save/upload
      setFinalImageUri(`file://${mergedPath}`);
      setCapturedPhoto(uploadPhoto);

      setShowPreview(true);
    } catch (e) {
      console.log(e);
      Alert.alert('Error', e.message);
    } finally {
      setProcessing(false);
    }
  };

  const onCapture = () => {
    // Check permission before starting capture
    if (!hasCameraPermission) {
      showPermissionRequiredAlert();
      return;
    }

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
    // Show loading while checking permission
    if (isCheckingPermission) {
      return (
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.permissionText}>
            Checking camera permission...
          </Text>
        </View>
      );
    }

    // Show permission request UI if no permission
    if (!hasCameraPermission) {
      return (
        <View style={styles.permissionContainer}>
          <Icon name="camera-off" size={80} color="#fff" />
          <Text style={styles.permissionText}>Camera Access Required</Text>
          <Text style={styles.permissionSubText}>
            Please grant camera permission to use this feature
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestCameraPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.permissionButton, styles.settingsButton]}
            onPress={openAppSettings}
          >
            <Text style={styles.permissionButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // 1. If capturing front-camera preview (ViewShot hack)
    if (isCapturingPreview && previewImageUri) {
      return (
        <ViewShot
          ref={viewShotRef}
          style={{ flex: 1 }}
          options={{ format: 'jpg', quality: 1 }}
        >
          <View style={{ flex: 1 }}>
            {/* The image of the person needs to cover the same 3:4 area as the camera */}
            <Image
              source={{ uri: previewImageUri }}
              style={[
                { flex: 1 },
                cameraPosition === 'front'
                  ? { transform: [{ scaleX: -1 }] }
                  : null,
              ]}
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
              onLayoutOverlay={layout => setOverlayLayout(layout)}
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
          onLayoutOverlay={layout => setOverlayLayout(layout)}
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
        uri: finalImageUri,
      });

      // 1️⃣ Save locally
      await saveToGallery(finalImageUri);

      // 2️⃣ Try API upload (include user data mapped to API fields)
      // const uploadUserData = {
      //   clientName: user && (user.name) ? (user.name) : '',
      //   email: user && (user.email || '') ? user.email : '',
      //   whatsapp: user && (user.whatsapp) ? (user.whatsapp) : '',
      //   template_name: template && (template.id || template.name) ? (template.id || template.name) : 'birthday_template_1',
      //   source: 'Photo Merge App',
      // };
      // await uploadWithOfflineQueue(capturedPhoto, uploadUserData);
      // 2️⃣ Upload to backend
      const metadata = {
        clientName: user?.name || '',
        email: user?.email || '',
        whatsapp: user?.whatsapp || '',
        template_name: template?.id || 'birthday_template_1',
        source: 'Photo Merge App',
      };

      if (capturedPhoto) {
        const uploadResult = await uploadToApi(capturedPhoto, metadata);
        console.log('Upload success:', uploadResult);
        Alert.alert('Success', 'Photo saved & uploaded successfully!');
      } else {
        Alert.alert('Saved', 'Photo saved locally.');
      }
    } catch (e) {
      console.error('Upload error:', e);
      Alert.alert('Error', 'Upload failed. Photo saved locally.');
      // Alert.alert('Saved', 'Photo saved locally. Will upload when online.');
    } finally {
      setIsSaving(false);
      setShowPreview(false);
      setFinalImageUri(null);
      setCapturedPhoto(null);
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
      {/* <View style={styles.topBar}>
         {!hasCameraPermission && (
          <View style={styles.topControls} pointerEvents="box-none">
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.topIconBtn}
                onPress={checkCameraPermission}
              >
                <Icon name="refresh" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        <TouchableOpacity
          style={styles.topIconBtn}
          onPress={() =>
            setTimerSec(timerSec === 0 ? 3 : timerSec === 3 ? 5 : 0)
          }
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
      </View> */}

      {/* Main camera/preview area - 3:4 Aspect Ratio */}
      <View
        style={styles.cameraContainer}
        onLayout={e => setContainerLayout(e.nativeEvent.layout)}
      >
        {renderCameraContent()}

        {/* Top controls - Only show if we have camera permission */}  

        {/* Countdown overlay */}
        {countdown > 0 && (
          <View style={styles.countdownOverlay} pointerEvents="none">
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}
      </View>

      {/* Template slider area - Only show if we have camera permission */}
      {hasCameraPermission && (
        <View style={styles.sliderContainer}>
          <TemplateSlider templates={TEMPLATES} onSelect={setTemplate} />
        </View>
      )}
      {/* Capture button and controls - Only show if we have camera permission */}
      {hasCameraPermission && (
        <View style={styles.bottomControls}>
          {/* <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setTimerSec(timerSec === 0 ? 3 : timerSec === 3 ? 5 : 0)}
          >
            <View style={{ alignItems: 'center' }}>
              <Icon  name="timer" size={22} color="#fff" />
              {timerSec !== 0 && <Text style={styles.iconSubText}>{`${timerSec}s`}</Text>}
            </View>
          </TouchableOpacity> */}
            <TouchableOpacity
          style={styles.sideButton}
          onPress={() =>
            setTimerSec(timerSec === 0 ? 3 : timerSec === 3 ? 5 : 0)
          }
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
          {/* <TouchableOpacity
            style={styles.sideButton}
            onPress={() => pickImage()}
          >
            <Icon name="photo-library" size={32} color="#fff" />
          </TouchableOpacity> */}
            <TouchableOpacity
              style={styles.captureBtnWrapper}
          onPress={onCapture}
          disabled={processing || !cameraReady}
        >
           <View style={styles.captureBtnOuter}>
            <View style={styles.captureBtnInner} />
          </View>
        </TouchableOpacity>
          {/* <CaptureButton onPress={onCapture} disabled={!cameraReady} /> */}

          <TouchableOpacity
            style={styles.sideButton}
            onPress={() =>
              setCameraPosition(prev => (prev === 'front' ? 'back' : 'front'))
            }
          >
            <Icon name="cached" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Final Preview Overlay */}
      {showPreview && finalImageUri && (
        <View style={styles.previewOverlay}>
          <Image
            source={{ uri: finalImageUri }}
            style={styles.fullPreviewImage}
            resizeMode="contain"
          />
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.previewBtn}
              onPress={() => {
                setShowPreview(false);
                setFinalImageUri(null);
              }}
            >
              <Icon name="close" size={30} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.previewBtn, { backgroundColor: '#4CAF50' }]}
              onPress={handleConfirmSave}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Icon name="check" size={30} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
            </View>
      )}
          {/* Processing Indicator */}
          {processing && (
            <View style={StyleSheet.absoluteFill}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <ActivityIndicator size="large" color="#ffffff" />
                <Text
                  style={{ color: 'white', marginTop: 20, fontWeight: 'bold' }}
                >
                  Enhancing Image...
                </Text>
              </View>
            </View>
          )}
        </View>
    //   )}
    // </View>
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
  // Permission UI styles
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 20,
  },
  permissionText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionSubText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: '#5856D6',
  },
});
