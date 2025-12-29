import axios from 'axios';

// Configuration
// Use environment variable or fallback to localhost
const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Axios Instance
const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 300000, // 5 minutes timeout for potentially slow CPU upscaling
    headers: {
        'Content-Type': 'application/json',
    },
});

// Centralized Error Handling
apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        let message = 'An unexpected error occurred';

        if (error.response) {
            // Server responded with a status code out of 2xx range
            message = error.response.data?.detail || error.response.data?.message || `Error: ${error.response.statusText}`;
            console.error('API Error Response:', error.response.data);
        } else if (error.request) {
            // Request was made but no response received (Network error / Offline)
            console.error('API No Response:', error.request);
            message = 'Cannot connect to backend server. Ensure it is running on ' + BASE_URL;
        } else {
            // Something happened in setting up the request
            message = error.message;
            console.error('API Request Error:', error.message);
        }

        return Promise.reject(new Error(message));
    }
);

/**
 * Backend API Service
 * Aligned with user requirements.
 */
const api = {
    /**
     * Check backend health status
     * Endpoint: GET /health
     */
    checkHealth: async () => {
        return apiClient.get('/health');
    },

    /**
     * Upload an image file
     * Endpoint: POST /upload
     * Returns: { filename: "...", path: "..." }
     */
    uploadImage: async (file) => {
        const formData = new FormData();
        formData.append('file', file); // Field name must match backend: file: UploadFile = File(...)

        return apiClient.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    /**
     * Request image upscaling
     * Endpoint: POST /upscale
     * Body: { filename: "..." }
     * Returns: { output: "...", scale: 4 }
     */
    upscale: async (params) => {
        // Handle both object and legacy string input just in case
        const filename = typeof params === 'string' ? params : params.filename;
        return apiClient.post('/upscale', { filename });
    },

    /**
     * Wrapper for compatibility with hooks expecting upscaleImage
     * The hook passes fileId (which is now filename)
     */
    upscaleImage: async (filename) => {
        return apiClient.post('/upscale', { filename });
    },

    /**
     * Helper to construct full image URL from a path
     * If path is "outputs/upscaled_abc.jpg", we want http://.../download/upscaled_abc.jpg
     * OR we can serve static files. 
     * The backend provides GET /download/{filename}.
     */
    getImageUrl: (pathOrUrl) => {
        if (!pathOrUrl) return '';
        if (pathOrUrl.startsWith('http')) return pathOrUrl;

        // Extract filename from path (e.g. "outputs/upscaled_image.jpg" -> "upscaled_image.jpg")
        const filename = pathOrUrl.split(/[/\\]/).pop();
        return `${BASE_URL}/download/${encodeURIComponent(filename)}`;
    },

    /**
     * Get URL for an uploaded image (Original)
     */
    getUploadUrl: (pathOrUrl) => {
        if (!pathOrUrl) return '';
        if (pathOrUrl.startsWith('http')) return pathOrUrl;
        const filename = pathOrUrl.split(/[/\\]/).pop();
        return `${BASE_URL}/uploads/${encodeURIComponent(filename)}`;
    },

    /**
     * Download the result image
     * @param {string} filename - The filename to download
     */
    downloadResult: async (filename) => {
        try {
            // Clean filename just in case path is passed
            const cleanName = filename.split(/[/\\]/).pop();
            const downloadUrl = `${BASE_URL}/download/${encodeURIComponent(cleanName)}`;

            const response = await axios.get(downloadUrl, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', cleanName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            throw new Error('Failed to download image ' + filename);
        }
    },

    /**
     * Generic download helper
     */
    downloadImage: async (imageUrl, filename) => {
        // Re-use logic if imageUrl comes from our backend
        if (imageUrl.includes(BASE_URL)) {
            const derivedFilename = imageUrl.split('/').pop();
            return api.downloadResult(derivedFilename);
        }

        try {
            const response = await axios.get(imageUrl, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename || 'upscaled.png');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            throw new Error('Failed to download image');
        }
    }
};

export default api;
