import NetInfo from '@react-native-community/netinfo';
import { addToQueue } from './OfflineUploadQueue';
import { uploadToApi } from './UploadApi'; // or same file

// Import or get user data from navigation params / context
export const uploadWithOfflineQueue = async (uri, userData = {}) => {
  const isOnline = (await NetInfo.fetch()).isConnected;
    // Use detailed NetInfo state so we can check connection type (wifi/ethernet/cellular)
    const state = await NetInfo.fetch();

    // Consider the network available if connected and type is one we accept
    const acceptedTypes = ['wifi', 'ethernet', 'cellular'];
     const connected = state.isConnected === true && (state.isInternetReachable !== false);
    const hasAcceptableNetwork = connected && acceptedTypes.includes(state.type);

    if (!hasAcceptableNetwork) {
      // queue item with metadata so it can be retried later
      await addToQueue({
        uri,
        userData,
        createdAt: Date.now(),
      });
      throw new Error('Offline – queued');
    }

  await uploadToApi(uri, userData);
};

