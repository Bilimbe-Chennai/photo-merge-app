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
  const isOnline = (await NetInfo.fetch()).isConnected;
  if (!isOnline) return;

  const queue = JSON.parse(await AsyncStorage.getItem(QUEUE_KEY)) || [];
  if (!queue.length) return;

  const remaining = [];

  for (const item of queue) {
    if (!item || !item.uri) {
      console.warn('OfflineUploadQueue: skipping invalid queue item', item)
      continue
    }

    try {
      await uploadToApi(item.uri)
    } catch (e) {
      console.warn('OfflineUploadQueue: upload failed, keeping item in queue', e.message || e)
      remaining.push(item) // keep failed uploads
    }
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining))
};
