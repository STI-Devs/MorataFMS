declare global {
    interface Window {
        turnstile?: {
            render: (
                container: HTMLElement,
                options: {
                    sitekey: string;
                    theme?: 'auto' | 'light' | 'dark';
                    callback?: (token: string) => void;
                    'expired-callback'?: () => void;
                    'error-callback'?: () => void;
                    'timeout-callback'?: () => void;
                },
            ) => string;
            reset: (widgetId?: string) => void;
            remove?: (widgetId?: string) => void;
        };
    }
}

export {};
