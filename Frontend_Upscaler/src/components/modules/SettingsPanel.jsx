import React from 'react';
import PropTypes from 'prop-types';

/**
 * SettingsPanel Component
 * Displays configuration controls for the upscaling process.
 */
const SettingsPanel = ({
    modelName = "RealESRGAN_x4plus",
    scale = 4,
    denoisingEnabled = false,
    onDenoisingChange,
    disabled = false
}) => {
    return (
        <div className="w-full relative group">
            {/* Validating the "Card with thin glowing border (blue)" requirement */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-neo-accent to-blue-400 rounded-2xl opacity-30 group-hover:opacity-50 blur transition duration-500"></div>
            <div className="relative p-6 bg-neo-card rounded-2xl border border-white/5">
                <h3 className="text-sm font-medium text-gray-400 mb-4">
                    Settings
                </h3>

                <div className="space-y-4">
                    {/* Model Info */}
                    <div className="space-y-1">
                        <label className="text-xs text-gray-500 uppercase tracking-wide">Model</label>
                        <div className="text-sm font-medium text-white flex items-center justify-between">
                            <span>{modelName}</span>
                            <span className="text-neo-accent">x{scale}</span>
                        </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    {/* Denoising Toggle */}
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-300">Denoising</label>
                        <button
                            onClick={() => !disabled && onDenoisingChange(!denoisingEnabled)}
                            className={`w-11 h-6 rounded-full transition-colors relative ${denoisingEnabled ? 'bg-neo-accent' : 'bg-zinc-700'
                                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            disabled={disabled}
                        >
                            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${denoisingEnabled ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

SettingsPanel.propTypes = {
    modelName: PropTypes.string,
    scale: PropTypes.number,
    denoisingEnabled: PropTypes.bool,
    onDenoisingChange: PropTypes.func, // Make optional to avoid propTypes warning if not immediately passed
    disabled: PropTypes.bool
};

export default SettingsPanel;
