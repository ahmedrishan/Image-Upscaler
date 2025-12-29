import React from 'react';
import PropTypes from 'prop-types';

/**
 * ActionBar Component
 * Contains the primary action button to trigger upscaling and status indicators.
 * 
 * @param {Object} props
 * @param {Function} props.onUpscale - Handler to trigger upscaling.
 * @param {boolean} props.isProcessing - Whether the backend is currently processing.
 * @param {boolean} props.disabled - Whether the action should be disabled (e.g. no image).
 */
const ActionBar = ({ onUpscale, isProcessing, disabled }) => {
    return (
        <div className="w-full mt-6">
            <button
                onClick={onUpscale}
                disabled={disabled || isProcessing}
                className={`
          relative w-full py-3 px-6 rounded-xl font-bold text-base tracking-wide shadow-lg
          flex items-center justify-center gap-3 transition-all duration-300
          ${disabled
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-500/20 hover:shadow-purple-500/40 active:scale-[0.99]'
                    }
        `}
            >
                {isProcessing ? (
                    <>
                        <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Upscaling...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Upscale Image</span>
                    </>
                )}
            </button>

            {/* Optional: Descriptive status text could go here */}
            {isProcessing && (
                <p className="text-center text-xs text-zinc-500 mt-2 animate-pulse">
                    Processing with RealESRGAN x4 using CUDA...
                </p>
            )}
        </div>
    );
};

ActionBar.propTypes = {
    onUpscale: PropTypes.func.isRequired,
    isProcessing: PropTypes.bool.isRequired,
    disabled: PropTypes.bool
};

export default ActionBar;
