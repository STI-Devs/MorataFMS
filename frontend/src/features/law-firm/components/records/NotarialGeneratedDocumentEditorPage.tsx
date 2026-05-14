import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    useNotarialGeneratedDocument,
    useNotarialGeneratedDocumentEditorConfig,
} from '../../hooks/useLegalWorkspace';
import { loadOnlyOfficeScript } from '../../utils/onlyOffice';

const editorElementId = 'onlyoffice-generated-document-editor';
const floatingBadgeMargin = 16;
const floatingBadgeFallbackWidth = 320;
const floatingBadgeFallbackHeight = 72;

type FloatingBadgePosition = {
    x: number;
    y: number;
};

type FloatingBadgeDragState = {
    offsetX: number;
    offsetY: number;
};

const getFloatingBadgeWidth = (viewportWidth: number): number =>
    Math.min(floatingBadgeFallbackWidth, Math.max(220, viewportWidth - (floatingBadgeMargin * 2)));

const clampFloatingBadgePosition = (
    position: FloatingBadgePosition,
    viewportWidth: number,
    viewportHeight: number,
    badgeWidth: number,
    badgeHeight: number,
): FloatingBadgePosition => ({
    x: Math.min(
        Math.max(floatingBadgeMargin, position.x),
        Math.max(floatingBadgeMargin, viewportWidth - badgeWidth - floatingBadgeMargin),
    ),
    y: Math.min(
        Math.max(floatingBadgeMargin, position.y),
        Math.max(floatingBadgeMargin, viewportHeight - badgeHeight - floatingBadgeMargin),
    ),
});

const getDefaultFloatingBadgePosition = (
    viewportWidth: number,
    viewportHeight: number,
): FloatingBadgePosition =>
    clampFloatingBadgePosition(
        {
            x: viewportWidth - getFloatingBadgeWidth(viewportWidth) - floatingBadgeMargin,
            y: viewportHeight - floatingBadgeFallbackHeight - floatingBadgeMargin,
        },
        viewportWidth,
        viewportHeight,
        getFloatingBadgeWidth(viewportWidth),
        floatingBadgeFallbackHeight,
    );

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
    const floatingBadgeRef = useRef<HTMLDivElement | null>(null);
    const floatingBadgeDragStateRef = useRef<FloatingBadgeDragState | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [floatingBadgePosition, setFloatingBadgePosition] = useState<FloatingBadgePosition | null>(null);
    const [isDraggingFloatingBadge, setIsDraggingFloatingBadge] = useState(false);

    const generatedDocument = generatedDocumentQuery.data;
    const storageSavedAt = generatedDocument?.generated_at ?? generatedDocument?.updated_at ?? null;
    const savedStatusLabel = generatedDocumentQuery.isError
        ? 'Unable to check app save'
        : `App storage saved ${formatSavedTimestamp(storageSavedAt)}`;
    const savedDetailLabel = generatedDocument?.generated_file.formatted_size
        ? `${generatedDocument.generated_file.formatted_size} stored copy`
        : 'Checking stored copy';

    useEffect(() => {
        const syncFloatingBadgePosition = () => {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const badgeWidth = floatingBadgeRef.current?.offsetWidth ?? getFloatingBadgeWidth(viewportWidth);
            const badgeHeight = floatingBadgeRef.current?.offsetHeight ?? floatingBadgeFallbackHeight;

            setFloatingBadgePosition((currentPosition) => {
                if (currentPosition === null) {
                    return getDefaultFloatingBadgePosition(viewportWidth, viewportHeight);
                }

                return clampFloatingBadgePosition(
                    currentPosition,
                    viewportWidth,
                    viewportHeight,
                    badgeWidth,
                    badgeHeight,
                );
            });
        };

        syncFloatingBadgePosition();
        window.addEventListener('resize', syncFloatingBadgePosition);

        return () => {
            window.removeEventListener('resize', syncFloatingBadgePosition);
        };
    }, []);

    useEffect(() => {
        if (!isDraggingFloatingBadge) {
            return;
        }

        const handlePointerMove = (event: PointerEvent) => {
            const dragState = floatingBadgeDragStateRef.current;

            if (!dragState) {
                return;
            }

            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const badgeWidth = floatingBadgeRef.current?.offsetWidth ?? getFloatingBadgeWidth(viewportWidth);
            const badgeHeight = floatingBadgeRef.current?.offsetHeight ?? floatingBadgeFallbackHeight;

            setFloatingBadgePosition(
                clampFloatingBadgePosition(
                    {
                        x: event.clientX - dragState.offsetX,
                        y: event.clientY - dragState.offsetY,
                    },
                    viewportWidth,
                    viewportHeight,
                    badgeWidth,
                    badgeHeight,
                ),
            );
        };

        const handlePointerUp = () => {
            floatingBadgeDragStateRef.current = null;
            setIsDraggingFloatingBadge(false);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };
    }, [isDraggingFloatingBadge]);

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
            floatingBadgeDragStateRef.current = null;
        };
    }, [editorConfigQuery.data]);

    const handleFloatingBadgePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
        if (event.button !== 0 || !floatingBadgeRef.current) {
            return;
        }

        const badgeBounds = floatingBadgeRef.current.getBoundingClientRect();
        floatingBadgeDragStateRef.current = {
            offsetX: event.clientX - badgeBounds.left,
            offsetY: event.clientY - badgeBounds.top,
        };
        setIsDraggingFloatingBadge(true);
    };

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

            <div
                ref={floatingBadgeRef}
                className="fixed z-20 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-neutral-200 bg-white/95 px-3 py-2 text-[11px] shadow-lg backdrop-blur"
                style={{
                    left: floatingBadgePosition?.x ?? floatingBadgeMargin,
                    top: floatingBadgePosition?.y ?? floatingBadgeMargin,
                }}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
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
                            <span className="truncate font-semibold text-neutral-900">{savedStatusLabel}</span>
                        </div>
                        <p className="mt-0.5 truncate text-neutral-500">
                            {generatedDocumentQuery.isFetching ? 'Checking backend copy...' : savedDetailLabel}
                        </p>
                    </div>

                    <button
                        type="button"
                        aria-label="Drag save status badge"
                        onPointerDown={handleFloatingBadgePointerDown}
                        className={[
                            'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 shadow-sm transition-colors',
                            isDraggingFloatingBadge ? 'cursor-grabbing text-neutral-700' : 'cursor-grab hover:text-neutral-700',
                        ].join(' ')}
                    >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <circle cx="6" cy="6" r="1.25" />
                            <circle cx="10" cy="6" r="1.25" />
                            <circle cx="14" cy="6" r="1.25" />
                            <circle cx="6" cy="10" r="1.25" />
                            <circle cx="10" cy="10" r="1.25" />
                            <circle cx="14" cy="10" r="1.25" />
                            <circle cx="6" cy="14" r="1.25" />
                            <circle cx="10" cy="14" r="1.25" />
                            <circle cx="14" cy="14" r="1.25" />
                        </svg>
                    </button>
                </div>
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
