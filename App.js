//simple splash screen
// import React, { useEffect, useState } from 'react';
// import { 
//   StyleSheet, 
//   Text, 
//   View, 
//   StatusBar, 
//   Image,
//   Animated 
// } from 'react-native';
// import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
// import ClientPageUser from './src/screens/ClientPageUser';

// const App = () => {
//   const [isLoading, setIsLoading] = useState(true);
//   const fadeAnim = new Animated.Value(0);
//   const scaleAnim = new Animated.Value(0.5);

//   useEffect(() => {
//     // Animate the logo
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 1500,
//         useNativeDriver: true,
//       }),
//       Animated.spring(scaleAnim, {
//         toValue: 1,
//         friction: 3,
//         tension: 120,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     // Hide splash screen after delay
//     const timer = setTimeout(() => {
//       setIsLoading(false);
//     }, 3000);

//     return () => clearTimeout(timer);
//   }, []);

//   if (isLoading) {
//     return (
//       <>
//         <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
//         <View style={styles.splashContainer}>
//           <View style={styles.splashContent}>
//             {/* Animated Logo */}
//             <Animated.View style={{
//               opacity: fadeAnim,
//               transform: [{ scale: scaleAnim }]
//             }}>
//               <Image
//                 source={require('./src/assets/icon.png')}
//                 style={styles.logo}
//                 resizeMode="contain"
//               />
//             </Animated.View>

//             <Animated.Text style={[styles.splashTitle, { opacity: fadeAnim }]}>
//              Photo Merge
//             </Animated.Text>
//             <Animated.Text style={[styles.splashSubtitle, { opacity: fadeAnim }]}>
//               Loading...
//             </Animated.Text>
//           </View>
//         </View>
//       </>
//     );
//   }

//   return (
//     <>
//       <StatusBar barStyle="dark-content" />
//       <SafeAreaProvider>
//         <SafeAreaView style={styles.container}>
//           <ClientPageUser />
//         </SafeAreaView>
//       </SafeAreaProvider>
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   splashContainer: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   splashContent: {
//     alignItems: 'center',
//     padding: 20,
//   },
//   logo: {
//     width: 180,
//     height: 180,
//     marginBottom: 30,
//     // Optional: Add shadow for iOS
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 5,
//     // For Android
//     elevation: 8,
//   },
//   splashTitle: {
//     fontSize: 36,
//     fontWeight: 'bold',
//     color: '#cd1c1cff',
//     marginBottom: 10,
//     textAlign: 'center',
//   },
//   splashSubtitle: {
//     fontSize: 18,
//     color: '#bc1d1dff',
//     opacity: 0.8,
//     textAlign: 'center',
//   },
// });

// export default App;

//round logo with loader bar 
import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  Image,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import ClientPageUser from './src/screens/ClientPageUser';


import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "./src/screens/LoginScreen";
import CameraScreen from "./src/screens/CameraScreen";
import PreviewScreen from "./src/screens/PreviewScreen";

const Stack = createNativeStackNavigator();


const { width, height } = Dimensions.get('window');

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoTranslateY = useRef(new Animated.Value(30)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Shimmer animation
  const startShimmerAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  useEffect(() => {
    startShimmerAnimation();

    // Sequence animations
    Animated.sequence([
      // Logo entrance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 150,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),

      // Text fade in
      Animated.timing(textFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),

      // Progress animation
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1800,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();

    // Auto hide after 3 seconds
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1.1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsLoading(false);
      });
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, width + 100],
  });

  if (isLoading) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#e0e3ecff" />
        <View style={styles.splashContainer}>
          {/* Background gradient */}
          <LinearGradient
            colors={['#ea6666ff', '#a24b4bff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Shimmer effect */}
          {/* <Animated.View
            style={[
              styles.shimmer,
              {
                transform: [{ translateX: shimmerTranslateX }],
              },
            ]}
          /> */}

          {/* Main content container */}
          <View style={styles.content}>
            {/* Logo with animated entrance */}
            <Animated.View
              style={[
                styles.logoWrapper,
                {
                  opacity: fadeAnim,
                  transform: [
                    { scale: logoScale },
                    { translateY: logoTranslateY },
                  ],
                },
              ]}
            >
              <View style={styles.logoContainer}>
                {/* Logo shadow/glow */}
                <View style={styles.logoGlow} />

                {/* Logo image */}
                <Image
                  source={require('./src/assets/icon.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />

                {/* Logo border accent */}
                <View style={styles.logoBorder} />
              </View>
            </Animated.View>

            {/* App name with fade animation */}
            <Animated.View style={{ opacity: textFade, alignItems: 'center' }}>
              <Text style={styles.appName}>Photo Merge</Text>
              <Text style={styles.appTagline}>Premium Experience</Text>
            </Animated.View>

            {/* Progress indicator */}
            <View style={styles.progressWrapper}>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    { width: progressWidth },
                  ]}
                />
              </View>
              {/* <View style={styles.progressDots}>
                {[0, 1, 2].map((dot) => (
                  <View key={dot} style={styles.progressDot} />
                ))}
              </View> */}
            </View>

            {/* Loading indicator */}
            {/* <View style={styles.loadingIndicator}>
              <View style={styles.loadingCircle}>
                <View style={styles.loadingInner} />
              </View>
              <Text style={styles.loadingText}>Loading...</Text>
            </View> */}
          </View>

          {/* Footer */}
          <Animated.View style={[styles.footer, { opacity: textFade }]}>
            <Text style={styles.version}>v1.0.0</Text>
            <View style={styles.footerDivider} />
            <Text style={styles.year}>2025</Text>
          </Animated.View>
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaProvider>
        <SafeAreaView style={styles.mainContainer}>
          {/* <ClientPageUser /> */}
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Camera" component={CameraScreen} />
              <Stack.Screen name="Preview" component={PreviewScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaView>
      </SafeAreaProvider>
    </>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    width: '100%',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ skewX: '-20deg' }],
  },
  logoWrapper: {
    marginBottom: 40,
  },
  logoContainer: {
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -20,
    left: -20,
  },
  logo: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#ffffff',
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  logoBorder: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    top: -10,
    left: -10,
  },
  appName: {
    fontSize: 44,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appTagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 3,
    fontWeight: '300',
    marginBottom: 50,
  },
  progressWrapper: {
    width: '70%',
    //marginBottom: 40,
    alignItems: "center"
  },
  progressTrack: {
    width: '70%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 1.5,
    overflow: 'hidden',
    textAlign: "center"
    //marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 1.5,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
    letterSpacing: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  version: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
  },
  footerDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  year: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
  },
});

export default App;
