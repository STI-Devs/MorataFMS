import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { appRoutes } from '../../../../lib/appRoutes';
import {
    useNotarialGeneratedDocument,
    useNotarialGeneratedDocumentEditorConfig,
} from '../../hooks/useLegalWorkspace';
import { loadOnlyOfficeScript } from '../../utils/onlyOffice';

const editorElementId = 'onlyoffice-generated-document-editor';

const formatSavedTimestamp = (value: string | null): string => {
    if (!value) {
        return 'No app save yet';
    }

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(new Date(value));
};

export const NotarialGeneratedDocumentEditorPage = () => {
    const { documentId } = useParams();
    const numericDocumentId = Number(documentId);
    const validDocumentId = Number.isFinite(numericDocumentId) && numericDocumentId > 0 ? numericDocumentId : null;
    const generatedDocumentQuery = useNotarialGeneratedDocument(validDocumentId);
    const editorConfigQuery = useNotarialGeneratedDocumentEditorConfig(validDocumentId);
    const editorInstanceRef = useRef<{ destroyEditor?: () => void } | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    const generatedDocument = generatedDocumentQuery.data;
    const storageSavedAt = generatedDocument?.generated_at ?? generatedDocument?.updated_at ?? null;
    const savedStatusLabel = generatedDocumentQuery.isError
        ? 'Unable to check app save'
        : `App storage saved ${formatSavedTimestamp(storageSavedAt)}`;
    const savedDetailLabel = generatedDocument?.generated_file.formatted_size
        ? `${generatedDocument.generated_file.formatted_size} stored copy`
        : 'Checking stored copy';

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
        <div className="relative h-screen min-h-screen overflow-hidden bg-white">
            <h1 className="sr-only">Draft #{validDocumentId}</h1>

            <Link
                to={appRoutes.paralegalGeneratedDocuments}
                className="fixed right-5 top-4 z-20 rounded-lg border border-neutral-200 bg-white/95 px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm backdrop-blur transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900/15"
            >
                Back to Generated Documents
            </Link>

            <div className="fixed bottom-4 left-4 z-20 max-w-[calc(100vw-2rem)] rounded-xl border border-neutral-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
                <div className="flex items-center gap-2">
                    <span
                        className={[
                            'h-2 w-2 shrink-0 rounded-full',
                            generatedDocumentQuery.isError
                                ? 'bg-red-500'
                                : generatedDocumentQuery.isFetching
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500',
                        ].join(' ')}
                    />
                    <span className="font-semibold text-neutral-900">{savedStatusLabel}</span>
                </div>
                <p className="mt-0.5 text-neutral-500">
                    {generatedDocumentQuery.isFetching ? 'Checking backend copy...' : savedDetailLabel}
                </p>
            </div>

            {editorConfigQuery.isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-text-muted">
                    Loading Word editor...
                </div>
            ) : null}

            {editorConfigQuery.isError || loadError ? (
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
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
                    'h-full w-full bg-white',
                    editorConfigQuery.isLoading || editorConfigQuery.isError || loadError ? 'hidden' : '',
                ].join(' ')}
            />
        </div>
    );
};
