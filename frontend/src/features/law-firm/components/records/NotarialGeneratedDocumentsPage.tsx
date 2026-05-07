import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router-dom';
import { CurrentDateTime } from '../../../../components/CurrentDateTime';
import { appRoutes } from '../../../../lib/appRoutes';
import { lawFirmApi } from '../../api/lawFirmApi';
import {
    useLegalCatalog,
    useNotarialGeneratedDocuments,
    useNotarialTemplates,
} from '../../hooks/useLegalWorkspace';
import type { LegalDocumentCategoryCode } from '../../types/legalRecords.types';

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

const SummaryCard = ({ label, value, description, accentColor }: { label: string; value: string; description: string, accentColor?: string }) => (
    <div className="group relative overflow-hidden rounded-3xl border border-neutral-200/60 bg-white p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <p className="text-[13px] font-medium text-neutral-500">{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">{value}</p>
        {description && <p className="mt-2 text-[12px] text-neutral-400">{description}</p>}
        {accentColor && (
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${accentColor} transition-transform group-hover:scale-110`} />
        )}
    </div>
);

export const NotarialGeneratedDocumentsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState<number>(12);

    const deferredSearchTerm = useDeferredValue(searchTerm);

    const catalogQuery = useLegalCatalog();
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

    const handleDownload = async (downloadUrl: string, filename: string): Promise<void> => {
        await lawFirmApi.downloadFile(downloadUrl, filename);
    };

    return (
        <div className="relative min-h-full w-full bg-[#FAFAFA] font-sans selection:bg-neutral-900 selection:text-white">
            {/* Subtle Top Gradient background */}
            <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-neutral-100 to-transparent pointer-events-none" />
            
            <div className="relative z-10 mx-auto w-full max-w-7xl space-y-10 p-8 pb-16">
                
                {/* 21st.dev Style Header */}
                <header className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                    <div className="max-w-2xl space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200/60 bg-white px-3 py-1 shadow-sm">
                            <span className="flex h-2 w-2 rounded-full bg-blue-500" />
                            <p className="text-[11px] font-medium tracking-wide text-neutral-600">Client Documents</p>
                        </div>
                        <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 md:text-5xl">
                            Generated Documents
                        </h1>
                        <p className="text-[15px] leading-relaxed text-neutral-500">
                            Search editable Word outputs by master, party, or file name, then narrow the list by document category.
                        </p>
                    </div>
                    
                    <div className="flex shrink-0 items-center justify-end">
                        <CurrentDateTime
                            className="text-right"
                            timeClassName="text-2xl font-semibold tracking-tight text-neutral-900 tabular-nums"
                            dateClassName="text-[13px] font-medium text-neutral-500"
                        />
                    </div>
                </header>

                {/* Metrics Bento Grid */}
                <div className="grid gap-4 lg:grid-cols-4">
                    <SummaryCard
                        label="Generated Documents"
                        value={String(totalDocuments)}
                        description="Outputs matching current filter"
                        accentColor="bg-blue-500/5"
                    />
                    <SummaryCard
                        label="Ready Masters"
                        value={String(readyTemplates)}
                        description="Masters with uploaded DOCX"
                        accentColor="bg-emerald-500/5"
                    />
                    <SummaryCard
                        label="Master Variants"
                        value={String(libraryVariantCount)}
                        description="Reusable variants in library"
                        accentColor="bg-purple-500/5"
                    />
                    <SummaryCard
                        label="Document Types"
                        value={String(documentTypeCount)}
                        description="Catalog document types"
                        accentColor="bg-amber-500/5"
                    />
                </div>

                <section className="flex flex-col overflow-hidden rounded-[2rem] border border-neutral-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="border-b border-neutral-100 bg-white/50 px-8 py-6 backdrop-blur-sm">
                        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <h2 className="text-[17px] font-semibold tracking-tight text-neutral-900">Output History</h2>
                                <p className="mt-1 text-[13px] text-neutral-500">
                                    Start with the party, master name, or file name, then refine with filters.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative w-full xl:w-80">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 py-2.5 pl-10 pr-4 text-[14px] font-medium text-neutral-900 placeholder:font-normal placeholder:text-neutral-400 transition-colors hover:bg-neutral-50 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
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
                                        className="appearance-none rounded-xl border border-neutral-200 bg-neutral-50/50 py-2.5 pl-4 pr-10 text-[14px] font-medium text-neutral-900 transition-colors hover:bg-neutral-50 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                    >
                                        <option value={ALL_CATEGORIES}>All Categories</option>
                                        {categories.map((category) => (
                                            <option key={category.code} value={category.code}>
                                                {category.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                        <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between text-[12px] font-medium text-neutral-400">
                            <p>{totalDocuments} matching generated documents</p>
                            <p>Newest generated file first</p>
                        </div>
                    </div>

                    <div className="divide-y divide-neutral-100 p-2">
                        {generatedDocuments.length > 0 ? (
                            generatedDocuments.map((document) => (
                                <div
                                    key={document.id}
                                    className="group grid gap-4 rounded-2xl p-4 transition-all hover:bg-neutral-50 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_180px] md:items-center"
                                >
                                    {/* Document Info */}
                                    <div className="min-w-0 flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-100 bg-white shadow-sm">
                                            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-[14px] font-semibold text-neutral-900">
                                                {document.template_label}
                                            </p>
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className="truncate text-[12px] text-neutral-500">
                                                    {document.document_code_label ?? document.document_code}
                                                </span>
                                                {document.document_category_label && (
                                                    <>
                                                        <span className="h-1 w-1 rounded-full bg-neutral-300" />
                                                        <span className="truncate text-[12px] text-neutral-500">
                                                            {document.document_category_label}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            {document.notes && (
                                                <p className="mt-2 line-clamp-2 text-[12px] text-neutral-400 italic">"{document.notes}"</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Party Info */}
                                    <div className="min-w-0">
                                        <p className="truncate text-[14px] font-medium text-neutral-900">{document.party_name}</p>
                                        <p className="mt-1 flex items-center gap-1.5 truncate text-[12px] text-neutral-500">
                                            <svg className="h-3.5 w-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            {document.created_by?.name ? `Prepared by ${document.created_by.name}` : 'System generated'}
                                        </p>
                                    </div>

                                    {/* File Info */}
                                    <div className="min-w-0">
                                        <p className="truncate text-[13px] font-mono font-medium text-neutral-700">{document.generated_file.filename}</p>
                                        <div className="mt-1 flex items-center gap-2 text-[12px] text-neutral-500">
                                            <span>{document.generated_file.formatted_size}</span>
                                            <span className="h-1 w-1 rounded-full bg-neutral-300" />
                                            <span className="truncate">{formatTimestamp(document.generated_at)}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex shrink-0 items-center justify-end gap-2">
                                        <Link
                                            to={generatedDocumentEditorPath(document.id)}
                                            className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => void handleDownload(document.generated_file.download_url, document.generated_file.filename)}
                                            className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
                                        >
                                            Download
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex min-h-[300px] flex-col items-center justify-center py-12 text-center">
                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-50 border border-neutral-100 shadow-sm">
                                    <svg className="h-6 w-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <p className="text-[15px] font-medium text-neutral-900">No matching documents</p>
                                <p className="mt-1 max-w-sm text-[13px] text-neutral-500">
                                    Try adjusting your search term or filtering options.
                                </p>
                            </div>
                        )}
                    </div>

                    {pagination ? (
                        <div className="flex flex-col items-center justify-between gap-4 border-t border-neutral-100 bg-neutral-50/50 px-6 py-4 sm:flex-row">
                            <div className="flex items-center gap-3">
                                <label
                                    htmlFor="generated-documents-per-page"
                                    className="text-[13px] font-medium text-neutral-500"
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
                                        className="appearance-none rounded-lg border border-neutral-200 bg-white py-1.5 pl-3 pr-8 text-[13px] font-medium text-neutral-900 shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                    >
                                        {PAGE_SIZE_OPTIONS.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                                        <svg className="h-3.5 w-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-[13px] text-neutral-500">
                                    Page {pagination.current_page} of {pagination.last_page}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                                    disabled={pagination.current_page <= 1}
                                    className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPage((currentPage) => Math.min(pagination.last_page, currentPage + 1))}
                                    disabled={pagination.current_page >= pagination.last_page}
                                    className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 disabled:cursor-not-allowed disabled:opacity-50"
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
