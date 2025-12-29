import { useState, useCallback } from 'react';
import api from '../services/api';

/**
 * Custom hook to manage the upscaling workflow and state.
 * @param {Function} addToast - Callback to trigger a UI toast notification.
 */
const useUpscaler = (addToast) => {
    const [status, setStatus] = useState('idle'); // idle, uploading, processing, complete, error
    const [progressMessage, setProgressMessage] = useState('');
    const [result, setResult] = useState(null); // { original, upscaled }
    const [currentFile, setCurrentFile] = useState(null);

    const reset = useCallback(() => {
        setStatus('idle');
        setResult(null);
        setCurrentFile(null);
        setProgressMessage('');
    }, []);

    const handleFileSelect = useCallback((file) => {
        // Basic Validation
        if (!file.type.startsWith('image/')) {
            addToast('Invalid file type. Please upload an image.', 'error');
            return;
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB limit example
            addToast('File too large. Max 10MB.', 'warning');
            return;
        }

        setCurrentFile(file);
        setStatus('idle');
        setResult(null);
        addToast('Image loaded successfully', 'info');
    }, [addToast]);

    const processImage = useCallback(async () => {
        if (!currentFile) return;

        try {
            setStatus('uploading');
            setProgressMessage('Uploading image to backend...');

            // 1. Upload
            const uploadResp = await api.uploadImage(currentFile);
            console.log('UseUpscaler: Upload response:', uploadResp);

            const filename = uploadResp.filename || currentFile.name; // Fallback only if backend doesn't return it
            console.log('UseUpscaler: Using filename for upscale:', filename);

            setStatus('processing');
            setProgressMessage('Upscaling with RealESRGAN x4... (This may take a moment)');

            // 2. Upscale
            const upscaleResp = await api.upscaleImage(filename);
            console.log('UseUpscaler: Upscale response:', upscaleResp);

            setResult({
                original: api.getUploadUrl(uploadResp.path),
                upscaled: api.getImageUrl(upscaleResp.output)
            });

            setStatus('complete');
            addToast('Upscaling complete!', 'success');

        } catch (error) {
            console.error('Upscale failed:', error);
            setStatus('error');
            setProgressMessage('');
            addToast(error.message || 'Failed to process image', 'error');
        }
    }, [currentFile, addToast]);

    return {
        status,
        progressMessage,
        result,
        currentFile,
        handleFileSelect,
        processImage,
        reset
    };
};

export default useUpscaler;
