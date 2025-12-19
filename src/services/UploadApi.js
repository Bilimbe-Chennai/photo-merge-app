// Simple upload helper used by ApiUploadService
// Replace UPLOAD_ENDPOINT with your real server endpoint
import useAxios from "./useAxios";
const UPLOAD_ENDPOINT = 'https://your-api-url.com/upload'

export async function uploadToApi(uri) {
    const axiosData = useAxios();
    if (!uri) throw new Error('No URI provided to upload')
    if (!whatsapp || !clientName || !photo) throw new Error('No Details provided to upload')
    // Keep file URI as-is (e.g. file:///...), React Native fetch supports local file URIs
    const formData = new FormData()
    if (photo) formData.append('photo', {
        uri,
        name: 'photo.jpg',
        type: 'image/jpeg',
    })
    formData.append("whatsapp", whatsapp);
    formData.append("clientName", clientName);
    formData.append("email", email);
    formData.append("template_name", template_name);
    formData.append("source", "Photo Merge App");
    await axiosData
        .post(`client/client/${template_name}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        })
        .then(async (response) => {
            // Other types: 202 Accepted response
            if (response.status === 202) {
                return res.json().catch(() => ({}))
            } else if (response.data.error) {
                const text = await res.text().catch(() => '')
                throw new Error(`Upload failed: ${res.status} ${res.statusText} ${text}`)
            }
        })
        .catch(async (err) => {
            console.error("Upload failed:", err);
            const text = await res.text().catch(() => '')
            throw new Error(`Upload failed: ${res.status} ${res.statusText} ${text}`)
        })
        .finally(() => {
            setLoading(false);
        });
}
