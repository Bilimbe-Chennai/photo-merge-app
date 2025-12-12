const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

module.exports = mergeConfig(getDefaultConfig(__dirname), {
  resolver: {
    assetExts: ['bin', 'txt', 'jpg', 'png', 'ttf', 'otf'],
  },
});
