import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Toast Component
 * Displays temporary feedback messages to the user.
 * 
 * @param {Object} props
 * @param {string} props.message - The message text.
 * @param {'success'|'error'|'info'|'warning'} props.type - The type of message.
 * @param {Function} props.onClose - Handler to close the toast.
 * @param {number} props.duration - Duration in ms before auto-close.
 */
const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const styles = {
        success: 'bg-green-500/10 border-green-500 text-green-400',
        error: 'bg-red-500/10 border-red-500 text-red-400',
        warning: 'bg-yellow-500/10 border-yellow-500 text-yellow-400',
        info: 'bg-blue-500/10 border-blue-500 text-blue-400'
    };

    const icons = {
        success: (
            <svg width="20" height="20" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        ),
        error: (
            <svg width="20" height="20" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        ),
        warning: (
            <svg width="20" height="20" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        info: (
            <svg width="20" height="20" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-in-right">
            <div className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-md
        ${styles[type]}
      `}>
                <div className="flex-shrink-0">
                    {icons[type]}
                </div>
                <p className="text-sm font-medium">{message}</p>
                <button
                    onClick={onClose}
                    className="ml-4 hover:opacity-70 transition-opacity"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

Toast.propTypes = {
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['success', 'error', 'info', 'warning']),
    onClose: PropTypes.func.isRequired,
    duration: PropTypes.number
};

export default Toast;
