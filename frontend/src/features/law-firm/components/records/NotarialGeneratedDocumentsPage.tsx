import { useDeferredValue, useState } from 'react';
import { DeleteConfirmModal } from '../shared/DeleteConfirmModal';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../../auth';
import { isAdmin } from '../../../auth/utils/access';
import { appRoutes } from '../../../../lib/appRoutes';
import { lawFirmApi } from '../../api/lawFirmApi';
import {
    useDeleteNotarialGeneratedDocument,
    useLegalCatalog,
    useNotarialGeneratedDocuments,
    useNotarialTemplates,
} from '../../hooks/useLegalWorkspace';
import type { LegalDocumentCategoryCode, NotarialGeneratedDocument } from '../../types/legalRecords.types';

const ALL_CATEGORIES = 'all';
const PAGE_SIZE_OPTIONS = [12, 25, 50, 100] as const;

const generatedDocumentEditorPath = (documentId: number): string =>
    appRoutes.paralegalGeneratedDocumentEditor.replace(':documentId', String(documentId));

const formatTimestamp = (value: string | null) => {
    if (!value) {
        return 'No generated date';
    }

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
};

const getDeleteErrorMessage = (error: unknown): string =>
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Unable to delete the generated document.';

const getPreviewErrorMessage = (error: unknown): string =>
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Unable to preview the generated document.';

const SummaryCard = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-xl border border-border bg-surface-elevated px-4 py-3 shadow-sm dark:shadow-none">
        <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">{value}</p>
    </div>
);

export const NotarialGeneratedDocumentsPage = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState<number>(12);
    const [openActionsDocumentId, setOpenActionsDocumentId] = useState<number | null>(null);
    const [pendingDeleteDocument, setPendingDeleteDocument] = useState<NotarialGeneratedDocument | null>(null);

    const deferredSearchTerm = useDeferredValue(searchTerm);

    const catalogQuery = useLegalCatalog();
    const deleteGeneratedDocument = useDeleteNotarialGeneratedDocument();
    const generatedDocumentsQuery = useNotarialGeneratedDocuments({
        search: deferredSearchTerm.trim() || undefined,
        document_category:
            categoryFilter !== ALL_CATEGORIES
                ? (categoryFilter as LegalDocumentCategoryCode)
                : undefined,
        page,
        per_page: perPage,
    });
    const libraryTemplatesQuery = useNotarialTemplates({
        per_page: 1,
        page: 1,
    });
    const readyTemplatesQuery = useNotarialTemplates({
        template_status: 'ready',
        per_page: 1,
        page: 1,
    });

    const categories = catalogQuery.data?.categories ?? [];
    const generatedDocuments = generatedDocumentsQuery.data?.data ?? [];
    const pagination = generatedDocumentsQuery.data?.meta;
    const totalDocuments = generatedDocumentsQuery.data?.meta.total ?? 0;
    const readyTemplates = readyTemplatesQuery.data?.meta.total ?? 0;
    const libraryVariantCount = libraryTemplatesQuery.data?.meta.total ?? 0;
    const documentTypeCount = catalogQuery.data?.document_types.length ?? 0;
    const canDeleteGeneratedDocuments = isAdmin(user);

    const handleDownload = async (downloadUrl: string, filename: string): Promise<void> => {
        await lawFirmApi.downloadFile(downloadUrl, filename);
    };

    const handleDownloadDocument = (document: NotarialGeneratedDocument): void => {
        void handleDownload(document.generated_file.download_url, document.generated_file.filename);
        setOpenActionsDocumentId(null);
    };

    const handlePreview = async (document: NotarialGeneratedDocument): Promise<void> => {
        setOpenActionsDocumentId(null);

        const pendingTab = window.open('', '_blank');

        if (pendingTab) {
            pendingTab.opener = null;
            pendingTab.document.title = document.generated_file.filename;
        }

        try {
            const previewBlob = await lawFirmApi.previewGeneratedDocument(document.id);
            const previewUrl = window.URL.createObjectURL(previewBlob);

            if (pendingTab) {
                pendingTab.location.replace(previewUrl);
            } else {
                const newTab = window.open(previewUrl, '_blank', 'noopener');

                if (newTab) {
                    newTab.opener = null;
                }
            }

            window.setTimeout(() => {
                window.URL.revokeObjectURL(previewUrl);
            }, 60_000);
        } catch (error) {
            pendingTab?.close();
            toast.error(getPreviewErrorMessage(error));
        }
    };

    const handleDelete = (document: NotarialGeneratedDocument): void => {
        setOpenActionsDocumentId(null);
        setPendingDeleteDocument(document);
    };

    const handleConfirmDelete = async (): Promise<void> => {
        if (!pendingDeleteDocument) return;

        try {
            await deleteGeneratedDocument.mutateAsync(pendingDeleteDocument.id);
            toast.success('Generated document deleted.');
            setPendingDeleteDocument(null);
        } catch (error) {
            toast.error(getDeleteErrorMessage(error));
        }
    };

    return (
        <div className="relative min-h-full w-full bg-surface-secondary font-sans selection:bg-text-primary selection:text-surface">
            <DeleteConfirmModal
                isOpen={pendingDeleteDocument !== null}
                title="Delete Generated Document"
                description={`Delete the generated document for ${pendingDeleteDocument?.party_name ?? ''}? This permanently removes the saved DOCX file from storage.`}
                confirmLabel="Delete Document"
                isPending={deleteGeneratedDocument.isPending}
                onConfirm={() => void handleConfirmDelete()}
                onCancel={() => setPendingDeleteDocument(null)}
            />
            {/* Subtle Top Gradient background */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-surface-elevated to-transparent" />
            
            <div className="relative z-10 mx-auto w-full max-w-7xl space-y-5 p-6 pb-12">

                <header className="space-y-0.5">
                    <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
                        Generated Documents
                    </h1>
                    <p className="text-[13px] text-text-secondary">
                        Search editable Word outputs by master, party, or file name.
                    </p>
                </header>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <SummaryCard label="Generated Documents" value={String(totalDocuments)} />
                    <SummaryCard label="Ready Masters" value={String(readyTemplates)} />
                    <SummaryCard label="Master Variants" value={String(libraryVariantCount)} />
                    <SummaryCard label="Document Types" value={String(documentTypeCount)} />
                </div>

                <section className="flex flex-col overflow-visible rounded-[2rem] border border-border bg-surface-elevated shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
                    <div className="border-b border-border bg-surface-elevated/70 px-8 py-6 backdrop-blur-sm">
                        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <h2 className="text-[17px] font-semibold tracking-tight text-text-primary">Output History</h2>
                                <p className="mt-1 text-[13px] text-text-secondary">
                                    Start with the party, master name, or file name, then refine with filters.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative w-full xl:w-80">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="generated-documents-search"
                                        type="text"
                                        placeholder="Search master, party, or file..."
                                        value={searchTerm}
                                        onChange={(event) => {
                                            setSearchTerm(event.target.value);
                                            setPage(1);
                                        }}
                                        className="w-full rounded-xl border border-border bg-input-bg py-2.5 pl-10 pr-4 text-[14px] font-medium text-text-primary placeholder:font-normal placeholder:text-text-muted transition-colors hover:bg-hover focus:border-text-primary focus:bg-surface-elevated focus:outline-none focus:ring-1 focus:ring-text-primary"
                                    />
                                </div>

                                <div className="relative">
                                    <select
                                        id="generated-documents-category-filter"
                                        value={categoryFilter}
                                        onChange={(event) => {
                                            setCategoryFilter(event.target.value);
                                            setPage(1);
                                        }}
                                        className="appearance-none rounded-xl border border-border bg-input-bg py-2.5 pl-4 pr-10 text-[14px] font-medium text-text-primary transition-colors hover:bg-hover focus:border-text-primary focus:bg-surface-elevated focus:outline-none focus:ring-1 focus:ring-text-primary"
                                    >
                                        <option value={ALL_CATEGORIES}>All Categories</option>
                                        {categories.map((category) => (
                                            <option key={category.code} value={category.code}>
                                                {category.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                        <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between text-[12px] font-medium text-text-muted">
                            <p>{totalDocuments} matching generated documents</p>
                            <p>Newest generated file first</p>
                        </div>
                    </div>

                    {generatedDocuments.length > 0 ? (
                        <div className="hidden border-b border-border px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted md:grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_72px] md:items-center">
                            <span>Document</span>
                            <span>Client / Party</span>
                            <span>File / Last Saved</span>
                            <span className="text-right">Actions</span>
                        </div>
                    ) : null}

                    <div className="divide-y divide-border p-2">
                        {generatedDocuments.length > 0 ? (
                            generatedDocuments.map((document) => (
                                <div
                                    key={document.id}
                                    className="group grid gap-4 rounded-2xl p-4 transition-all hover:bg-hover md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_72px] md:items-center"
                                >
                                    {/* Document Info */}
                                    <div className="min-w-0 flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-elevated shadow-sm dark:shadow-none">
                                            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted md:hidden">
                                                Document
                                            </p>
                                            <p className="truncate text-[14px] font-semibold text-text-primary">
                                                {document.template_label}
                                            </p>
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className="truncate text-[12px] text-text-secondary">
                                                    {document.document_code_label ?? document.document_code}
                                                </span>
                                                {document.document_category_label && (
                                                    <>
                                                        <span className="h-1 w-1 rounded-full bg-text-muted" />
                                                        <span className="truncate text-[12px] text-text-secondary">
                                                            {document.document_category_label}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            {document.notes && (
                                                <p className="mt-2 line-clamp-2 text-[12px] text-text-muted italic">"{document.notes}"</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Party Info */}
                                    <div className="min-w-0">
                                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted md:hidden">
                                            Client / Party
                                        </p>
                                        <p className="truncate text-[14px] font-medium text-text-primary">{document.party_name}</p>
                                        <p className="mt-1 flex items-center gap-1.5 truncate text-[12px] text-text-secondary">
                                            <svg className="h-3.5 w-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            {document.created_by?.name ? `Prepared by ${document.created_by.name}` : 'System generated'}
                                        </p>
                                    </div>

                                    {/* File Info */}
                                    <div className="min-w-0">
                                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted md:hidden">
                                            File / Last Saved
                                        </p>
                                        <p className="truncate text-[13px] font-mono font-medium text-text-secondary">{document.generated_file.filename}</p>
                                        <div className="mt-1 flex items-center gap-2 text-[12px] text-text-secondary">
                                            <span>{document.generated_file.formatted_size}</span>
                                            <span className="h-1 w-1 rounded-full bg-text-muted" />
                                            <span className="truncate">{formatTimestamp(document.generated_at)}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="relative flex shrink-0 justify-end">
                                        <button
                                            type="button"
                                            aria-label={`Actions for ${document.party_name}`}
                                            aria-expanded={openActionsDocumentId === document.id}
                                            onClick={() => setOpenActionsDocumentId((currentId) => (
                                                currentId === document.id ? null : document.id
                                            ))}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-elevated text-text-secondary shadow-sm transition-all hover:bg-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-text-primary/10 dark:shadow-none"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.75h.01M12 12h.01M12 17.25h.01" />
                                            </svg>
                                        </button>

                                        {openActionsDocumentId === document.id ? (
                                            <div className="absolute right-0 top-11 z-30 w-44 overflow-hidden rounded-xl border border-border bg-surface-elevated p-1 shadow-xl dark:shadow-none">
                                                <button
                                                    type="button"
                                                    onClick={() => void handlePreview(document)}
                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-text-secondary transition-colors hover:bg-hover hover:text-text-primary focus:bg-hover focus:outline-none"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                                                    </svg>
                                                    Preview
                                                </button>
                                                <Link
                                                    to={generatedDocumentEditorPath(document.id)}
                                                    onClick={() => setOpenActionsDocumentId(null)}
                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-text-secondary transition-colors hover:bg-hover hover:text-text-primary focus:bg-hover focus:outline-none"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Edit
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownloadDocument(document)}
                                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-text-secondary transition-colors hover:bg-hover hover:text-text-primary focus:bg-hover focus:outline-none"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    Download
                                                </button>
                                                {canDeleteGeneratedDocuments ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleDelete(document)}
                                                        disabled={deleteGeneratedDocument.isPending}
                                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 focus:bg-red-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-500/10 dark:hover:text-red-200 dark:focus:bg-red-500/10"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                        Delete
                                                    </button>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex min-h-[300px] flex-col items-center justify-center py-12 text-center">
                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface-secondary shadow-sm dark:shadow-none">
                                    <svg className="h-6 w-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <p className="text-[15px] font-medium text-text-primary">No matching documents</p>
                                <p className="mt-1 max-w-sm text-[13px] text-text-secondary">
                                    Try adjusting your search term or filtering options.
                                </p>
                            </div>
                        )}
                    </div>

                    {pagination ? (
                        <div className="flex flex-col items-center justify-between gap-4 border-t border-border bg-surface-secondary px-6 py-4 sm:flex-row">
                            <div className="flex items-center gap-3">
                                <label
                                    htmlFor="generated-documents-per-page"
                                    className="text-[13px] font-medium text-text-secondary"
                                >
                                    Show rows
                                </label>
                                <div className="relative">
                                    <select
                                        id="generated-documents-per-page"
                                        value={String(perPage)}
                                        onChange={(event) => {
                                            setPerPage(Number(event.target.value));
                                            setPage(1);
                                        }}
                                        className="appearance-none rounded-lg border border-border bg-input-bg py-1.5 pl-3 pr-8 text-[13px] font-medium text-text-primary shadow-sm focus:border-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary dark:shadow-none"
                                    >
                                        {PAGE_SIZE_OPTIONS.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                                        <svg className="h-3.5 w-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-[13px] text-text-secondary">
                                    Page {pagination.current_page} of {pagination.last_page}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                                    disabled={pagination.current_page <= 1}
                                    className="inline-flex items-center justify-center rounded-xl border border-border bg-surface-elevated px-4 py-2 text-[13px] font-medium text-text-secondary shadow-sm transition-all hover:bg-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-text-primary/10 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-none"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPage((currentPage) => Math.min(pagination.last_page, currentPage + 1))}
                                    disabled={pagination.current_page >= pagination.last_page}
                                    className="inline-flex items-center justify-center rounded-xl border border-border bg-surface-elevated px-4 py-2 text-[13px] font-medium text-text-secondary shadow-sm transition-all hover:bg-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-text-primary/10 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-none"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    ) : null}
                </section>
            </div>

        </div>
    );
};
