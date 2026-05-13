declare global {
    interface Window {
        DocsAPI?: {
            DocEditor: new (
                elementId: string,
                config: Record<string, unknown>,
            ) => {
                destroyEditor?: () => void;
            };
        };
    }
}

export const loadOnlyOfficeScript = (documentServerUrl: string): Promise<void> =>
    new Promise((resolve, reject) => {
        if (window.DocsAPI?.DocEditor) {
            resolve();
            return;
        }

        const source = `${documentServerUrl.replace(/\/$/, '')}/web-apps/apps/api/documents/api.js`;
        const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${source}"]`);

        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(), { once: true });
            existingScript.addEventListener('error', () => reject(new Error('Unable to load ONLYOFFICE editor script.')), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = source;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Unable to load ONLYOFFICE editor script.'));
        document.body.appendChild(script);
    });
