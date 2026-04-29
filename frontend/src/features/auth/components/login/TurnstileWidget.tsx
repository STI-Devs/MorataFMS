import { useEffect, useRef, useState } from 'react';

const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let turnstileScriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
    if (typeof window === 'undefined') {
        return Promise.resolve();
    }

    if (window.turnstile) {
        return Promise.resolve();
    }

    if (turnstileScriptPromise) {
        return turnstileScriptPromise;
    }

    turnstileScriptPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SCRIPT_SRC}"]`);

        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(), { once: true });
            existingScript.addEventListener('error', () => reject(new Error('Failed to load Turnstile.')), { once: true });

            return;
        }

        const script = document.createElement('script');
        script.src = TURNSTILE_SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Turnstile.'));

        document.head.appendChild(script);
    });

    return turnstileScriptPromise;
}

interface TurnstileWidgetProps {
    onTokenChange: (token: string | null) => void;
    resetCounter: number;
    siteKey: string;
}

export function TurnstileWidget({ onTokenChange, resetCounter, siteKey }: TurnstileWidgetProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [hasLoadError, setHasLoadError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        void loadTurnstileScript()
            .then(() => {
                if (!isMounted || !containerRef.current || !window.turnstile || widgetIdRef.current) {
                    return;
                }

                widgetIdRef.current = window.turnstile.render(containerRef.current, {
                    sitekey: siteKey,
                    theme: 'dark',
                    callback: (token: string) => {
                        onTokenChange(token);
                    },
                    'expired-callback': () => {
                        onTokenChange(null);
                    },
                    'error-callback': () => {
                        onTokenChange(null);
                    },
                    'timeout-callback': () => {
                        onTokenChange(null);
                    },
                });
            })
            .catch(() => {
                if (!isMounted) {
                    return;
                }

                setHasLoadError(true);
                onTokenChange(null);
            });

        return () => {
            isMounted = false;
            onTokenChange(null);

            if (widgetIdRef.current && window.turnstile?.remove) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }
        };
    }, [onTokenChange, siteKey]);

    useEffect(() => {
        if (resetCounter === 0 || !widgetIdRef.current || !window.turnstile) {
            return;
        }

        onTokenChange(null);
        window.turnstile.reset(widgetIdRef.current);
    }, [onTokenChange, resetCounter]);

    if (hasLoadError) {
        return (
            <div className="border border-red-400/30 bg-red-500/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-red-300">
                Security check failed to load. Refresh and try again.
            </div>
        );
    }

    return <div ref={containerRef} className="min-h-[66px]" />;
}
