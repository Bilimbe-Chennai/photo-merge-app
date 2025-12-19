import NetInfo from '@react-native-community/netinfo';
import { addToQueue } from './OfflineUploadQueue';
import { uploadToApi } from './UploadApi'; // or same file

export const uploadWithOfflineQueue = async (uri) => {
  const isOnline = (await NetInfo.fetch()).isConnected;

  // if (!isOnline) {
  //   await addToQueue({
  //     uri,
  //     createdAt: Date.now(),
  //   });
  //   throw new Error('Offline – queued');
  // }

  await uploadToApi(uri);
};
