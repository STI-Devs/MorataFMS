import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { installMatchMediaStub, resetMatchMedia } from './matchMedia';

// Controllable matchMedia stub (desktop default; tests flip via setMatchMediaMobile).
// The shadcn sidebar's useIsMobile hook (useSyncExternalStore on matchMedia) needs
// addEventListener/removeEventListener to subscribe.
installMatchMediaStub();

// recharts ResponsiveContainer needs ResizeObserver; happy-dom has none.
class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub);

afterEach(() => {
    cleanup();
    resetMatchMedia();
    vi.restoreAllMocks();
});
