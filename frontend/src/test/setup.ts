import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Desktop default: the shadcn sidebar's useIsMobile hook (useSyncExternalStore
// on matchMedia) needs addEventListener/removeEventListener to subscribe.
vi.stubGlobal('matchMedia', (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
}));

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});
