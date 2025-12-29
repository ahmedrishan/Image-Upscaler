import React, { useState, useEffect } from 'react';
import api from './services/api';
import useUpscaler from './hooks/useUpscaler';
import UploadBox from './components/modules/UploadBox';
import SettingsPanel from './components/modules/SettingsPanel';
import ImageSlider from './components/common/ImageSlider';
import Toast from './components/feedback/Toast';

function App() {
    const [toasts, setToasts] = useState([]);
    const [denoisingEnabled, setDenoisingEnabled] = useState(false);
    const [history, setHistory] = useState([]); // Mock history for now

    // Add toast
    const addToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        // Auto remove
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const {
        status,
        progressMessage,
        result,
        currentFile,
        handleFileSelect,
        processImage,
        reset
    } = useUpscaler(addToast);

    // Mock history update on completion
    useEffect(() => {
        if (status === 'complete' && result) {
            setHistory(prev => [
                { id: Date.now(), src: result.upscaled, original: result.original },
                ...prev.slice(0, 5) // Keep last 6
            ]);
        }
    }, [status, result]);

    const handleDownload = () => {
        if (result?.upscaled) {
            api.downloadImage(result.upscaled, `neo-upscale-${Date.now()}.png`);
            addToast('Download started', 'success');
        }
    };

    const isProcessing = status === 'uploading' || status === 'processing';
    const isReady = status === 'complete' && result;

    return (
        <div className="min-h-screen bg-neo-bg text-white selection:bg-neo-accent/30 font-sans flex flex-col overflow-hidden">

            {/* --- HEADER --- */}
            <header className="h-16 border-b border-white/5 px-8 flex items-center justify-between bg-neo-bg/95 backdrop-blur z-50">
                <div className="flex items-center gap-3">
                    <div className="text-xl font-bold tracking-tight">
                        TEDDY <span className="font-light text-gray-400">UPSCALER</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-white/5">
                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                    <span className="text-xs font-medium text-gray-400">Offline / Ready</span>
                </div>
            </header>

            {/* --- MAIN LAYOUT --- */}
            <main className="flex-1 grid grid-cols-1 lg:grid-cols-[400px_1fr] h-[calc(100vh-64px)] overflow-hidden">

                {/* LEFT PANEL: Upload & Settings */}
                <aside className="h-full border-r border-white/5 bg-[#111112] p-6 flex flex-col gap-6 overflow-y-auto">

                    {/* Upload Section */}
                    <section>
                        <UploadBox
                            onFileSelect={handleFileSelect}
                            currentFile={currentFile}
                            disabled={isProcessing}
                        />
                    </section>

                    {/* Settings Section */}
                    <section>
                        <SettingsPanel
                            modelName="RealESRGAN_x4plus"
                            scale={4}
                            denoisingEnabled={denoisingEnabled}
                            onDenoisingChange={setDenoisingEnabled}
                            disabled={isProcessing}
                        />
                    </section>
                </aside>

                {/* RIGHT PANEL: Processing & Compare */}
                <section className="h-full relative flex flex-col bg-neo-bg p-8 overflow-y-auto">

                    {/* Top Bar: Actions */}
                    <div className="flex items-center justify-end mb-8 h-12">
                        {isProcessing ? (
                            <div className="flex items-center gap-3 text-neo-accent animate-pulse">
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-sm font-medium tracking-wide">Processing... 60%</span>
                            </div>
                        ) : (
                            <button
                                onClick={processImage}
                                disabled={!currentFile || isProcessing || isReady}
                                className={`
                                    px-8 py-2.5 rounded-lg font-bold text-sm tracking-wide transition-all duration-300
                                    ${!currentFile
                                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                        : 'bg-neo-accent hover:bg-neo-accent-hover text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:-translate-y-0.5'
                                    }
                                `}
                            >
                                UPSCALE
                            </button>
                        )}
                    </div>

                    {/* Compare Area */}
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Title Row */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold tracking-wide text-white/90">COMPARE</h2>
                            {isReady && (
                                <div className="flex gap-8 text-xs text-zinc-500 font-mono">
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-zinc-600" />
                                        Original: 1024x768
                                    </span>
                                    <span className="flex items-center gap-2 text-neo-accent">
                                        <span className="w-2 h-2 rounded-full bg-neo-accent" />
                                        Upscaled: 4096x3072
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Visulization Container */}
                        <div className="flex-1 rounded-2xl bg-[#0a0a0b] border border-white/5 relative flex items-center justify-center p-4">
                            {!currentFile ? (
                                <div className="text-center opacity-30">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center">
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <p>Select an image to preview</p>
                                </div>
                            ) : isReady ? (
                                <ImageSlider
                                    beforeImage={result.original}
                                    afterImage={result.upscaled}
                                />
                            ) : (
                                /* Preview of uploaded image before active processing */
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <img
                                        src={URL.createObjectURL(currentFile)}
                                        className="max-h-full max-w-full object-contain opacity-50 blur-sm transition-all duration-700 data-[loaded=true]:blur-0 data-[loaded=true]:opacity-100"
                                        alt="Preview"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Footer / History in right panel bottom? No, prompt says "Footer - History & Download" */}
                        {/* Let's put the footer inside this right column at the bottom */}
                        <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between gap-4">

                            {/* New Image Button */}
                            <button
                                onClick={reset}
                                disabled={!currentFile}
                                className={`
                                    flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all border border-white/10
                                    ${!currentFile
                                        ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                                        : 'bg-zinc-800 text-white hover:bg-zinc-700'
                                    }
                                `}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                New Image
                            </button>

                            {/* Download Button */}
                            <button
                                onClick={handleDownload}
                                disabled={!isReady}
                                className={`
                                    flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all
                                    ${!isReady
                                        ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                                        : 'bg-white text-black hover:bg-gray-200 shadow-lg shadow-white/10'
                                    }
                                `}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                            </button>

                            {/* History Gallery */}
                            <div className="flex gap-3">
                                {history.map((item, idx) => (
                                    <div key={idx} className="w-12 h-12 rounded-lg border border-white/10 overflow-hidden relative cursor-pointer hover:ring-2 ring-neo-accent transition-all">
                                        <img src={item.src} className="w-full h-full object-cover" alt="History" />
                                    </div>
                                ))}
                                {history.length === 0 && (
                                    <span className="text-xs text-zinc-600 self-center">No history yet</span>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} className="pointer-events-auto animate-fade-in-up">
                        <Toast
                            message={toast.message}
                            type={toast.type}
                            onClose={() => removeToast(toast.id)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
