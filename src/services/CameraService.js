export const takeSnapshot = async (cameraRef) => {
  if (!cameraRef.current) {
    throw new Error('Camera not ready');
  }

  return await cameraRef.current.takeSnapshot({
    quality: 100,
    skipMetadata: false,
  });
};
