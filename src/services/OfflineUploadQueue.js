import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { uploadToApi } from './UploadApi';

const QUEUE_KEY = 'UPLOAD_QUEUE';

export const addToQueue = async (item) => {
  const queue = JSON.parse(await AsyncStorage.getItem(QUEUE_KEY)) || [];
  queue.push(item);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const processQueue = async () => {
  // Check detailed network state and ensure we have wifi/ethernet/cellular
  const state = await NetInfo.fetch();
  const acceptedTypes = ['wifi', 'ethernet', 'cellular'];
  const connected = state.isConnected === true && (state.isInternetReachable !== false);
  const hasAcceptableNetwork = connected && acceptedTypes.includes(state.type);
  if (!hasAcceptableNetwork) return;

  const queue = JSON.parse(await AsyncStorage.getItem(QUEUE_KEY)) || [];
  if (!queue.length) return;

  const remaining = [];

  for (const item of queue) {
    if (!item || !item) {
      console.warn('OfflineUploadQueue: skipping invalid queue item', item)
      continue
    }

    try {
      // item shape: { uri: {uri, name, type}, userData, createdAt }
      const photo = item.uri;
      const userData = item.userData || {};

      if (photo && photo.uri) {
        await uploadToApi(photo, userData);
      } else {
        console.warn('OfflineUploadQueue: missing photo uri in item', item);
      }
    } catch (e) {
      console.warn('OfflineUploadQueue: upload failed, keeping item in queue', e.message || e)
      remaining.push(item) // keep failed uploads
    }
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining))
};
