import { useState, useCallback, useRef, useEffect } from 'react';
import api from '../services/api';

/**
 * Custom hook to manage the upscaling workflow and state.
 * @param {Function} addToast - Callback to trigger a UI toast notification.
 */
const useUpscaler = (addToast) => {
    const [status, setStatus] = useState('idle'); // idle, uploading, processing, complete, error
    const [progressMessage, setProgressMessage] = useState('');
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState(null); // { original, upscaled }
    const [currentFile, setCurrentFile] = useState(null);
    const progressTimerRef = useRef(null);

    const stopProgressPolling = useCallback(() => {
        if (progressTimerRef.current) {
            clearInterval(progressTimerRef.current);
            progressTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => stopProgressPolling();
    }, [stopProgressPolling]);

    const reset = useCallback(() => {
        stopProgressPolling();
        setStatus('idle');
        setResult(null);
        setCurrentFile(null);
        setProgressMessage('');
        setProgress(0);
    }, [stopProgressPolling]);

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
        setProgress(0);
        addToast('Image loaded successfully', 'info');
    }, [addToast]);

    const clearResult = useCallback(() => {
        stopProgressPolling();
        setStatus('idle');
        setResult(null);
        setProgressMessage('');
        setProgress(0);
    }, [stopProgressPolling]);

    const startProgressPolling = useCallback((filename) => {
        stopProgressPolling();

        const pollProgress = async () => {
            try {
                const progressResp = await api.getProgress(filename);
                setProgress(progressResp.percent || 0);

                if (progressResp.total) {
                    setProgressMessage(`Processed ${progressResp.current}/${progressResp.total} tiles`);
                }

                if (progressResp.status === 'complete' || progressResp.status === 'error') {
                    stopProgressPolling();
                }
            } catch (error) {
                console.warn('Progress polling failed:', error);
            }
        };

        pollProgress();
        progressTimerRef.current = setInterval(pollProgress, 1300);
    }, [stopProgressPolling]);

    const processImage = useCallback(async (fileOverride = null) => {
        const fileToUpload = fileOverride || currentFile;
        if (!fileToUpload) return;

        try {
            setStatus('uploading');
            setProgressMessage('Uploading image to backend...');
            setProgress(0);

            // 1. Upload
            const uploadResp = await api.uploadImage(fileToUpload);
            console.log('UseUpscaler: Upload response:', uploadResp);

            const filename = uploadResp.filename || currentFile.name; // Fallback only if backend doesn't return it
            console.log('UseUpscaler: Using filename for upscale:', filename);

            setStatus('processing');
            setProgressMessage('Upscaling with RealESRGAN x4... (This may take a moment)');
            setProgress(0);
            startProgressPolling(filename);

            // 2. Upscale
            const upscaleResp = await api.upscaleImage(filename);
            console.log('UseUpscaler: Upscale response:', upscaleResp);
            stopProgressPolling();
            setProgress(100);

            setResult({
                original: api.getUploadUrl(uploadResp.path),
                upscaled: api.getImageUrl(upscaleResp.output)
            });

            setStatus('complete');
            addToast('Upscaling complete!', 'success');

        } catch (error) {
            console.error('Upscale failed:', error);
            stopProgressPolling();
            setStatus('error');
            setProgressMessage('');
            setProgress(0);
            addToast(error.message || 'Failed to process image', 'error');
        }
    }, [currentFile, addToast, startProgressPolling, stopProgressPolling]);

    return {
        status,
        progressMessage,
        progress,
        result,
        currentFile,
        handleFileSelect,
        processImage,
        reset,
        clearResult
    };
};

export default useUpscaler;
