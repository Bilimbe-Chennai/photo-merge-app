// // Simple upload helper used by ApiUploadService
// // Replace UPLOAD_ENDPOINT with your real server endpoint
// import useAxios from './useAxios';
// import axios from 'axios';
// const apiClient = axios.create({
//   baseURL: 'https://api.bilimbebrandactivations.com/api/',
// });

// export async function uploadToApi(photo, metadata = {}) {
//   //const axiosData = useAxios();
//  if (!photo || !photo.uri) {
//     throw new Error('Invalid photo object');
//   }
//   const formData = new FormData();
//   console.log('PHOTO TO UPLOAD:', photo);
// console.log('UPLOAD URL:', apiClient.defaults.baseURL + 'client/client/test');
//   formData.append('photo', {
//     uri: photo.uri,
//     name: photo.name,
//     type: photo.type,
//   });

//   formData.append('email', metadata.email);
//   formData.append('whatsapp', metadata.whatsapp);
//   formData.append('clientName', metadata.clientName);
//   formData.append('template_name', metadata.template_name);
//   formData.append('source', metadata.source || 'Photo Merge App');
//   const endpoint = `client/client/${"test"}`;
//   // Use axios for upload and let it set multipart boundary
//   try {
//      const response = await apiClient.post(
//       endpoint,
//       formData
//     );
//       return response.data;
//   } catch (err) {
//    console.log(
//       'UPLOAD ERROR:',
//       err.response?.data || err.message
//     );
//     throw err;
//   }
// }
// import axios from 'axios';
// import { Platform } from 'react-native';
// const API_BASE = 'https://api.bilimbebrandactivations.com/api';
// export async function uploadToApi(photo, metadata = {}) {
//   if (!photo || !photo.uri) {
//     throw new Error('Invalid photo object');
//   }

//   const formData = new FormData();

//   console.log('PHOTO TO UPLOAD:', photo);

//    formData.append('photo', {
//     uri:
//       Platform.OS === 'ios'
//         ? photo.uri.replace('file://', '')
//         : photo.uri,
//     name: photo.name || 'photo.jpg',
//     type: photo.type || 'image/jpeg',
//   });
//  formData.append('email', metadata.email ?? '');
//   formData.append('whatsapp', metadata.whatsapp ?? '');
//   formData.append('clientName', metadata.clientName ?? '');
//   formData.append('template_name', metadata.template_name ?? '');
//   formData.append('source', metadata.source ?? 'Photo Merge App');
//   try {
//      const response = await axios.post(
//     `${API_BASE}/client/client/test`,
//     formData,
//     {
//       timeout: 60000,
//        headers: {
//           Accept: 'application/json',
//           // ❌ DO NOT set Content-Type manually
//         },
//           transformRequest: (data) => data, // 👈 IMPORTANT for RN
//     }
//   );
// console.log('UPLOAD RESPONSE:', response.data);
//   return response.data;
//   } catch (error) {
//  console.error(
//       'UPLOAD FAILED:',
//       error.response?.data || error.message
//     );
//     throw error;
//   }
// }
// import { Platform } from 'react-native';

// const API_URL =
//   'https://api.bilimbebrandactivations.com/api/client/client/test';

// export async function uploadToApi(photo, metadata = {}) {
//   const formData = new FormData();

//   formData.append('photo', {
//     uri: photo.uri,
//     name: photo.name || 'photo.jpg',
//     type: photo.type || 'image/png',
//   });

//   formData.append('email', metadata.email || '');
//   formData.append('whatsapp', metadata.whatsapp || '');
//   formData.append('clientName', metadata.clientName || '');
//   formData.append('template_name', metadata.template_name || '');
//   formData.append('source', metadata.source || 'Photo Merge App');

//   const response = await fetch(API_URL, {
//     method: 'POST',
//     headers: {
//       Accept: 'application/json',
//       // ❌ DO NOT SET Content-Type
//     },
//     body: formData,
//   });

//   const data = await response.json();
//   return data;
// }
import { Platform } from 'react-native';
import RNFetchBlob from 'react-native-blob-util';
const API_URL = 'https://api.bilimbebrandactivations.com/api/client/client/test';

// export const uploadToApi = async (photo, metadata = {}) => {
//   try {
//     const formData = new FormData();

//     if (photo?.uri) {
//       let uri = photo.uri;

//       // iOS fix
//       if (Platform.OS === 'ios' && uri.startsWith('file://')) {
//         uri = uri.replace('file://', '');
//       }

//       formData.append('photo', {
//         uri,
//         name: photo.name || `photo_${Date.now()}.jpg`,
//         type: photo.type || 'image/jpeg',
//       });
//     }

//     // Append other fields
//     formData.append('clientName', metadata.clientName || '');
//     formData.append('whatsapp', metadata.whatsapp || '');
//     formData.append('email', metadata.email || '');
//     formData.append('template_name', metadata.template_name || '');
//     formData.append('source', metadata.source || 'Photo Merge App');

//     const response = await fetch(API_URL, {
//       method: 'POST',
//       headers: {
//         Accept: 'application/json',
//         // ❌ Do NOT set Content-Type manually
//       },
//       body: formData,
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const data = await response.json();
//     return data;
//   } catch (err) {
//     console.error('Upload error:', err);
//     throw err;
//   }
// };
export const uploadToApi = async (photo, metadata = {}) => {
  try {
    if (!photo?.uri) throw new Error('No photo to upload');

    const uploadUri = Platform.OS === 'ios' ? photo.uri.replace('file://', '') : photo.uri;

    const data = [
      {
        name: 'photo',
        filename: photo.name,
        type: photo.type || 'image/jpeg',
        data: RNFetchBlob.wrap(uploadUri),
      },
      { name: 'clientName', data: metadata.clientName || '' },
      { name: 'whatsapp', data: metadata.whatsapp || '' },
      { name: 'email', data: metadata.email || '' },
      { name: 'template_name', data: metadata.template_name || '' },
      { name: 'source', data: metadata.source || 'Photo Merge App' },
    ];

    const response = await RNFetchBlob.fetch(
      'POST',
      'https://api.bilimbebrandactivations.com/api/client/client/test',
      {
        'Accept': 'application/json',
        // ❌ Do NOT set Content-Type manually
      },
      data
    );

    const responseText = await response.text();
    console.log('UPLOAD RAW RESPONSE:', responseText);

    try {
      const respJson = JSON.parse(responseText);
      return respJson;
    } catch (e) {
      console.error('Failed to parse upload response:', e);
      throw new Error(`Upload server returned non-JSON: ${responseText.substring(0, 50)}`);
    }
  } catch (err) {
    console.error('Upload error:', err);
    throw err;
  }
};

export const shareApi = async (link, whatsappNumber, id) => {
  try {
    if (!link) throw new Error('No url to share');

    // The backend route is /client/share/:whatsapp
    const url = `https://api.bilimbebrandactivations.com/api/client/client/share/${whatsappNumber}`;
    console.log('Calling Share API:', url, { whatsappNumber, id, viewUrl: link });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        id: id,
        viewUrl: link,
      }),
    });

    console.log('Share API Status:', response.status);

    const responseText = await response.text();
    console.log('Share API Raw Response:', responseText);

    try {
      const respJson = JSON.parse(responseText);
      return respJson;
    } catch (e) {
      console.error('Failed to parse share response as JSON:', e);
      throw new Error(`Server returned non-JSON response (Status ${response.status}): ${responseText.substring(0, 100)}`);
    }
  } catch (err) {
    console.error('Share error:', err);
    throw err;
  }
};

export const getPhotoById = async (id) => {
  try {
    const response = await fetch(
      `https://api.bilimbebrandactivations.com/api/client/client/get-photo/${id}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    const respJson = await response.json();
    return respJson;
  } catch (err) {
    console.error('Fetch photo error:', err);
    throw err;
  }
};
