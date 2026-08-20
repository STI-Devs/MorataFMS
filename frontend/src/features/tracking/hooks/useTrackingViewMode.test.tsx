import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { TRACKING_VIEW_MODE_STORAGE_KEY, useTrackingViewMode } from './useTrackingViewMode';

describe('useTrackingViewMode', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('defaults to grouped mode when no preference is cached in localStorage', () => {
        const { result } = renderHook(() => useTrackingViewMode());
        expect(result.current[0]).toBe('grouped');
    });

    it('reads cached flat mode preference from localStorage on mount', () => {
        localStorage.setItem(TRACKING_VIEW_MODE_STORAGE_KEY, 'flat');
        const { result } = renderHook(() => useTrackingViewMode());
        expect(result.current[0]).toBe('flat');
    });

    it('persists viewMode changes to localStorage and updates state', () => {
        const { result } = renderHook(() => useTrackingViewMode());
        expect(result.current[0]).toBe('grouped');

        act(() => {
            result.current[1]('flat');
        });

        expect(result.current[0]).toBe('flat');
        expect(localStorage.getItem(TRACKING_VIEW_MODE_STORAGE_KEY)).toBe('flat');

        act(() => {
            result.current[1]('grouped');
        });

        expect(result.current[0]).toBe('grouped');
        expect(localStorage.getItem(TRACKING_VIEW_MODE_STORAGE_KEY)).toBe('grouped');
    });
});
