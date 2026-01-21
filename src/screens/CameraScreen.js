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

//           previewCapturePath = await viewShotRef.current.capture({ format: 'jpg', quality: 0.6 });
//           // Cleanup
//           setPreviewImageUri(null);
//           setIsCapturingPreview(false);
//           setPreviewLoaded(false);
//         }
//       } catch (err) {
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
import { uploadToApi, shareApi } from '../services/UploadApi';
import CameraView from '../components/CameraView';
import TemplateOverlay from '../components/TemplateOverlay';
import TemplateSlider from '../components/TemplateSlider';
import { mergeCameraWithTemplate } from '../services/ImageMergeService';
import { saveToGallery } from '../services/GalleryService';
import { TEMPLATES } from '../constants/templates';
import { fetchTemplates, transformApiTemplate } from '../services/TemplateService';
import CaptureButton from '../components/CaptureButton';
import NetInfo from '@react-native-community/netinfo';
import { processQueue } from '../services/OfflineUploadQueue';
import { uploadWithOfflineQueue } from '../services/ApiUploadService';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PERMISSIONS, RESULTS, request, check } from 'react-native-permissions';
import { Easing, Animated as RNAnimated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { PanResponder } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VideoCameraView from '../components/VideoCameraView';
import VideoFilterSelector from '../components/VideoFilterSelector';
import VideoPlayer from '../components/VideoPlayer';
// Camera permissions based on platform
const CAMERA_PERMISSION = Platform.select({
  ios: PERMISSIONS.IOS.CAMERA,
  android: PERMISSIONS.ANDROID.CAMERA,
});

// Constants for better code maintainability
const Z_INDEX = {
  CAMERA: 0,
  LOADING: 100,
  PREVIEW: 200,
  COUNTDOWN: 300,
};

const TIMEOUTS = {
  PREVIEW_LOAD: 900,
  SNAPSHOT_CLEAR: 50,
};

const QUALITY = {
  PREVIEW: 0.6,
  INSTANT_SNAPSHOT: 0.95,
  FINAL: 1.0,
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const cameraHeight = (screenWidth * 4) / 3;
const SHEET_CLOSED = screenHeight / 2;
const SHEET_OPEN = 0;

export default function CameraScreen({ navigation, route }) {
  const cameraRef = useRef(null);
  const viewShotRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const isCapturingRef = useRef(false);
  const [templates, setTemplates] = useState(TEMPLATES);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState(null);
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [videoTemplates, setVideoTemplates] = useState([]);
  const [videoTemplatesLoading, setVideoTemplatesLoading] = useState(false);
  const [hasVideoTemplates, setHasVideoTemplates] = useState(false);
  const [selectedVideoTemplate, setSelectedVideoTemplate] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [typeShare, setTypeShare] = useState("whatsapp");
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
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  const [shareSuccess, setShareSuccess] = useState(false);
  const user =
    route && route.params && route.params.user ? route.params.user : {};
  const [accessType, setAccessType] = useState(null); // Will be determined from backend
  const [debugPanelVisible, setDebugPanelVisible] = useState(false);
  
  // Video recording states
  const videoCameraRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoUri, setVideoUri] = useState(null);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [capturedVideo, setCapturedVideo] = useState(null);
  const recordingFpsRef = useRef(30); // Default to 30fps
  const [selectedVideoFilter, setSelectedVideoFilter] = useState('none');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingDurationRef = useRef(null);
  const [videoSpeed, setVideoSpeed] = useState('normal'); // 'normal', 'slow' for slow motion
  const [slowMotionSegments, setSlowMotionSegments] = useState([]); // Array of {start, end} timestamps
  const slowMotionSegmentsRef = useRef([]); // Ref to track segments for callbacks
  const [isSlowMotionActive, setIsSlowMotionActive] = useState(false); // Current slow motion state during recording
  const recordingStartTimeRef = useRef(null); // Track when recording started
  const [debugPayload, setDebugPayload] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [lastUploadResult, setLastUploadResult] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation Values
  const sheetTranslateY = useRef(new RNAnimated.Value(SHEET_CLOSED)).current;
  const sheetOpacity = useRef(new RNAnimated.Value(0)).current;

  const animateSheetIn = () => {
    RNAnimated.parallel([
      RNAnimated.timing(sheetTranslateY, {
        toValue: SHEET_OPEN,
        duration: 300,
        //easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      RNAnimated.timing(sheetOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateSheetOut = (callback) => {
    RNAnimated.parallel([
      RNAnimated.timing(sheetTranslateY, {
        toValue: SHEET_CLOSED,
        duration: 300,
        //easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      RNAnimated.timing(sheetOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (callback) callback();
    });
  };
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,

      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          sheetTranslateY.setValue(Math.max(SHEET_OPEN, gesture.dy));
        } else {
          // dragging DOWN
          sheetTranslateY.setValue(
            Math.min(SHEET_CLOSED, gesture.dy)
          );
        }
      },

      onPanResponderRelease: (_, gesture) => {
        // If dragged up enough → OPEN
        if (gesture.dy < -80) {
          animateSheetIn();
        }
        // If dragged down enough → CLOSE
        else if (gesture.dy > 80) {
          animateSheetOut();
        }
        // Otherwise snap back
        else {
          animateSheetIn();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (showSuccessPopup || showSharePopup) {
      animateSheetIn();
    }
  }, [showSuccessPopup, showSharePopup]);

  // Load accessType from session on mount
  useEffect(() => {
    const loadAccessType = async () => {
      try {
        // First, check if accessType was selected from the selection screen
        const selectedAccessType = route.params?.selectedAccessType;
        if (selectedAccessType) {
          setAccessType(selectedAccessType);
          return;
        }

        const session = await AsyncStorage.getItem('user_session');
        let accessTypeArray = null;
        console.log('session', session);
        if (session) {
          const sessionData = JSON.parse(session);
          // accessType is an array in the backend
          accessTypeArray = sessionData?.accessType || sessionData?.access_type || null;
        }
        
        // Fallback to user object from route params
        if (!accessTypeArray && (user?.accessType || user?.access_type)) {
          accessTypeArray = user.accessType || user.access_type;
        }
        
        // Handle accessType as array - determine if it contains 'photomerge' or 'videomerge'
        if (Array.isArray(accessTypeArray) && accessTypeArray.length > 0) {
          // Check if array contains 'videomerge' (priority), otherwise 'photomerge'
          if (accessTypeArray.some(type => 
            type && typeof type === 'string' && type.toLowerCase().includes('video')
          )) {
            setAccessType('videomerge');
          } else if (accessTypeArray.some(type => 
            type && typeof type === 'string' && type.toLowerCase().includes('photo')
          )) {
            setAccessType('photomerge');
          } else {
            // Default to first item in array or 'photomerge'
            const firstType = accessTypeArray[0];
            setAccessType(
              firstType && typeof firstType === 'string' 
                ? firstType.toLowerCase() 
                : 'photomerge'
            );
          }
        } else if (typeof accessTypeArray === 'string') {
          // Handle as string (backward compatibility)
          const normalized = accessTypeArray.toLowerCase();
          setAccessType(
            normalized.includes('video') ? 'videomerge' : 
            normalized.includes('photo') ? 'photomerge' : 
            'photomerge'
          );
        } else {
          // Default to photomerge if no accessType found
          setAccessType('photomerge');
        }
      } catch (e) {
        console.error('Failed to load accessType:', e);
        // Default to photomerge on error
        setAccessType('photomerge');
      }
    };
    loadAccessType();
  }, [route.params?.selectedAccessType]);

  // Check and request camera permission on mount
  useEffect(() => {
    checkCameraPermission();
  }, []);

  // Fetch PHOTO templates only when on photomerge
  useEffect(() => {
    const loadTemplates = async () => {
      if (accessType !== 'photomerge') {
        return;
      }
      try {
        setTemplatesLoading(true);
        setTemplatesError(null);

        // Fetch templates with filters from user details
        const apiTemplates = await fetchTemplates({
          source: 'photo merge app',
          adminid: user?.adminid,
          branchid: user?.branchid
        });

        if (apiTemplates && apiTemplates.length > 0) {
          // Transform API templates to app template format and flatten if multiple photos per template
          const transformedTemplates = apiTemplates.flatMap(transformApiTemplate);
          setTemplates(transformedTemplates);

          // Set first template as selected if available
          if (transformedTemplates.length > 0) {
            setTemplate(transformedTemplates[0]);
          }
        } else {
          // If no templates from API, show alert and navigate to Login when OK is pressed
          Alert.alert(
            'No Templates Found',
            'There are no templates available for your account. Please contact your admin to create templates for your branch.',
            [{
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }]
          );
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
        setTemplatesError(error.message);
        // Keep using local TEMPLATES as fallback
      } finally {
        setTemplatesLoading(false);
      }
    };

    loadTemplates();
  }, [accessType, user?.adminid, user?.branchid]);

  // Load video templates when accessType is videomerge
  useEffect(() => {
    const loadVideoTemplates = async () => {
      if (accessType !== 'videomerge') {
        // Reset video templates state when switching away
        setHasVideoTemplates(false);
        setVideoTemplates([]);
        return;
      }

      try {
        setVideoTemplatesLoading(true);
        setHasVideoTemplates(false);

        // Try multiple source variants to match backend case sensitivity
        const sourceVariants = ['video merge app', 'Video Merge App', 'VIDEO MERGE APP'];
        let apiTemplates = [];

        // 1) source + admin + branch
        for (const src of sourceVariants) {
          apiTemplates = await fetchTemplates({
            source: src,
            adminid: user?.adminid,
            branchid: user?.branchid
          });
          console.log('[VideoTemplates] fetched with source/admin/branch', src, user?.adminid, user?.branchid, 'count:', apiTemplates?.length || 0);
          if (apiTemplates && apiTemplates.length > 0) {
            break;
          }
        }

        // 2) source only (if first pass empty)
        if (!apiTemplates || apiTemplates.length === 0) {
          for (const src of sourceVariants) {
            apiTemplates = await fetchTemplates({ source: src });
            console.log('[VideoTemplates] fetched with source only', src, 'count:', apiTemplates?.length || 0);
            if (apiTemplates && apiTemplates.length > 0) {
              break;
            }
          }
        }

        // 3) admin/branch only (no source)
        if (!apiTemplates || apiTemplates.length === 0) {
          apiTemplates = await fetchTemplates({
            adminid: user?.adminid,
            branchid: user?.branchid
          });
          console.log('[VideoTemplates] fetched with admin/branch only', user?.adminid, user?.branchid, 'count:', apiTemplates?.length || 0);
        }

        // 4) no filters at all as final fallback
        if (!apiTemplates || apiTemplates.length === 0) {
          apiTemplates = await fetchTemplates();
          console.log('[VideoTemplates] fetched with no filters, count:', apiTemplates?.length || 0);
        }

        if (apiTemplates && apiTemplates.length > 0) {
          console.log('[VideoTemplates] Raw API response:', JSON.stringify(apiTemplates, null, 2));
          const transformedTemplates = apiTemplates.flatMap(transformApiTemplate);
          console.log('[VideoTemplates] Transformed templates:', transformedTemplates.length, JSON.stringify(transformedTemplates, null, 2));
          
          if (transformedTemplates.length > 0) {
            setVideoTemplates(transformedTemplates);
            setHasVideoTemplates(true);
            // Set first template as selected if available
            console.log('[VideoTemplates] Setting selected template:', transformedTemplates[0]);
            setSelectedVideoTemplate(transformedTemplates[0]);
            console.log('[VideoTemplates] State updated - hasVideoTemplates: true, templates count:', transformedTemplates.length);
          } else {
            console.warn('[VideoTemplates] Templates found but transformation resulted in empty array');
            setHasVideoTemplates(false);
          }
        } else {
          // If no video templates from API, show alert
          console.log('[VideoTemplates] No templates found, setting hasVideoTemplates to false');
          setHasVideoTemplates(false);
          Alert.alert(
            'No Video Templates Found',
            'There are no video templates available for your account. Please contact your admin to create video templates for your branch.',
            [{
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }]
          );
        }
      } catch (error) {
        console.error('Failed to fetch video templates:', error);
        setHasVideoTemplates(false);
        Alert.alert(
          'Error Loading Templates',
          'Failed to load video templates. Please contact your admin to create video templates for your branch.',
          [{
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }]
        );
      } finally {
        setVideoTemplatesLoading(false);
      }
    };

    loadVideoTemplates();
  }, [accessType, user?.adminid, user?.branchid]);

  // Refresh handler for templates
  const onRefreshTemplates = async () => {
    setRefreshing(true);
    try {
      setTemplatesLoading(true);
      setTemplatesError(null);

      const apiTemplates = await fetchTemplates({
        source: 'photo merge app',
        adminid: user?.adminid,
        branchid: user?.branchid
      });

      if (apiTemplates && apiTemplates.length > 0) {
        const transformedTemplates = apiTemplates.flatMap(transformApiTemplate);
        setTemplates(transformedTemplates);
        if (transformedTemplates.length > 0) {
          setTemplate(transformedTemplates[0]);
        }
      }
    } catch (error) {
      console.error('Failed to refresh templates:', error);
      setTemplatesError(error.message);
    } finally {
      setTemplatesLoading(false);
      setRefreshing(false);
    }
  };


  const checkCameraPermission = async () => {
    try {
      const result = await check(CAMERA_PERMISSION);

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
  const handleShare = async (type) => {
    try {
      setTypeShare(type);
      setIsSaving(true);
      
      // Check if lastUploadResult exists and has required properties
      if (!lastUploadResult) {
        Alert.alert('Error', 'No upload result available. Please save the video first.');
        setIsSaving(false);
        return;
      }
      
      // Use posterVideoId if available, otherwise fall back to _id or id
      const videoId = lastUploadResult.posterVideoId || lastUploadResult._id || lastUploadResult.id;
      if (!videoId) {
        Alert.alert('Error', 'Video ID not found. Please try saving again.');
        setIsSaving(false);
        return;
      }
      
      const pageUrl = `https://app.bilimbebrandactivations.com/photomergeapp/share/${videoId}`;

      // 1️⃣ Call backend share API FIRST
      await shareApi(
        type,
        pageUrl,
        user?.whatsapp,
        lastUploadResult._id || lastUploadResult.id,
        user?.name,
        user?.email
      );

      // 2️⃣ Open native share with IMAGE
      // const shareOptions = {
      //   title: 'My Photo',
      //   message: 'Check out my photo',
      //   url: finalImageUri, // local image path
      //   social:
      //     type === 'whatsapp'
      //       ? Share.Social.WHATSAPP
      //       : Share.Social.EMAIL,
      // };
      setShareSuccess(true);
      // 3️⃣ Close sheet + cleanup
      // animateSheetOut(() => {
      //   setShowSuccessPopup(false);
      //   navigation.navigate('Login');

      //   setTimeout(() => {
      //     setShowPreview(false);
      //     setFinalImageUri(null);
      //     setCapturedPhoto(null);
      //     setLastUploadResult(null);
      //   }, 500);
      // });

    } catch (err) {
      console.error('Sharing failed:', err);
      Alert.alert('Error', 'Unable to share right now');
    } finally {
      setIsSaving(false);
    }
  };
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // reset overlay measurements when camera switches
    setOverlayLayout(null);
  }, [cameraPosition]);

  // Cleanup countdown timer on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, []);

  const performCapture = async () => {
    // Prevent multiple simultaneous captures
    if (isCapturingRef.current || !cameraReady || !hasCameraPermission || processing) {
      return;
    }

    // Double-check permission before capture
    const permissionStatus = await check(CAMERA_PERMISSION);
    if (permissionStatus !== RESULTS.GRANTED) {
      showPermissionRequiredAlert();
      setProcessing(false);
      return;
    }

    // Check if camera ref is still valid
    if (!cameraRef.current) {
      console.error('Camera ref is null');
      setProcessing(false);
      isCapturingRef.current = false;
      return;
    }

    isCapturingRef.current = true;

    try {
      // 1. Take a full-resolution photo (4:3) with high quality
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'quality',
      });
      
      // Set initial photo URI for preview
      setFinalImageUri(`file://${photo.path}`);
      setProcessing(true);
      
      // For front-camera high-res merges, capture a small preview image
      let previewCapturePath = null;
      try {
        if (cameraPosition === 'front' && viewShotRef.current) {
          setIsCapturingPreview(true);
          setPreviewLoaded(false);
          setPreviewImageUri(`file://${photo.path}`);
          
          // Wait for the preview Image to load (or timeout)
          const loaded = await new Promise(resolve => {
            previewLoadResolver.current = resolve;
            // Safety timeout
            setTimeout(() => {
              if (previewLoadResolver.current) {
                previewLoadResolver.current(false);
                previewLoadResolver.current = null;
              }
            }, TIMEOUTS.PREVIEW_LOAD);
          });
          
          previewCapturePath = await viewShotRef.current.capture({
            format: 'jpg',
            quality: QUALITY.PREVIEW, // Lower quality for preview only
          });
          
          // Cleanup
          setPreviewImageUri(null);
          setIsCapturingPreview(false);
          setPreviewLoaded(false);
        }
      } catch (err) {
        console.warn('Preview capture failed:', err);
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

      // Debug: capture the exact payload we'll pass to native
      if (__DEV__) {
        setDebugPayload({
          photoPath: photo.path,
          templateId: template.id,
          overlay: overlayRect,
          previewPath: previewCapturePath,
        });
      }

      // Merge camera photo with template (high quality)
      const mergedPath = await mergeCameraWithTemplate(
        photo.path,
        template,
        overlayRect,
        previewCapturePath,
      );
      
      const uploadPhoto = {
        uri: `file://${mergedPath}`,
        name: `photo_${Date.now()}.png`,
        type: 'image/png',
      };

      // Show preview and let user confirm (tick) to save/upload
      setFinalImageUri(`file://${mergedPath}`);
      setCapturedPhoto(uploadPhoto);
      setShowPreview(true);
    } catch (e) {
      console.error('Capture error:', e);
      Alert.alert('Error', e.message || 'Failed to capture photo. Please try again.');
      // Reset all states on error
      setProcessing(false);
      setFinalImageUri(null);
      setShowPreview(false);
      setCountdown(0);
      setCapturedPhoto(null);
      // Clear countdown interval if active
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    } finally {
      setProcessing(false);
      isCapturingRef.current = false;
    }
  };

  const onCapture = () => {
    // Check permission before starting capture
    if (!hasCameraPermission) {
      showPermissionRequiredAlert();
      return;
    }

    // Prevent multiple clicks during countdown or capture
    if (countdown > 0 || isCapturingRef.current || processing) {
      return;
    }

    if (timerSec > 0) {
      // Start countdown timer first (camera stays visible during countdown)
      setCountdown(timerSec);
      let t = timerSec;
      
      // Clear any existing interval
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      
      countdownIntervalRef.current = setInterval(() => {
        t -= 1;
        setCountdown(t);
        if (t <= 0) {
          // Clear interval
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          setCountdown(0);
          // Freeze camera and capture when countdown reaches 0
          setProcessing(true);
          performCapture();
        }
      }, 1000);
    } else {
      // No timer - freeze camera immediately and capture
      setProcessing(true);
      performCapture();
    }
  };

  // Toggle slow motion during recording
  const toggleSlowMotionDuringRecording = () => {
    console.log('[Recording] Toggle slow motion called', {
      isRecording,
      hasRecordingStartTime: !!recordingStartTimeRef.current,
      isSlowMotionActive,
      currentSegments: slowMotionSegmentsRef.current.length
    });
    
    if (!isRecording || !recordingStartTimeRef.current) {
      console.warn('[Recording] Cannot toggle slow motion - not recording or no start time');
      return;
    }
    
    const currentTime = Date.now();
    const elapsedSeconds = (currentTime - recordingStartTimeRef.current) / 1000;
    
    if (isSlowMotionActive) {
      // Ending slow motion segment
      setSlowMotionSegments(prev => {
        const updated = [...prev];
        if (updated.length > 0 && updated[updated.length - 1].end === null) {
          updated[updated.length - 1].end = elapsedSeconds;
          console.log(`[Recording] Closing segment: ${updated[updated.length - 1].start.toFixed(2)}s - ${elapsedSeconds.toFixed(2)}s`);
        } else {
          console.warn('[Recording] No open segment to close');
        }
        slowMotionSegmentsRef.current = updated; // Update ref
        console.log('[Recording] Updated segments (ref):', slowMotionSegmentsRef.current);
        return updated;
      });
      setIsSlowMotionActive(false);
      console.log(`[Recording] ✓ Slow motion ended at ${elapsedSeconds.toFixed(2)}s`);
    } else {
      // Starting slow motion segment
      setSlowMotionSegments(prev => {
        const updated = [...prev, { start: elapsedSeconds, end: null }];
        slowMotionSegmentsRef.current = updated; // Update ref
        console.log('[Recording] Added new segment:', { start: elapsedSeconds, end: null });
        console.log('[Recording] Updated segments (ref):', slowMotionSegmentsRef.current);
        return updated;
      });
      setIsSlowMotionActive(true);
      console.log(`[Recording] ✓ Slow motion started at ${elapsedSeconds.toFixed(2)}s`);
    }
  };

  // Video recording handlers
  const startVideoRecording = async () => {
    if (!videoCameraRef.current || isRecording) return;

    try {
      setIsRecording(true);
      setRecordingDuration(0);
      setSlowMotionSegments([]);
      slowMotionSegmentsRef.current = []; // Clear ref
      setIsSlowMotionActive(false);
      recordingStartTimeRef.current = Date.now();
      
      // Start duration timer
      recordingDurationRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Get the camera format FPS for slow motion calculation
      const cameraFps = videoCameraRef.current?.getFps?.() || 30;
      recordingFpsRef.current = cameraFps;
      console.log(`[Recording] Starting video recording at ${cameraFps}fps (slow motion segments can be added during recording)`);
      
      // Always record at high FPS if available (for slow motion capability)
      // Format is already selected in VideoCameraView - we'll use high FPS format
      // No videoResolution specified - uses format's natural resolution to preserve aspect ratio
      await videoCameraRef.current.startRecording({
        flash: 'off',
        videoCodec: 'h264',
        videoBitRate: 'high', // Use high bitrate for better quality
        // Don't specify videoResolution - let it use the format's natural dimensions
        // This preserves portrait/landscape aspect ratio as recorded
        onRecordingFinished: (video) => {
          const videoPath = `file://${video.path}`;
          
          // Calculate actual recording duration from start time
          const actualDuration = recordingStartTimeRef.current 
            ? (Date.now() - recordingStartTimeRef.current) / 1000 
            : (recordingDuration || 0);
          
          // Log video dimensions to verify orientation
          const videoWidth = video.width || 'unknown';
          const videoHeight = video.height || 'unknown';
          const videoOrientation = videoWidth !== 'unknown' && videoHeight !== 'unknown' 
            ? (videoHeight > videoWidth ? 'Portrait' : 'Landscape')
            : 'unknown';
          const videoAspectRatio = videoWidth !== 'unknown' && videoHeight !== 'unknown'
            ? (videoWidth / videoHeight).toFixed(2)
            : 'unknown';
          
          console.log('[CameraScreen] Recording finished - Video info:', {
            dimensions: `${videoWidth}x${videoHeight}`,
            orientation: videoOrientation,
            aspectRatio: videoAspectRatio,
            duration: video.duration || 'unknown',
            path: video.path
          });
          
          // Use ref to get latest segments (always up-to-date)
          const currentSegments = slowMotionSegmentsRef.current.length > 0 
            ? slowMotionSegmentsRef.current 
            : slowMotionSegments; // Fallback to state if ref is empty
          
          console.log('[CameraScreen] Recording finished - Raw data:', {
            refSegments: slowMotionSegmentsRef.current,
            stateSegments: slowMotionSegments,
            currentSegments: currentSegments,
            recordingDurationState: recordingDuration,
            actualDuration: actualDuration,
            videoDuration: video.duration || 'unknown'
          });
          
          // Close any open slow motion segments and validate them
          const finalSegments = [...currentSegments]
            .map(seg => {
              // Ensure start is valid
              if (seg.start === null || seg.start === undefined || isNaN(seg.start)) {
                console.warn('[CameraScreen] Invalid segment start:', seg);
                return null;
              }
              
              // Close open segments - use actual duration or video duration
              let end = seg.end;
              if (end === null || end === undefined) {
                // Use actual calculated duration or video duration if available
                end = video.duration ? video.duration / 1000 : actualDuration;
                console.log(`[CameraScreen] Closing open segment: ${seg.start.toFixed(2)}s - ${end.toFixed(2)}s`);
              }
              
              // Validate end time
              if (end === null || end === undefined || isNaN(end)) {
                end = actualDuration; // Default to actual duration
              }
              
              // Ensure end is after start
              if (end <= seg.start) {
                console.warn('[CameraScreen] Invalid segment: end <= start, skipping:', { start: seg.start, end });
                return null;
              }
              
              // Don't clamp to duration - use actual end time
              return {
                start: Math.max(0, seg.start),
                end: end
              };
            })
            .filter(seg => seg !== null && seg.start < seg.end); // Remove invalid segments
          
          const hasSlowMotionSegments = finalSegments.length > 0;
          
          console.log('[CameraScreen] Recording finished. Slow motion segments:', finalSegments);
          console.log('[CameraScreen] Recording duration (state):', recordingDuration);
          console.log('[CameraScreen] Actual duration (calculated):', actualDuration);
          console.log('[CameraScreen] Validated segments count:', finalSegments.length);
          
          setVideoUri(videoPath);
          setCapturedVideo({
            uri: videoPath,
            name: `video_${Date.now()}_${hasSlowMotionSegments ? 'slomo' : 'normal'}.mp4`,
            type: 'video/mp4',
            isSlowMotion: hasSlowMotionSegments || videoSpeed === 'slow',
            videoSpeed: hasSlowMotionSegments ? 'slow' : videoSpeed,
            slowMotionSegments: finalSegments,
            recordingFps: recordingFpsRef.current, // Store the FPS used for recording
            width: videoWidth !== 'unknown' ? videoWidth : undefined,
            height: videoHeight !== 'unknown' ? videoHeight : undefined,
            orientation: videoOrientation !== 'unknown' ? videoOrientation : undefined,
          });
          setShowVideoPreview(true);
          setIsRecording(false);
          if (recordingDurationRef.current) {
            clearInterval(recordingDurationRef.current);
            recordingDurationRef.current = null;
          }
        },
        onRecordingError: (error) => {
          console.error('Recording error:', error);
          Alert.alert('Error', 'Failed to record video');
          setIsRecording(false);
          setShowVideoPreview(false);
          setVideoUri(null);
          setCapturedVideo(null);
          setSlowMotionSegments([]);
          slowMotionSegmentsRef.current = []; // Clear ref
          setIsSlowMotionActive(false);
          recordingStartTimeRef.current = null;
          if (recordingDurationRef.current) {
            clearInterval(recordingDurationRef.current);
            recordingDurationRef.current = null;
          }
        },
      });
    } catch (error) {
      console.error('Start recording error:', error);
      Alert.alert('Error', 'Failed to start recording');
      setIsRecording(false);
      setSlowMotionSegments([]);
      slowMotionSegmentsRef.current = []; // Clear ref
      setIsSlowMotionActive(false);
      recordingStartTimeRef.current = null;
      if (recordingDurationRef.current) {
        clearInterval(recordingDurationRef.current);
        recordingDurationRef.current = null;
      }
    }
  };

  const stopVideoRecording = async () => {
    if (!videoCameraRef.current || !isRecording) return;

    try {
      // Close any open slow motion segment before stopping
      if (isSlowMotionActive && slowMotionSegments.length > 0) {
        const finalSegments = [...slowMotionSegments];
        if (finalSegments[finalSegments.length - 1].end === null) {
          finalSegments[finalSegments.length - 1].end = recordingDuration;
        }
        setSlowMotionSegments(finalSegments);
        setIsSlowMotionActive(false);
      }
      
      await videoCameraRef.current.stopRecording();
      setIsRecording(false);
      recordingStartTimeRef.current = null;
      if (recordingDurationRef.current) {
        clearInterval(recordingDurationRef.current);
        recordingDurationRef.current = null;
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      Alert.alert('Error', 'Failed to stop recording');
      setIsRecording(false);
      recordingStartTimeRef.current = null;
      if (recordingDurationRef.current) {
        clearInterval(recordingDurationRef.current);
        recordingDurationRef.current = null;
      }
    }
  };

  // Cleanup video recording timer
  useEffect(() => {
    return () => {
      if (recordingDurationRef.current) {
        clearInterval(recordingDurationRef.current);
        recordingDurationRef.current = null;
      }
    };
  }, []);

  const renderVideoContent = () => {
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
          <Icon name="no-photography" size={80} color="#fff" />
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

    // Video preview will be handled in the main render (similar to photo preview)

    // Live video camera view
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <View
          style={[
            StyleSheet.absoluteFill,
            { zIndex: Z_INDEX.CAMERA },
            (showVideoPreview) && {
              opacity: 0,
              pointerEvents: 'none',
              transform: [{ scale: 0.01 }],
            }
          ]}
          collapsable={false}
        >
          <VideoCameraView
            key={`video-camera-${videoSpeed}-${cameraPosition}`}
            ref={videoCameraRef}
            cameraPosition={cameraPosition}
            filter={selectedVideoFilter}
            slowMotion={videoSpeed === 'slow'}
            onReady={() => setCameraReady(true)}
          />
        </View>
        
        {/* Recording indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>
              {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
            </Text>
            {isSlowMotionActive && (
              <View style={styles.slowMotionIndicator}>
                <MaterialCommunityIcons name="speedometer" size={16} color="#ff3b30" />
                <Text style={styles.slowMotionText}>SLOW MO</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
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
          <Icon name="no-photography" size={80} color="#fff" />
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
    // If processing OR preview exists → show captured photo instead of camera
    // if ((processing || showPreview) && finalImageUri) {
    //   return (
    //     <View style={{ flex: 1, backgroundColor: '#000' }}>
    //       <Image
    //         source={{ uri: finalImageUri }}
    //         style={{ flex: 1 }}
    //         resizeMode="contain"
    //       />
    //       {/* 🔥 TEMPLATE ON TOP OF CAPTURED IMAGE */}
    //       <TemplateOverlay
    //         template={template.src}
    //         absolute
    //       />
    //     </View>
    //   );
    // }

    //     return (
    //       <View style={{ flex: 1, backgroundColor: '#000' }}>
    //         <CameraView
    //           ref={cameraRef}
    //           cameraPosition={cameraPosition}
    //           onReady={() => setCameraReady(true)}
    //         />
    //         <TemplateOverlay
    //           template={template.src}
    //           onLayoutOverlay={layout => setOverlayLayout(layout)}
    //           absolute
    //         />
    //       </View>
    //     );
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Camera view - keep mounted but hidden when processing to maintain ref */}
        <View
            style={[
              StyleSheet.absoluteFill,
              { zIndex: Z_INDEX.CAMERA },
              (processing || showPreview) && {
                opacity: 0,
                pointerEvents: 'none',
                transform: [{ scale: 0.01 }], // Hide by scaling down
              }
            ]}
          collapsable={false}
        >
          <CameraView
            ref={cameraRef}
            cameraPosition={cameraPosition}
            onReady={() => setCameraReady(true)}
          />
        </View>

        {/* Loading message while waiting for photo (processing but no finalImageUri yet) */}
        {processing && !finalImageUri && (
          <View style={[StyleSheet.absoluteFill, { 
            backgroundColor: '#000', 
            zIndex: Z_INDEX.LOADING,
            justifyContent: 'center',
            alignItems: 'center',
          }]}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{
              color: '#fff',
              fontSize: 18,
              marginTop: 20,
              fontWeight: '600',
            }}>
              Wait for capture the photo...
            </Text>
          </View>
        )}

        {/* 🔥 FREEZE FRAME OVER CAMERA - Show captured photo */}
        {(processing || showPreview) && finalImageUri && (
          <View style={[StyleSheet.absoluteFill, { zIndex: Z_INDEX.PREVIEW }]}>
            <Image
              source={{ uri: finalImageUri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />

            {/* Template overlay */}
            <TemplateOverlay
              template={template.src}
              absolute
            />
          </View>
        )}

        {/* Normal live template */}
        {!processing && !showPreview && (
          <TemplateOverlay
            template={template.src}
            onLayoutOverlay={layout => setOverlayLayout(layout)}
            absolute
          />
        )}
      </View>

    )
  };


  const handleConfirmSave = async () => {
    try {
      setIsSaving(true);
      let uploadResult;
      // 1️⃣ Save locally first
      await saveToGallery(finalImageUri);
      // 2️⃣ Upload to backend
      const metadata = {
        clientName: user?.name || '',
        email: user?.email || '',
        whatsapp: user?.whatsapp || '',
        template_name: template?.templatename || template?._id || 'birthday_template_1',
        source: 'Photo Merge App',
        adminid: user?.adminid || '',
        branchid: user?.branchid || '',
      };

      if (capturedPhoto && capturedPhoto.uri) {
        uploadResult = await uploadToApi(capturedPhoto, metadata);
        setLastUploadResult(uploadResult.media);
      } else {
        console.warn('[CameraScreen] No capturedPhoto available, skipping upload');
        Alert.alert('Saved', 'Photo saved locally. Upload skipped (no photo data).');
      }
    } catch (e) {
      console.error('[CameraScreen] Save/Upload error:', {
        message: e.message,
        stack: e.stack,
      });

      // Provide more specific error message
      let errorMessage = 'Upload failed. Photo saved locally.';
      if (e.message?.includes('File does not exist')) {
        errorMessage = 'Upload failed: Photo file not found. Photo saved locally.';
      } else if (e.message?.includes('network') || e.message?.includes('timeout')) {
        errorMessage = 'Upload failed: Network error. Photo saved locally and will retry when online.';
      } else if (e.message?.includes('Invalid file path')) {
        errorMessage = 'Upload failed: Invalid file. Photo saved locally.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
      // Show success popup regardless of upload result (photo is saved locally)
      setShowSuccessPopup(true);
    }
  };

  const handleConfirmSaveVideo = async () => {
    try {
      setIsSaving(true);
      let uploadResult;
      
      // Check if we have slow motion segments
      const hasSlowMotionSegments = capturedVideo?.slowMotionSegments && capturedVideo.slowMotionSegments.length > 0;
      const isSlowMo = hasSlowMotionSegments || videoSpeed === 'slow' || capturedVideo?.isSlowMotion || false;
      
      let videoToSave = videoUri; // Default to original video
      
      // Process video if we have slow motion segments
      // NOTE: Currently video processing is not implemented, so original video is saved
      // The preview will show slow motion correctly, but saved video will be normal speed
      // To enable slow motion in saved videos, install react-native-ffmpeg
      if (hasSlowMotionSegments) {
        try {
          console.log('[CameraScreen] Attempting to process video with slow motion segments...');
          const { processVideoWithSlowMotion } = await import('../services/VideoProcessingService');
          videoToSave = await processVideoWithSlowMotion(videoUri, capturedVideo.slowMotionSegments);
          
          // Check if processing actually happened (if it returns original, processing didn't happen)
          if (videoToSave === videoUri) {
            console.warn('[CameraScreen] ⚠️ Video processing not available - saving original video');
            console.warn('[CameraScreen] Slow motion will work in preview but not in saved video');
            console.warn('[CameraScreen] To enable slow motion in saved videos, install react-native-ffmpeg');
          } else {
            console.log('[CameraScreen] Video processed successfully, saving to gallery:', videoToSave);
          }
        } catch (processingError) {
          console.warn('[CameraScreen] Video processing failed, saving original video:', processingError);
          // Continue with original video if processing fails
          videoToSave = videoUri;
        }
      }
      
      // 1️⃣ Save locally first
      if (isSlowMo) {
        console.log('[CameraScreen] Saving slow motion video to gallery');
      }
      await saveToGallery(videoToSave, 'video');
      // 2️⃣ Upload to backend (hasSlowMotionSegments already defined above)
      // Get template name if templates exist
      const templateName = hasVideoTemplates && selectedVideoTemplate 
        ? (selectedVideoTemplate.templatename || selectedVideoTemplate.name || 'video_recording')
        : 'video_recording';
      
      const metadata = {
        clientName: user?.name || '',
        email: user?.email || '',
        whatsapp: user?.whatsapp || '',
        template_name: templateName,
        source: 'video merge app',
        adminid: user?.adminid || '',
        branchid: user?.branchid || '',
        isSlowMotion: hasSlowMotionSegments || videoSpeed === 'slow' || capturedVideo?.isSlowMotion || false,
        videoSpeed: hasSlowMotionSegments ? 'slow' : (videoSpeed || capturedVideo?.videoSpeed || 'normal'),
        slowMotionSegments: hasSlowMotionSegments ? JSON.stringify(capturedVideo.slowMotionSegments) : '',
        hasTemplates: hasVideoTemplates, // Flag to indicate templates exist
      };
      
      console.log('[CameraScreen] Uploading video with metadata:', {
        isSlowMotion: metadata.isSlowMotion,
        videoSpeed: metadata.videoSpeed,
        segmentsCount: capturedVideo?.slowMotionSegments?.length || 0,
        segments: capturedVideo?.slowMotionSegments,
      });

      // Use processed video for upload if available, otherwise use original
      const videoForUpload = hasSlowMotionSegments && videoToSave !== videoUri 
        ? { ...capturedVideo, uri: videoToSave }
        : capturedVideo;

      if (videoForUpload && videoForUpload.uri) {
        uploadResult = await uploadToApi(videoForUpload, metadata);
        setLastUploadResult(uploadResult.media);
      } else {
        console.warn('[CameraScreen] No capturedVideo available, skipping upload');
        Alert.alert('Saved', 'Video saved locally. Upload skipped (no video data).');
      }
    } catch (e) {
      console.error('[CameraScreen] Video Save/Upload error:', {
        message: e.message,
        stack: e.stack,
      });

      // Provide more specific error message
      let errorMessage = 'Upload failed. Video saved locally.';
      if (e.message?.includes('File does not exist')) {
        errorMessage = 'Upload failed: Video file not found. Video saved locally.';
      } else if (e.message?.includes('network') || e.message?.includes('timeout')) {
        errorMessage = 'Upload failed: Network error. Video saved locally and will retry when online.';
      } else if (e.message?.includes('Invalid file path')) {
        errorMessage = 'Upload failed: Invalid file. Video saved locally.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsSaving(false);
      // Show success popup regardless of upload result (video is saved locally)
      setShowSuccessPopup(true);
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
        {accessType === null ? (
          <View style={styles.permissionContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.permissionText}>Loading...</Text>
          </View>
        ) : accessType === 'videomerge' ? (
          (() => {
            console.log('[VideoTemplates] Render check - hasVideoTemplates:', hasVideoTemplates, 'videoTemplates.length:', videoTemplates.length, 'loading:', videoTemplatesLoading);
            return hasVideoTemplates ? renderVideoContent() : (
              <View style={styles.permissionContainer}>
                {videoTemplatesLoading ? (
                  <>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.permissionText}>Loading video templates...</Text>
                  </>
                ) : (
                  <>
                    <Icon name="video-library" size={80} color="#fff" />
                    <Text style={styles.permissionText}>No Video Templates Available</Text>
                    <Text style={styles.permissionSubText}>
                      Please contact your admin to create video templates for your branch.
                    </Text>
                    <TouchableOpacity
                      style={styles.permissionButton}
                    onPress={() => navigation.navigate('Login')}
                  >
                    <Text style={styles.permissionButtonText}>Go Back</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          );
          })()
        ) : renderCameraContent()}

        {/* Top controls - Only show if we have camera permission */}

        {/* Countdown overlay - Show on top of everything (only for photomerge) */}
        {accessType !== null && accessType === 'photomerge' && countdown > 0 && (
          <View style={[styles.countdownOverlay, { zIndex: Z_INDEX.COUNTDOWN }]} pointerEvents="none">
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}
      </View>

      {/* Template slider area - Only show for photomerge */}
      {hasCameraPermission && accessType !== null && accessType === 'photomerge' && (
        <View style={styles.sliderContainer}>
          {templatesLoading ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={styles.placeholderItem} />
              ))}
            </ScrollView>
          ) : template ? (
            <TemplateSlider templates={templates} onSelect={setTemplate} />
          ) : (
            <View style={styles.loaderContainer}>
         
            </View>
          )}
        </View>
      )}

      {/* Video filter selector - Only show for videomerge */}
      {/* {hasCameraPermission && accessType !== null && accessType === 'videomerge' && !showVideoPreview && (
        <VideoFilterSelector
          selectedFilter={selectedVideoFilter}
          onSelectFilter={setSelectedVideoFilter}
        />
      )} */}
      {/* Capture button and controls - Only show if we have camera permission */}
      {hasCameraPermission && (
        <View style={styles.bottomControls}>
          {(() => {
            console.log('[UI] Rendering controls - accessType:', accessType, 'hasCameraPermission:', hasCameraPermission);
            return null;
          })()}
          {accessType !== null && accessType === 'photomerge' ? (
            <>
              <TouchableOpacity
                style={styles.sideButton}
                onPress={() =>
                  setTimerSec(timerSec === 0 ? 3 : timerSec === 3 ? 5 : 0)
                }
              >
                <View style={{ position: 'relative' }}>
                  <Icon name="timer" size={28} color="#000" />
                  {timerSec !== 0 && (
                    <View style={styles.timerBadge}>
                      <Text style={styles.timerBadgeText}>{timerSec}</Text>
                    </View>
                  )}
                </View>
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
                onPress={() =>
                  setCameraPosition(prev => (prev === 'front' ? 'back' : 'front'))
                }
              >
                <Icon name="cached" size={32} color="#000" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.sideButton}
                onPress={() =>
                  setCameraPosition(prev => (prev === 'front' ? 'back' : 'front'))
                }
              >
                <Icon name="cached" size={32} color="#000" />
              </TouchableOpacity>
             
              <TouchableOpacity
                style={[
                  styles.videoRecordBtn,
                  isRecording && styles.recordingButton,
                ]}
                onPress={isRecording ? stopVideoRecording : startVideoRecording}
                disabled={!cameraReady}
              >
                {isRecording ? (
                  <View style={styles.recordingButtonInner}>
                    <View style={styles.stopIcon} />
                  </View>
                ) : (
                  <MaterialCommunityIcons name="video" size={40} color="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sideButton,
                  isRecording && isSlowMotionActive && { backgroundColor: 'rgba(255, 59, 48, 0.4)' }
                ]}
                onPress={() => {
                  console.log('[UI] Slow motion button pressed', { isRecording, isSlowMotionActive });
                  if (isRecording) {
                    // Toggle slow motion during recording
                    toggleSlowMotionDuringRecording();
                  } else {
                    // Toggle slow motion mode before recording
                    setVideoSpeed(videoSpeed === 'normal' ? 'slow' : 'normal');
                  }
                }}
                disabled={!isRecording && !cameraReady}
              >
                  <MaterialCommunityIcons 
                    name={(isRecording && isSlowMotionActive) || (!isRecording && videoSpeed === 'slow') ? 'speedometer' : 'speedometer-slow'} 
                    size={28} 
                    color={(isRecording && isSlowMotionActive) || (!isRecording && videoSpeed === 'slow') ? '#ff3b30' : '#000'} 
                  />
                  {((isRecording && isSlowMotionActive) || (!isRecording && videoSpeed === 'slow')) && (
                    <Text style={{ fontSize: 10, color: '#000', marginTop: 2, fontWeight: 'bold' }}>SLOMO</Text>
                  )}
                  {!isRecording && videoSpeed === 'normal' && (
                    <Text style={{ fontSize: 10, color: '#000', marginTop: 2, opacity: 0.7 }}>SLOMO</Text>
                  )}
                  {isRecording && slowMotionSegments.length > 0 && (
                    <View style={{ 
                      position: 'absolute', 
                      top: -5, 
                      right: -5, 
                      backgroundColor: '#ff3b30', 
                      borderRadius: 8, 
                      width: 16, 
                      height: 16, 
                      justifyContent: 'center', 
                      alignItems: 'center' 
                    }}>
                      <Text style={{ fontSize: 8, color: '#fff', fontWeight: 'bold' }}>
                        {slowMotionSegments.length}
                      </Text>
                    </View>
                  )}
               
              </TouchableOpacity>
              {/* <View style={styles.sideButton} /> */}
            </>
          )}
        </View>
      )}

      {/* Video Preview Overlay */}
      {showVideoPreview && videoUri && (
        <View style={styles.previewOverlay}>
          <View style={styles.fullPreviewImage}>
            {/* Video player with play controls */}
            <VideoPlayer 
              uri={videoUri}
              style={{ flex: 1 }}
              isSlowMotion={videoSpeed === 'slow' && (!capturedVideo?.slowMotionSegments || capturedVideo.slowMotionSegments.length === 0)}
              slowMotionSegments={(() => {
                const segments = capturedVideo?.slowMotionSegments || [];
                console.log('[CameraScreen] Passing segments to VideoPlayer:', {
                  segmentsCount: segments.length,
                  segments: segments,
                  recordingFps: capturedVideo?.recordingFps || 30,
                  capturedVideo: capturedVideo ? {
                    hasSlowMotionSegments: !!capturedVideo.slowMotionSegments,
                    slowMotionSegmentsLength: capturedVideo.slowMotionSegments?.length || 0
                  } : null
                });
                return segments;
              })()}
              recordingFps={capturedVideo?.recordingFps || 30}
            />
            {/* Slow motion badge */}
            {(videoSpeed === 'slow' || (capturedVideo?.slowMotionSegments && capturedVideo.slowMotionSegments.length > 0)) && (
              <View style={[styles.slomoBadge, { position: 'absolute', top: 20, left: 20, zIndex: 10 }]}>
                <MaterialCommunityIcons name="speedometer" size={16} color="#ff3b30" />
                <Text style={{ color: '#ff3b30', fontSize: 12, marginLeft: 4, fontWeight: 'bold' }}>
                  SLOW MOTION
                  {capturedVideo?.slowMotionSegments && capturedVideo.slowMotionSegments.length > 0 && (
                    <Text style={{ fontSize: 10, marginLeft: 4 }}>({capturedVideo.slowMotionSegments.length} segments)</Text>
                  )}
                </Text>
              </View>
            )}
          </View>

          {!showSuccessPopup && !showSharePopup && (
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.previewBtn}
                onPress={() => {
                  // Reset all states when canceling preview
                  setShowVideoPreview(false);
                  setVideoUri(null);
                  setCapturedVideo(null);
                  setRecordingDuration(0);
                  if (recordingDurationRef.current) {
                    clearInterval(recordingDurationRef.current);
                    recordingDurationRef.current = null;
                  }
                }}
              >
                <MaterialCommunityIcons name="camera-retake" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.previewBtn, { backgroundColor: '#4CAF50' }]}
                onPress={handleConfirmSaveVideo}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Icon name="check" size={30} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          )}

          {showSuccessPopup && !showSharePopup && (
            <RNAnimated.View
              {...panResponder.panHandlers}
              style={[
                styles.bottomSheet,
                {
                  transform: [{ translateY: sheetTranslateY }],
                  opacity: sheetOpacity,
                },
              ]}
            >
              <View style={styles.dragHandle} />
              <View style={styles.sheetContent}>
                <View style={styles.successIconCircle}>
                  <Icon name="check" size={40} color="#fff" />
                </View>
                {!shareSuccess ? (
                  <>
                    <Text style={styles.sheetTitle}>Success!</Text>
                    <Text style={styles.sheetSubtitle}>Video saved in your gallery</Text>
                    <View style={styles.shareRow}>
                      {/* WhatsApp */}
                      <TouchableOpacity
                        style={[
                          styles.shareIconBtn,
                          { backgroundColor: '#25D366' },
                          isSaving && styles.disabledButton
                        ]}
                        onPress={() => handleShare('whatsapp')}
                        disabled={isSaving}
                        activeOpacity={0.7}
                      >
                        {isSaving ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <View style={styles.iconContainer}>
                            <MaterialCommunityIcons
                              name="whatsapp"
                              size={28}
                              color="#fff"
                            />
                          </View>
                        )}
                      </TouchableOpacity>

                      {/* Email */}
                      <TouchableOpacity
                        style={[
                          styles.shareIconBtn,
                          { backgroundColor: '#EA4335' },
                          isSaving && styles.disabledButton
                        ]}
                        onPress={() => handleShare('email')}
                        disabled={isSaving}
                        activeOpacity={0.7}
                      >
                        {isSaving ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <View style={styles.iconContainer}>
                            <Icon
                              name="email"
                              size={28}
                              color="#fff"
                            />
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    {typeShare === "whatsapp" ? (
                      <>
                        <Text style={styles.sheetTitle}>Shared Successfully</Text>
                        <Text style={styles.sheetSubtitle}>
                          Video has been shared on WhatsApp
                        </Text>
                        <View style={styles.whatsappSuccessRow}>
                          <MaterialCommunityIcons name="whatsapp" size={24} color="#25D366" />
                          <Text style={styles.whatsappSuccessText}>
                            Sent to {user?.whatsapp}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <Text style={styles.sheetTitle}>Shared Successfully</Text>
                        <Text style={styles.sheetSubtitle}>
                          Video has been shared on Gmail
                        </Text>
                        <View style={styles.whatsappSuccessRow}>
                          <Icon
                            name="email"
                            size={28}
                            color="#EA4335"
                          />
                          <Text style={styles.whatsappSuccessText}>
                            Sent to {user?.email}
                          </Text>
                        </View>
                      </>
                    )}
                    <TouchableOpacity
                      style={styles.doneBtn}
                      onPress={() => {
                        animateSheetOut(() => {
                          setShowSuccessPopup(false);
                          setShowVideoPreview(false);
                          navigation.navigate('Login');
                          setTimeout(() => {
                            setShowVideoPreview(false);
                            setVideoUri(null);
                            setCapturedVideo(null);
                            setLastUploadResult(null);
                            setRecordingDuration(0);
                          }, 500);
                        });
                      }}
                    >
                      <Text style={styles.doneBtnText}>Done</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </RNAnimated.View>
          )}
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

          {!showSuccessPopup && !showSharePopup && (
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.previewBtn}
                onPress={() => {
                  // Reset all states when canceling preview
                  setShowPreview(false);
                  setFinalImageUri(null);
                  setCapturedPhoto(null);
                  setProcessing(false);
                  setCountdown(0);
                  if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                  }
                }}
              >
                <MaterialCommunityIcons name="camera-retake" size={24} color="#fff" />
                {/* <Icon name="close" size={30} color="#fff" /> */}
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
          )}

          {showSuccessPopup && !showSharePopup && (
            <RNAnimated.View
              {...panResponder.panHandlers}
              style={[
                styles.bottomSheet,
                {
                  transform: [{ translateY: sheetTranslateY }],
                  opacity: sheetOpacity,
                },
              ]}
            >
              <View style={styles.dragHandle} />
              <View style={styles.sheetContent}>
                <View style={styles.successIconCircle}>
                  <Icon name="check" size={40} color="#fff" />
                </View>
                {!shareSuccess ? (
                  <>
                    <Text style={styles.sheetTitle}>Success!</Text>
                    <Text style={styles.sheetSubtitle}>Photo saved in your gallery</Text>
                    {/* <TouchableOpacity
                  style={styles.sheetActionBtn}
                  onPress={async () => {
                    try {
                      setIsSaving(true);
                      
                      // Check if lastUploadResult exists and has required properties
                      if (!lastUploadResult) {
                        Alert.alert('Error', 'No upload result available. Please save the photo first.');
                        setIsSaving(false);
                        return;
                      }
                      
                      // Use posterVideoId if available, otherwise fall back to _id or id
                      const photoId = lastUploadResult.posterVideoId || lastUploadResult._id || lastUploadResult.id;
                      if (!photoId) {
                        Alert.alert('Error', 'Photo ID not found. Please try saving again.');
                        setIsSaving(false);
                        return;
                      }
                      
                      const pageUrl = `https://app.bilimbebrandactivations.com/photomergeapp/share/${photoId}`;
                      // User mentioned: "call the shareapi once the api given then response redirect to share page"
                      // shareApi needs (pageUrl, whatsappNumber, id)
                      await shareApi(
                        pageUrl,
                        user?.whatsapp,
                        lastUploadResult._id || lastUploadResult.id
                      );

                      animateSheetOut(() => {
                        setShowSuccessPopup(false);
                        navigation.navigate('Login');
                        // Clean up current screen state after navigation
                        setTimeout(() => {
                          setShowPreview(false);
                          setFinalImageUri(null);
                          setCapturedPhoto(null);
                          setLastUploadResult(null);
                        }, 500);
                      });
                    } catch (err) {
                      console.error('Share call failed:', err);
                      // Still navigate to share popup even if notification fails? 
                      // User said "once api given then response redirect"
                      Alert.alert('Sharing', 'Proceeding to share options.');
                      animateSheetOut(() => {
                        setShowSuccessPopup(false);
                        navigation.navigate('Share', { mergedImage: finalImageUri });
                      });
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.sheetActionBtnText}>Share</Text>
                  )}
                </TouchableOpacity> */}
                    <View style={styles.shareRow}>
                      {/* WhatsApp */}
                      <TouchableOpacity
                        style={[
                          styles.shareIconBtn,
                          { backgroundColor: '#25D366' },
                          isSaving && styles.disabledButton
                        ]}
                        onPress={() => handleShare('whatsapp')}
                        disabled={isSaving}
                        activeOpacity={0.7}
                      >
                        {isSaving ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <View style={styles.iconContainer}>
                            <MaterialCommunityIcons
                              name="whatsapp"
                              size={28}
                              color="#fff"
                            />
                          </View>
                        )}
                      </TouchableOpacity>

                      {/* Email */}
                      <TouchableOpacity
                        style={[
                          styles.shareIconBtn,
                          { backgroundColor: '#EA4335' }, // Changed to Google red for email
                          isSaving && styles.disabledButton
                        ]}
                        onPress={() => handleShare('email')}
                        disabled={isSaving}
                        activeOpacity={0.7}
                      >
                        {isSaving ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <View style={styles.iconContainer}>
                            <Icon
                              name="email"
                              size={28}
                              color="#fff"
                            />
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (<>
                  {/* ✅ WhatsApp Share Success UI */}
                  {typeShare === "whatsapp" ?
                    (<>
                      <Text style={styles.sheetTitle}>Shared Successfully</Text>
                      <Text style={styles.sheetSubtitle}>
                        Image has been shared on WhatsApp
                      </Text>

                      <View style={styles.whatsappSuccessRow}>
                        <MaterialCommunityIcons name="whatsapp" size={24} color="#25D366" />
                        <Text style={styles.whatsappSuccessText}>
                          Sent to {user?.whatsapp}
                        </Text>
                      </View>
                    </>) : (<>
                      <Text style={styles.sheetTitle}>Shared Successfully</Text>
                      <Text style={styles.sheetSubtitle}>
                        Image has been shared on Gmail
                      </Text>

                      <View style={styles.whatsappSuccessRow}>
                        <Icon
                          name="email"
                          size={28}
                          color="#EA4335"
                        />
                        <Text style={styles.whatsappSuccessText}>
                          Sent to {user?.email}
                        </Text>
                      </View>
                    </>)}

                  <TouchableOpacity
                    style={styles.doneBtn}
                    onPress={() => {
                      animateSheetOut(() => {
                        setShowSuccessPopup(false);
                        setShowPreview(false);
                        navigation.navigate('Login');
                        setTimeout(() => {
                          setShowPreview(false);
                          setFinalImageUri(null);
                          setCapturedPhoto(null);
                          setLastUploadResult(null);
                        }, 500);
                      });
                    }}
                  >
                    <Text style={styles.doneBtnText}>Done</Text>
                  </TouchableOpacity>
                </>
                )}
              </View>
            </RNAnimated.View>
          )}
        </View>
      )}

      {/* Processing Indicator */}
      {processing && finalImageUri && (
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
            <Text style={{ color: 'white', marginTop: 20, fontWeight: 'bold' }}>
              Enhancing Image...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cameraContainer: {
    width: screenWidth,
    height: cameraHeight,
    backgroundColor: '#fff',
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
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#000',
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
    backgroundColor: '#fff',
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
  // Bottom Sheet Popup styles
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: screenWidth,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 15,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 25,
  },
  sheetContent: {
    alignItems: 'center',
    width: '100%',
  },
  successIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#CD1C1C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  sheetActionBtn: {
    width: '100%',
    height: 56,
    backgroundColor: '#CD1C1C',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetActionBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  shareTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    alignSelf: 'flex-start',
    marginBottom: 20,
    marginLeft: 5,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  socialItem: {
    alignItems: 'center',
  },
  socialIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  socialName: {
    fontSize: 10,
    color: '#666',
  },
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30, // or marginHorizontal for older RN versions
    paddingVertical: 10,
  },

  shareIconBtn: {
    width: 56,
    height: 56,
    borderRadius: 28, // Makes it perfectly circular
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    overflow: 'hidden', // Ensures content stays within rounded corners
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  disabledButton: {
    opacity: 0.6,
  },
  shareLabel: {
    marginTop: 6,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  whatsappSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },

  whatsappSuccessText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },

  doneBtn: {
    marginTop: 25,
    backgroundColor: '#25D366',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  doneBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  placeholderItem: {
    width: 70,
    height: 90,
    backgroundColor: '#f5f5f5',
    margin: 8,
    borderRadius: 8,
  },
  // Video recording styles
  recordingIndicator: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  recordingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  slowMotionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  slowMotionText: {
    color: '#ff3b30',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  recordingButton: {
    opacity: 0.8,
  },
  recordingButtonOuter: {
    borderColor: '#ff3b30',
  },
  recordingButtonInner: {
    backgroundColor: '#ff3b30',
    borderRadius: 25,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoRecordBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  stopIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  videoPreviewContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  slomoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  videoPreviewActions: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
});
