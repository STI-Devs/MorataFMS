import { useDeferredValue, useState } from 'react';
import {
    CheckCircle2,
    Clock,
    Download,
    Edit3,
    FileText,
    Files,
    HardDrive,
    Layers,
    MoreVertical,
    Search,
    Trash2,
    User,
} from 'lucide-react';
import { DeleteConfirmModal } from '../shared/DeleteConfirmModal';
import { toast } from 'sonner';
import { Pagination } from '../../../../components/Pagination';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
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
import type { DocumentTemplateCategoryCode, LawFirmDocumentModule, NotarialGeneratedDocument } from '../../types/legalRecords.types';
import { openEditorPage } from '../../utils/editorNavigation';

const ALL_CATEGORIES = 'all';
const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

type Props = {
    module?: LawFirmDocumentModule;
};

const generatedDocumentEditorPath = (documentId: number, module: LawFirmDocumentModule): string =>
    (module === 'legal'
        ? appRoutes.paralegalLegalGeneratedDocumentEditor
        : appRoutes.paralegalGeneratedDocumentEditor
    ).replace(':documentId', String(documentId));

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

export const NotarialGeneratedDocumentsPage = ({ module = 'notarial' }: Props) => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState<number>(25);
    const [openActionsDocumentId, setOpenActionsDocumentId] = useState<number | null>(null);
    const [pendingDeleteDocument, setPendingDeleteDocument] = useState<NotarialGeneratedDocument | null>(null);

    const deferredSearchTerm = useDeferredValue(searchTerm);

    const catalogQuery = useLegalCatalog(module);
    const deleteGeneratedDocument = useDeleteNotarialGeneratedDocument(module);
    const generatedDocumentsQuery = useNotarialGeneratedDocuments({
        module,
        search: deferredSearchTerm.trim() || undefined,
        document_category:
            categoryFilter !== ALL_CATEGORIES
                ? (categoryFilter as DocumentTemplateCategoryCode)
                : undefined,
        page,
        per_page: perPage,
    });
    const libraryTemplatesQuery = useNotarialTemplates({
        module,
        per_page: 1,
        page: 1,
    });
    const readyTemplatesQuery = useNotarialTemplates({
        module,
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

    const handleDelete = (document: NotarialGeneratedDocument): void => {
        setOpenActionsDocumentId(null);
        setPendingDeleteDocument(document);
    };

    const handleOpenEditor = (documentId: number): void => {
        setOpenActionsDocumentId(null);
        openEditorPage(generatedDocumentEditorPath(documentId, module));
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
        <div className="w-full space-y-6 pb-8">
            <DeleteConfirmModal
                isOpen={pendingDeleteDocument !== null}
                title="Delete Generated Document"
                description={`Delete the generated document for ${pendingDeleteDocument?.party_name ?? ''}? This permanently removes the saved DOCX file from storage.`}
                confirmLabel="Delete Document"
                isPending={deleteGeneratedDocument.isPending}
                onConfirm={() => void handleConfirmDelete()}
                onCancel={() => setPendingDeleteDocument(null)}
            />

            {/* Header */}
            <header className="flex flex-col gap-1 border-b border-border/80 pb-5">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {module === 'legal' ? 'Legal Generated Documents' : 'Generated Documents'}
                </h1>
                <p className="text-sm text-muted-foreground">
                    Search editable Word outputs by master, party, or file name.
                </p>
            </header>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Generated Documents</CardTitle>
                        <Files className="size-4 text-blue-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {totalDocuments}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Editable Word outputs created</p>
                    </CardContent>
                </Card>

                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Ready Masters</CardTitle>
                        <CheckCircle2 className="size-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {readyTemplates}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Masters with source DOCX files</p>
                    </CardContent>
                </Card>

                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Master Variants</CardTitle>
                        <Layers className="size-4 text-amber-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {libraryVariantCount}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Custom template variations</p>
                    </CardContent>
                </Card>

                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Document Types</CardTitle>
                        <FileText className="size-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {documentTypeCount}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Registered document categories</p>
                    </CardContent>
                </Card>
            </div>

            {/* Output History Card & Table */}
            <Card className="border border-border/80 bg-card shadow-2xs overflow-hidden rounded-xl">
                <div className="border-b border-border/80 bg-muted/20 p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <h2 className="text-base font-semibold tracking-tight text-foreground">Output History</h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Start with the party, master name, or file name, then refine with filters.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative w-full xl:w-72">
                                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="generated-documents-search"
                                    type="text"
                                    placeholder="Search master, party, or file..."
                                    value={searchTerm}
                                    onChange={(event) => {
                                        setSearchTerm(event.target.value);
                                        setPage(1);
                                    }}
                                    className="h-8 pl-8 text-xs"
                                />
                            </div>

                            <select
                                id="generated-documents-category-filter"
                                value={categoryFilter}
                                onChange={(event) => {
                                    setCategoryFilter(event.target.value);
                                    setPage(1);
                                }}
                                className="h-8 rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
                            >
                                <option value={ALL_CATEGORIES}>All Categories</option>
                                {categories.map((category) => (
                                    <option key={category.code} value={category.code}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <p>{totalDocuments} matching generated documents</p>
                        <p>Newest generated file first</p>
                    </div>
                </div>

                {generatedDocuments.length > 0 ? (
                    <div className="hidden border-b border-border/80 bg-muted/40 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:grid md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_72px] md:items-center">
                        <span>Document</span>
                        <span>Client / Party</span>
                        <span>File / Last Saved</span>
                        <span className="text-right">Actions</span>
                    </div>
                ) : null}

                <div className="divide-y divide-border/60">
                    {generatedDocuments.length > 0 ? (
                        generatedDocuments.map((document) => (
                            <div
                                key={document.id}
                                className="group grid gap-4 p-4 transition-colors hover:bg-muted/30 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_72px] md:items-center"
                            >
                                {/* Document Info */}
                                <div className="min-w-0 flex items-start gap-3">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-background shadow-2xs">
                                        <FileText className="size-4.5 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:hidden">
                                            Document
                                        </p>
                                        <p className="truncate text-xs font-semibold text-foreground">
                                            {document.template_label}
                                        </p>
                                        <div className="mt-0.5 flex items-center gap-1.5">
                                            <span className="truncate text-xs text-muted-foreground">
                                                {document.document_code_label ?? document.document_code}
                                            </span>
                                            {document.document_category_label && (
                                                <>
                                                    <span className="size-1 rounded-full bg-muted-foreground/40" />
                                                    <span className="truncate text-xs text-muted-foreground">
                                                        {document.document_category_label}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        {document.notes && (
                                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/80 italic">"{document.notes}"</p>
                                        )}
                                    </div>
                                </div>

                                {/* Party Info */}
                                <div className="min-w-0">
                                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:hidden">
                                        Client / Party
                                    </p>
                                    <p className="truncate text-xs font-medium text-foreground">{document.party_name}</p>
                                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                                        <User className="size-3 text-muted-foreground" />
                                        {document.created_by?.name ? `Prepared by ${document.created_by.name}` : 'System generated'}
                                    </p>
                                </div>

                                {/* File Info */}
                                <div className="min-w-0">
                                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:hidden">
                                        File / Last Saved
                                    </p>
                                    <p className="truncate text-xs font-mono font-medium text-muted-foreground">{document.generated_file.filename}</p>
                                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <HardDrive className="size-3 text-muted-foreground" />
                                            {document.generated_file.formatted_size}
                                        </span>
                                        <span className="size-1 rounded-full bg-muted-foreground/40" />
                                        <span className="truncate flex items-center gap-1">
                                            <Clock className="size-3 text-muted-foreground" />
                                            {formatTimestamp(document.generated_at)}
                                        </span>
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
                                        className="inline-flex size-8 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground shadow-2xs transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                                    >
                                        <MoreVertical className="size-4" />
                                    </button>

                                    {openActionsDocumentId === document.id ? (
                                        <div className="absolute right-0 top-10 z-30 w-44 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenEditor(document.id)}
                                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted cursor-pointer"
                                            >
                                                <Edit3 className="size-3.5 text-muted-foreground" />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDownloadDocument(document)}
                                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-muted cursor-pointer"
                                            >
                                                <Download className="size-3.5 text-muted-foreground" />
                                                Download
                                            </button>
                                            {canDeleteGeneratedDocuments ? (
                                                <button
                                                    type="button"
                                                    onClick={() => void handleDelete(document)}
                                                    disabled={deleteGeneratedDocument.isPending}
                                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                    Delete
                                                </button>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex min-h-[260px] flex-col items-center justify-center py-12 text-center">
                            <div className="mb-3 flex size-12 items-center justify-center rounded-xl border border-border/80 bg-muted shadow-2xs">
                                <Search className="size-5 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">No matching documents</p>
                            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                                Try adjusting your search term or filtering options.
                            </p>
                        </div>
                    )}
                </div>

                {pagination ? (
                    <div className="border-t border-border/80 bg-muted/20 px-6 py-3.5">
                        <Pagination
                            currentPage={pagination.current_page}
                            totalPages={pagination.last_page}
                            perPage={perPage}
                            perPageOptions={[...PAGE_SIZE_OPTIONS]}
                            compact
                            onPageChange={setPage}
                            onPerPageChange={(nextPerPage) => {
                                setPerPage(nextPerPage);
                                setPage(1);
                            }}
                        />
                    </div>
                ) : null}
            </Card>
        </div>
    );
};
