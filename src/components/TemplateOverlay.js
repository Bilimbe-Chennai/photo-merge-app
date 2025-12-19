// import React from 'react';
// import { Image, StyleSheet } from 'react-native';

// export default function TemplateOverlay({ template, onLayoutOverlay }) {
//   const handleLayout = (e) => {
//     const { width: containerW, height: containerH } = e.nativeEvent.layout;
//     let displayW = containerW;
//     let displayH = containerH;

//     try {
//       const src = Image.resolveAssetSource(template);
//       const iw = src.width || 0;
//       const ih = src.height || 0;

//       if (iw > 0 && ih > 0) {
//         const containerRatio = containerW / containerH;
//         const imageRatio = iw / ih;

//         if (imageRatio > containerRatio) {
//           // image is wider, full width
//           displayW = containerW;
//           displayH = containerW / imageRatio;
//         } else {
//           // image is taller, full height
//           displayH = containerH;
//           displayW = containerH * imageRatio;
//         }
//       }
//     } catch (err) {
//       // fall back to container-size
//     }

//     const left = (containerW - displayW) / 2;
//     const top = (containerH - displayH) / 2;

//     onLayoutOverlay && onLayoutOverlay({ x: left, y: top, width: displayW, height: displayH });
//   };

//   return (
//     <Image
//       source={template}
//       style={styles.overlay}
//       resizeMode="contain"
//       pointerEvents="none"
//       onLayout={handleLayout}
//     />
//   );
// }

// const styles = StyleSheet.create({
//   overlay: {
//     ...StyleSheet.absoluteFillObject,
//   },
// });
// In TemplateOverlay component
import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

export default function TemplateOverlay({ template, onLayoutOverlay, absolute = false }) {
  return (
    <View
      style={absolute ? styles.absoluteContainer : styles.container}
      onLayout={(event) => {
        if (onLayoutOverlay) {
          const layout = event.nativeEvent.layout;
          onLayoutOverlay(layout);
        }
      }}
      pointerEvents="none"
    >
      <Image
        source={template}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  absoluteContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});