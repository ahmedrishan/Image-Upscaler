import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * UploadBox Component
 * Handles file drag & drop and selection. Matches the Neo design style.
 */
const UploadBox = ({ onFileSelect, currentFile, disabled = false }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);

    React.useEffect(() => {
        if (currentFile) {
            const url = URL.createObjectURL(currentFile);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl(null);
        }
    }, [currentFile]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                onFileSelect(file);
            }
        }
    }, [onFileSelect, disabled]);

    const handleFileInput = useCallback((e) => {
        if (disabled) return;
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    }, [onFileSelect, disabled]);

    return (
        <div className="relative group w-full">
            {/* Glow effect for the box */}
            <div className={`absolute -inset-0.5 bg-gradient-to-b from-neo-accent to-blue-500 rounded-2xl opacity-20 blur transition duration-500 ${isDragging ? 'opacity-60' : 'group-hover:opacity-40'}`}></div>

            <div
                className={`relative w-full aspect-square md:aspect-[4/3] rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300
                    ${isDragging
                        ? 'border-neo-accent bg-neo-accent/5'
                        : 'border-neo-accent/30 bg-[#121212]/80 hover:bg-[#121212]/50'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !previewUrl && document.getElementById('file-upload').click()}
            >
                {previewUrl ? (
                    <div className="relative w-full h-full p-2 group/preview">
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-contain rounded-xl"
                        />
                        {/* Overlay to replace image */}
                        {!disabled && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-opacity rounded-xl backdrop-blur-sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    document.getElementById('file-upload').click();
                                }}
                            >
                                <p className="text-white font-medium">Click to Replace</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                        <div className="mb-6">
                            {/* Cloud Icon */}
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/80">
                                <path d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.132 20.177 10.244 17.819 10.034C17.657 6.618 14.826 4 11.5 4C8.455 4 5.816 6.222 5.257 9.155C2.316 9.605 0 12.149 0 15.143C0 18.297 2.656 20 5.857 20H17.5V19Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12 12V16M12 12L10 14M12 12L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`${isDragging ? 'animate-bounce' : ''}`} />
                            </svg>
                        </div>

                        <p className="text-xl font-medium text-white mb-2">
                            Drag & Drop Img Here
                        </p>

                        <button className="mt-4 px-6 py-2.5 bg-neo-accent hover:bg-neo-accent-hover text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20">
                            Upload Image
                        </button>

                        <p className="mt-4 text-xs text-gray-400">
                            Supported formats: PNG, JPEG
                        </p>
                    </div>
                )}

                <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileInput}
                    accept="image/*"
                    disabled={disabled}
                />
            </div>
        </div>
    );
};

UploadBox.propTypes = {
    onFileSelect: PropTypes.func.isRequired,
    currentFile: PropTypes.object,
    disabled: PropTypes.bool
};

export default UploadBox;
