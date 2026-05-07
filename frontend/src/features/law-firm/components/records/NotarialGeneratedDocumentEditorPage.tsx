import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { appRoutes } from '../../../../lib/appRoutes';
import { useNotarialGeneratedDocumentEditorConfig } from '../../hooks/useLegalWorkspace';

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

const editorElementId = 'onlyoffice-generated-document-editor';

const loadOnlyOfficeScript = (documentServerUrl: string): Promise<void> =>
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

export const NotarialGeneratedDocumentEditorPage = () => {
    const { documentId } = useParams();
    const numericDocumentId = Number(documentId);
    const validDocumentId = Number.isFinite(numericDocumentId) && numericDocumentId > 0 ? numericDocumentId : null;
    const editorConfigQuery = useNotarialGeneratedDocumentEditorConfig(validDocumentId);
    const editorInstanceRef = useRef<{ destroyEditor?: () => void } | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        const editorConfig = editorConfigQuery.data;

        if (!editorConfig) {
            return;
        }

        let cancelled = false;
        void loadOnlyOfficeScript(editorConfig.document_server_url)
            .then(() => {
                if (cancelled || !window.DocsAPI?.DocEditor) {
                    return;
                }

                setLoadError(null);
                editorInstanceRef.current?.destroyEditor?.();
                editorInstanceRef.current = new window.DocsAPI.DocEditor(editorElementId, editorConfig.config);
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    setLoadError(error instanceof Error ? error.message : 'Unable to load ONLYOFFICE editor.');
                }
            });

        return () => {
            cancelled = true;
            editorInstanceRef.current?.destroyEditor?.();
            editorInstanceRef.current = null;
        };
    }, [editorConfigQuery.data]);

    if (validDocumentId === null) {
        return (
            <div className="flex min-h-full items-center justify-center p-8">
                <p className="text-sm font-semibold text-text-primary">Invalid generated document.</p>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-1rem)] min-h-[720px] flex-col bg-app-bg">
            <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">ONLYOFFICE Editor</p>
                    <h1 className="text-lg font-bold text-text-primary">Draft #{validDocumentId}</h1>
                </div>
                <Link
                    to={appRoutes.paralegalGeneratedDocuments}
                    className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-secondary/20"
                >
                    Back to Generated Documents
                </Link>
            </div>

            {editorConfigQuery.isLoading ? (
                <div className="flex flex-1 items-center justify-center text-sm font-semibold text-text-muted">
                    Loading Word editor...
                </div>
            ) : null}

            {editorConfigQuery.isError || loadError ? (
                <div className="flex flex-1 items-center justify-center p-8 text-center">
                    <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-5">
                        <p className="text-sm font-semibold text-red-700">Unable to open the editor.</p>
                        <p className="mt-2 text-sm text-red-600">
                            {loadError ?? 'Check the ONLYOFFICE document server configuration and try again.'}
                        </p>
                    </div>
                </div>
            ) : null}

            <div
                id={editorElementId}
                className={[
                    'min-h-0 flex-1 bg-white',
                    editorConfigQuery.isLoading || editorConfigQuery.isError || loadError ? 'hidden' : '',
                ].join(' ')}
            />
        </div>
    );
};
