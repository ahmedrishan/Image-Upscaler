import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

const VideoUpscalerPanel = ({ addToast }) => {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [jobId, setJobId] = useState(null);
    const [metadata, setMetadata] = useState(null);
    
    // Progress States
    const [status, setStatus] = useState('idle'); // idle, uploaded, processing, complete, error
    const [progress, setProgress] = useState(0);
    const [currentStage, setCurrentStage] = useState('');
    const [currentFrame, setCurrentFrame] = useState(0);
    const [totalFrames, setTotalFrames] = useState(0);
    const [errorMsg, setErrorMsg] = useState(null);
    
    const fileInputRef = useRef(null);
    const pollIntervalRef = useRef(null);

    // Clean up preview object URL on unmount or file change
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    // Clear polling loop on unmount
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    // Format stage names to be human readable (e.g. extracting_frames -> Extracting Frames)
    const formatStage = (stage) => {
        if (!stage) return '';
        return stage
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validation
        if (!selectedFile.name.endsWith('.mp4') && !selectedFile.type.startsWith('video/')) {
            addToast('Only MP4 video files are accepted', 'error');
            return;
        }

        // Reset previous state
        resetState();

        setFile(selectedFile);
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);

        // Auto upload
        setUploading(true);
        setStatus('uploading');
        try {
            const uploadResp = await api.uploadVideo(selectedFile);
            const { job_id } = uploadResp;
            setJobId(job_id);
            setStatus('uploaded');
            addToast('Video uploaded successfully', 'success');

            // Fetch video specs/metadata
            const infoResp = await api.getVideoInfo(job_id);
            setMetadata(infoResp);
        } catch (err) {
            setStatus('error');
            setErrorMsg(err.message || 'Failed to upload video');
            addToast(err.message || 'Failed to upload video', 'error');
        } finally {
            setUploading(false);
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleProcess = async () => {
        if (!jobId) return;

        setStatus('processing');
        setErrorMsg(null);
        setProgress(0);

        try {
            await api.processVideo(jobId);
            addToast('Processing started', 'info');

            // Start polling progress
            pollIntervalRef.current = setInterval(async () => {
                try {
                    const res = await api.getVideoProgress(jobId);
                    setStatus(res.status);
                    setProgress(res.progress || 0);
                    setCurrentStage(res.current_stage || '');
                    setCurrentFrame(res.current_frame || 0);
                    setTotalFrames(res.total_frames || 0);

                    if (res.status === 'complete') {
                        clearInterval(pollIntervalRef.current);
                        addToast('Video upscaling finished successfully!', 'success');
                    } else if (res.status === 'error') {
                        clearInterval(pollIntervalRef.current);
                        setErrorMsg(res.error || 'Upscaling failed.');
                        addToast(res.error || 'Upscaling failed.', 'error');
                    }
                } catch (err) {
                    clearInterval(pollIntervalRef.current);
                    setErrorMsg(err.message);
                    setStatus('error');
                    addToast('Failed to poll progress: ' + err.message, 'error');
                }
            }, 1500);

        } catch (err) {
            setStatus('error');
            setErrorMsg(err.message);
            addToast('Failed to start processing: ' + err.message, 'error');
        }
    };

    const handleDownload = () => {
        if (!jobId || status !== 'complete') return;
        try {
            api.downloadVideo(jobId, file?.name);
            addToast('Download started', 'success');
        } catch (err) {
            addToast('Download failed: ' + err.message, 'error');
        }
    };

    const resetState = () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }
        setFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        setJobId(null);
        setMetadata(null);
        setStatus('idle');
        setProgress(0);
        setCurrentStage('');
        setCurrentFrame(0);
        setTotalFrames(0);
        setErrorMsg(null);
    };

    const isProcessing = status === 'uploading' || status === 'processing';
    const isReady = status === 'complete';

    return (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[400px_1fr] h-[calc(100vh-64px)] overflow-hidden">
            
            {/* LEFT SIDE PANEL: Upload Box and Metadata Card */}
            <aside className="h-full border-r border-white/5 bg-[#111112] p-6 flex flex-col gap-6 overflow-y-auto font-sans">
                
                {/* Drag / Drop Area */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Video File</h3>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="video/mp4" 
                        className="hidden" 
                        disabled={isProcessing}
                    />
                    
                    <div 
                        onClick={!isProcessing ? triggerFileSelect : undefined}
                        className={`
                            border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[180px]
                            ${file 
                                ? 'border-neo-accent bg-neo-accent/5' 
                                : 'border-white/10 hover:border-neo-accent/50 hover:bg-white/[0.01]'
                            }
                            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mb-4 text-gray-400">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        {file ? (
                            <div>
                                <p className="text-sm font-bold text-white max-w-[280px] truncate mb-1">{file.name}</p>
                                <p className="text-xs text-zinc-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm font-semibold text-white/90">Select Video File</p>
                                <p className="text-xs text-zinc-500 mt-1">Accepts only .mp4 format</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Metadata Settings Card */}
                {metadata && (
                    <div className="bg-[#18181b] border border-white/5 rounded-2xl p-5 shadow-neo-card">
                        <h4 className="text-sm font-bold tracking-wide text-white/95 mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4 text-neo-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Video Specifications
                        </h4>
                        
                        <div className="flex flex-col gap-3.5 text-sm font-medium">
                            <div className="flex justify-between py-1 border-b border-white/[0.03]">
                                <span className="text-zinc-500">Resolution</span>
                                <span className="text-white font-mono">{metadata.width} x {metadata.height}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-white/[0.03]">
                                <span className="text-zinc-500">Duration</span>
                                <span className="text-white font-mono">{metadata.duration.toFixed(2)}s</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-white/[0.03]">
                                <span className="text-zinc-500">Framerate</span>
                                <span className="text-white font-mono">{metadata.fps.toFixed(2)} fps</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-white/[0.03]">
                                <span className="text-zinc-500">Codec</span>
                                <span className="text-white font-mono uppercase">{metadata.codec}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-white/[0.03]">
                                <span className="text-zinc-500">Total Frames</span>
                                <span className="text-white font-mono">{metadata.frame_count}</span>
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            {/* RIGHT MAIN PANEL: Video Preview & Process controls */}
            <section className="h-full relative flex flex-col bg-neo-bg p-8 overflow-y-auto font-sans">
                
                {/* Top Action Bar (PROCESS Button) */}
                <div className="flex items-center justify-end mb-8 h-12">
                    {status === 'uploading' && (
                        <div className="text-sm font-medium tracking-wide text-neo-accent animate-pulse">
                            Uploading to server...
                        </div>
                    )}
                    
                    {status === 'processing' && (
                        <div className="flex items-center gap-3 text-neo-accent">
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-sm font-semibold">Processing pipeline active...</span>
                        </div>
                    )}
                    
                    {status === 'uploaded' && (
                        <button
                            onClick={handleProcess}
                            className="bg-neo-accent hover:bg-neo-accent-hover text-white px-8 py-2.5 rounded-lg font-bold text-sm tracking-wide shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
                        >
                            UPSCALE VIDEO
                        </button>
                    )}
                </div>

                {/* Display/Preview Container */}
                <div className="flex-1 flex flex-col min-h-0">
                    <h2 className="text-lg font-bold tracking-wide text-white/90 mb-4">VIDEO WORKSPACE</h2>
                    
                    <div className="w-full min-h-[360px] flex-1 rounded-2xl bg-[#0a0a0b] border border-white/5 relative flex items-center justify-center p-6 shadow-neo-card">
                        {!file ? (
                            <div className="text-center opacity-30 flex flex-col items-center">
                                <div className="w-16 h-16 mb-4 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <p className="text-sm">Upload a video to start upscaling</p>
                            </div>
                        ) : (
                            <div className="w-full max-w-[800px] flex flex-col gap-4">
                                <video 
                                    src={previewUrl} 
                                    controls 
                                    className="w-full rounded-xl border border-white/5 bg-black/40 shadow-neo-glow max-h-[460px] object-contain"
                                />
                            </div>
                        )}
                    </div>

                    {/* Progress details & State triggers */}
                    {(status === 'processing' || isReady || status === 'error') && (
                        <div className="mt-6 bg-[#141416] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
                            
                            {/* Current Stage Indicator */}
                            <div className="flex justify-between items-center text-sm font-semibold">
                                <div className="flex items-center gap-2 text-white/90">
                                    <span className="text-zinc-500">Stage:</span>
                                    <span className="text-neo-accent">{formatStage(currentStage) || 'Queued'}</span>
                                    {currentStage === 'upscaling' && totalFrames > 0 && (
                                        <span className="text-xs text-zinc-500 font-mono">
                                            ({currentFrame}/{totalFrames} frames)
                                        </span>
                                    )}
                                </div>
                                <div className="text-zinc-400 font-mono text-xs">
                                    {progress.toFixed(0)}%
                                </div>
                            </div>
                            
                            {/* Fluid Progress Bar */}
                            <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/[0.02]">
                                <div 
                                    className={`h-full transition-all duration-300 rounded-full ${
                                        status === 'error' ? 'bg-red-500' : 'bg-neo-accent shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            {/* Error messaging */}
                            {errorMsg && (
                                <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/25 rounded-lg p-3 font-medium">
                                    Error details: {errorMsg}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer bar containing Cancel/Download triggers */}
                    <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                        
                        <button
                            onClick={resetState}
                            disabled={isProcessing}
                            className={`
                                flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all border border-white/10 text-sm
                                ${isProcessing 
                                    ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed' 
                                    : 'bg-zinc-800 text-white hover:bg-zinc-700'
                                }
                            `}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Clear Video
                        </button>

                        <button
                            onClick={handleDownload}
                            disabled={!isReady}
                            className={`
                                flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm
                                ${!isReady 
                                    ? 'bg-zinc-800/50 text-zinc-650 cursor-not-allowed' 
                                    : 'bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/10'
                                }
                            `}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Video
                        </button>
                    </div>

                </div>
            </section>
        </div>
    );
};

export default VideoUpscalerPanel;
