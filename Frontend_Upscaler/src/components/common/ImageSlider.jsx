import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * ImageSlider (ImageCompare) Component
 * Comparison slider with Neo design.
 */
const ImageSlider = ({ beforeImage, afterImage }) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef(null);

    const handleMouseDown = useCallback(() => setIsResizing(true), []);
    const handleMouseUp = useCallback(() => setIsResizing(false), []);

    const handleMouseMove = useCallback((e) => {
        if (!isResizing || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percentage = (x / rect.width) * 100;

        setSliderPosition(percentage);
    }, [isResizing]);

    const handleTouchMove = useCallback((e) => {
        if (!isResizing || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const touch = e.touches[0];
        const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
        const percentage = (x / rect.width) * 100;
        setSliderPosition(percentage);
    }, [isResizing]);

    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('touchend', handleMouseUp);
        document.addEventListener('touchmove', handleTouchMove);

        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('touchend', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
        };
    }, [handleMouseUp, handleMouseMove, handleTouchMove]);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-[500px] border border-white/10 rounded-xl overflow-hidden shadow-2xl select-none bg-black group"
        >
            {/* After Image (Background) */}
            <div className="absolute inset-0 flex items-center justify-center bg-black">
                <img
                    src={afterImage}
                    alt="After"
                    className="w-full h-full object-contain"
                    draggable={false}
                />
            </div>

            {/* Before Image (Clipped overlay) */}
            <div
                className="absolute inset-0 w-full h-full flex items-center justify-center bg-black"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
                <img
                    src={beforeImage}
                    alt="Before"
                    className="w-full h-full object-contain"
                    draggable={false}
                />
            </div>

            {/* Labels overlay - only visible if needed, but prompts requested specific labels outside or inside?
               "Comparison slider visually central... Show resolution text below"
               The prompt says "Top row labeled Before... After". Since we are inside the slider, let's keep minimal labels or rely on the parent to show big header labels.
               I will keep minimal semi-transparent labels inside for context.
            */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-white font-medium">
                BEFORE
            </div>
            <div className="absolute top-4 right-4 bg-neo-accent/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-white font-medium shadow-neo-glow">
                AFTER
            </div>

            {/* Slider Handle */}
            <div
                className="absolute top-0 bottom-0 cursor-ew-resize z-20"
                style={{ left: `${sliderPosition}%` }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
            >
                {/* Vertical Line */}
                <div className="absolute inset-y-0 -left-px w-0.5 bg-neo-accent shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>

                {/* Handle Circle */}
                <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-8 h-8 rounded-full bg-black border-2 border-neo-accent shadow-neo-glow flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
                    <div className="w-1.5 h-1.5 bg-neo-accent rounded-full mb-0.5"></div>
                </div>
            </div>
        </div>
    );
};

ImageSlider.propTypes = {
    beforeImage: PropTypes.string.isRequired,
    afterImage: PropTypes.string.isRequired
};

export default ImageSlider;
