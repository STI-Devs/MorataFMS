import { useCallback, useState } from 'react';

export const TRACKING_VIEW_MODE_STORAGE_KEY = 'morata_tracking_view_mode';

export type TrackingViewMode = 'grouped' | 'flat';

function getInitialViewMode(): TrackingViewMode {
    if (typeof window === 'undefined') return 'grouped';
    try {
        const saved = localStorage.getItem(TRACKING_VIEW_MODE_STORAGE_KEY);
        if (saved === 'flat' || saved === 'grouped') {
            return saved;
        }
    } catch {
        // Ignore localStorage read errors
    }
    return 'grouped';
}

export function useTrackingViewMode(): [TrackingViewMode, (mode: TrackingViewMode) => void] {
    const [viewMode, setViewModeState] = useState<TrackingViewMode>(getInitialViewMode);

    const setViewMode = useCallback((mode: TrackingViewMode) => {
        setViewModeState(mode);
        try {
            localStorage.setItem(TRACKING_VIEW_MODE_STORAGE_KEY, mode);
        } catch {
            // Ignore localStorage write errors
        }
    }, []);

    return [viewMode, setViewMode];
}
