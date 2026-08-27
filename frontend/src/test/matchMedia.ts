import { vi } from 'vitest';

/**
 * Controllable matchMedia stub used by `src/test/setup.ts`.
 *
 * The app's `useIsMobile` hook (hooks/use-mobile.ts) reads `(max-width: 767px)`
 * via `window.matchMedia`. By default the stub resolves to desktop (`matches: false`),
 * which preserves the behavior every existing test already expects. Tests that exercise
 * mobile-width behavior flip it with `setMatchMediaMobile(true)` BEFORE rendering.
 *
 * Usage (from a test file):
 *   import { setMatchMediaMobile } from '@/test/matchMedia';
 *   setMatchMediaMobile(true);
 */
let mobile = false;

/** Force every matchMedia query to resolve to `matches = isMobile`. */
export function setMatchMediaMobile(isMobile: boolean): void {
    mobile = isMobile;
}

/** Register the global stub. Called once from setup.ts. */
export function installMatchMediaStub(): void {
    vi.stubGlobal('matchMedia', (query: string): MediaQueryList => {
        const listeners = new Set<EventListener>();
        return {
            get matches() {
                return mobile;
            },
            media: query,
            onchange: null,
            addListener: (callback: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => {
                listeners.add(callback as unknown as EventListener);
            },
            removeListener: (callback: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => {
                listeners.delete(callback as unknown as EventListener);
            },
            addEventListener: (
                type: string,
                listener: EventListenerOrEventListenerObject,
                options?: boolean | AddEventListenerOptions,
            ) => {
                void type;
                void options;
                if (typeof listener === 'function') {
                    listeners.add(listener);
                }
            },
            removeEventListener: (
                type: string,
                listener: EventListenerOrEventListenerObject,
                options?: boolean | EventListenerOptions,
            ) => {
                void type;
                void options;
                if (typeof listener === 'function') {
                    listeners.delete(listener);
                }
            },
            dispatchEvent: () => true,
        };
    });
}

/** Reset to the desktop default (called after each test). */
export function resetMatchMedia(): void {
    mobile = false;
}
