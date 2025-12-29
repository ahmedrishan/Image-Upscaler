import React, { useEffect, useState } from 'react';
import api from '../../services/api';

/**
 * ConnectionStatus Component
 * Monitors backend health and displays a disconnected state if offline.
 */
const ConnectionStatus = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [lastChecked, setLastChecked] = useState(Date.now());

    useEffect(() => {
        const checkConnection = async () => {
            try {
                await api.checkHealth();
                setIsOnline(true);
            } catch (error) {
                setIsOnline(false);
            }
            setLastChecked(Date.now());
        };

        // Initial check
        checkConnection();

        // Poll every 5 seconds
        const interval = setInterval(checkConnection, 5000);
        return () => clearInterval(interval);
    }, []);

    if (isOnline) {
        return (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs font-medium text-green-400">Backend Online</span>
            </div>
        );
    }

    // Disconnected Banner / Overlay
    return (
        <div className="fixed inset-x-0 top-0 z-50 bg-red-600 text-white px-4 py-2 text-center shadow-lg animate-slide-down">
            <div className="flex items-center justify-center gap-2">
                <svg width="20" height="20" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-bold text-sm">Backend Disconnected</span>
                <span className="text-xs opacity-90 hidden sm:inline">- Please ensure the Python server is running on localhost:8000</span>
            </div>
        </div>
    );
};

export default ConnectionStatus;
