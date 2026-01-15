import React from 'react';
import PropTypes from 'prop-types';

const RotationControls = ({ onRotateLeft, onRotateRight, onReset, rotation, disabled }) => {
    return (
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-zinc-900/50 border border-white/5">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Rotation
                </label>
                <span className="text-xs font-mono text-neo-accent">
                    {rotation}°
                </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {/* Rotate Left */}
                <button
                    onClick={onRotateLeft}
                    disabled={disabled}
                    className="flex items-center justify-center p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-800 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                    title="Rotate Left -90°"
                >
                    <svg className="w-5 h-5 group-hover:text-neo-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                </button>

                {/* Reset */}
                <button
                    onClick={onReset}
                    disabled={disabled}
                    className="flex items-center justify-center p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-800 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                    title="Reset Rotation"
                >
                    <svg className="w-5 h-5 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>

                {/* Rotate Right */}
                <button
                    onClick={onRotateRight}
                    disabled={disabled}
                    className="flex items-center justify-center p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-800 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                    title="Rotate Right +90°"
                >
                    <svg className="w-5 h-5 group-hover:text-neo-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

RotationControls.propTypes = {
    onRotateLeft: PropTypes.func.isRequired,
    onRotateRight: PropTypes.func.isRequired,
    onReset: PropTypes.func.isRequired,
    rotation: PropTypes.number.isRequired,
    disabled: PropTypes.bool
};

export default RotationControls;
