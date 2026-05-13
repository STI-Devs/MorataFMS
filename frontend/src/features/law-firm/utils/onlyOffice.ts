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

const invalidDocumentServerUrlMessage = 'ONLYOFFICE document server URL must be an absolute http(s) URL.';

export const normalizeOnlyOfficeDocumentServerUrl = (documentServerUrl: string): string => {
    const trimmedDocumentServerUrl = documentServerUrl.trim();

    if (trimmedDocumentServerUrl === '') {
        throw new Error('ONLYOFFICE document server is not configured.');
    }

    let parsedDocumentServerUrl: URL;

    try {
        parsedDocumentServerUrl = new URL(trimmedDocumentServerUrl);
    } catch {
        throw new Error(invalidDocumentServerUrlMessage);
    }

    if (!['http:', 'https:'].includes(parsedDocumentServerUrl.protocol) || parsedDocumentServerUrl.hostname === '') {
        throw new Error(invalidDocumentServerUrlMessage);
    }

    if (parsedDocumentServerUrl.origin === window.location.origin) {
        throw new Error('ONLYOFFICE_DOCUMENT_SERVER_URL points to this app. Set it to the dedicated ONLYOFFICE service URL.');
    }

    return parsedDocumentServerUrl.toString().replace(/\/$/, '');
};

export const loadOnlyOfficeScript = (documentServerUrl: string): Promise<void> =>
    new Promise((resolve, reject) => {
        let normalizedDocumentServerUrl: string;

        try {
            normalizedDocumentServerUrl = normalizeOnlyOfficeDocumentServerUrl(documentServerUrl);
        } catch (error: unknown) {
            reject(error instanceof Error ? error : new Error('Unable to load ONLYOFFICE editor script.'));
            return;
        }

        if (window.DocsAPI?.DocEditor) {
            resolve();
            return;
        }

        const source = `${normalizedDocumentServerUrl}/web-apps/apps/api/documents/api.js`;
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
