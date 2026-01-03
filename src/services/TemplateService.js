import useAxios from './useAxios';

/**
 * Fetch templates from the API
 * @param {Object} params - Query parameters
 * @param {string} params.source - Source filter (e.g., 'Photo Merge App')
 * @param {string} params.adminid - Admin ID filter
 * @param {string} params.branchid - Branch ID filter
 * @param {string} params.q - Search query for template name
 * @returns {Promise<Array>} Array of template objects
 */
export const fetchTemplates = async (params = {}) => {
    try {
        const axios = useAxios();
        const queryParams = new URLSearchParams();

        if (params.source) queryParams.append('source', params.source);
        if (params.adminid) queryParams.append('adminid', params.adminid);
        if (params.branchid) queryParams.append('branchid', params.branchid);
        if (params.q) queryParams.append('q', params.q);

        const response = await axios.get(`/photomerge/templates?${queryParams.toString()}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching templates:', error);
        throw error;
    }
};

/**
 * Transform API template to app template format
 * @param {Object} apiTemplate - Template object from API
 * @returns {Object} Template object in app format
 */
export const transformApiTemplate = (apiTemplate) => {
    const photos = apiTemplate.templatePhotos || [];

    // If there are multiple photos, map them each to a separate template item for the slider
    if (photos.length > 1) {
        return photos.map((photoId, index) => ({
            id: `${apiTemplate._id}_${index}`,
            apiId: apiTemplate._id,
            name: `${apiTemplate.templatename} ${index + 1}`,
            templatename: apiTemplate.templatename, // Explicitly include the original name
            src: { uri: `https://api.bilimbebrandactivations.com/api/upload/file/${photoId}` },
            photos: [photoId],
            source: apiTemplate.source,
            adminid: apiTemplate.adminid,
            branchid: apiTemplate.branchid,
        }));
    }

    const photoId = photos.length > 0 ? photos[0] : null;

    return {
        id: apiTemplate._id,
        apiId: apiTemplate._id,
        name: apiTemplate.templatename,
        templatename: apiTemplate.templatename, // Explicitly include the original name
        src: photoId
            ? { uri: `https://api.bilimbebrandactivations.com/api/upload/file/${photoId}` }
            : require('../assets/template1.png'),
        photos: photos,
        source: apiTemplate.source,
        adminid: apiTemplate.adminid,
        branchid: apiTemplate.branchid,
    };
};
