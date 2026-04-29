import { useDeferredValue, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CurrentDateTime } from '../../../../components/CurrentDateTime';
import {
    useCreateLegalArchiveRecord,
    useLegalArchive,
    useLegalCatalog,
} from '../../hooks/useLegalWorkspace';
import type {
    LegalFileCategoryCode,
    LegalFileType,
} from '../../types/legalRecords.types';

const getErrorMessage = (error: unknown): string => {
    const responseData = (error as {
        response?: {
            data?: {
                message?: string;
                errors?: Record<string, string[]>;
            };
        };
    })?.response?.data;

    const firstValidationMessage = responseData?.errors
        ? Object.values(responseData.errors).flat()[0]
        : null;

    return firstValidationMessage ?? responseData?.message ?? 'Unable to save the legal file.';
};

const formatDate = (value: string | null): string => {
    if (! value) {
        return 'No document date';
    }

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    }).format(new Date(value));
};

export const LegalArchivePage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<LegalFileCategoryCode>('intern_records');
    const [selectedFileCode, setSelectedFileCode] = useState('');
    const [title, setTitle] = useState('');
    const [relatedName, setRelatedName] = useState('');
    const [documentDate, setDocumentDate] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const deferredSearchTerm = useDeferredValue(searchTerm);
    const catalogQuery = useLegalCatalog();
    const archiveQuery = useLegalArchive({ page: 1, per_page: 5 });
    const createArchiveRecord = useCreateLegalArchiveRecord();

    const groupedCategories = useMemo(
        () => catalogQuery.data?.grouped_legal_file_types ?? [],
        [catalogQuery.data?.grouped_legal_file_types],
    );
    const fileTypes = useMemo(
        () => catalogQuery.data?.legal_file_types ?? [],
        [catalogQuery.data?.legal_file_types],
    );
    const recentArchiveRecords = archiveQuery.data?.data ?? [];

    const visibleCategories = useMemo(
        () =>
            groupedCategories.map((category) => ({
                ...category,
                file_types: category.file_types.filter((fileType) => {
                    const normalizedSearch = deferredSearchTerm.trim().toLowerCase();

                    if (! normalizedSearch) {
                        return true;
                    }

                    return fileType.label.toLowerCase().includes(normalizedSearch);
                }),
            })),
        [deferredSearchTerm, groupedCategories],
    );

    const initialFileType = visibleCategories[0]?.file_types[0]
        ?? groupedCategories[0]?.file_types[0]
        ?? null;
    const activeCategoryGroup = visibleCategories.find((category) => category.code === activeCategory)
        ?? groupedCategories.find((category) => category.code === activeCategory)
        ?? null;
    const activeCategoryFileTypes = activeCategoryGroup?.file_types ?? [];
    const selectedFileType = activeCategoryFileTypes.find((fileType) => fileType.code === selectedFileCode)
        ?? activeCategoryFileTypes[0]
        ?? initialFileType;
    const visibleFileCount = activeCategoryGroup?.file_types.length ?? 0;
    const effectiveTitle = title || selectedFileType?.label || '';

    const handleSelectCategory = (categoryCode: LegalFileCategoryCode) => {
        setActiveCategory(categoryCode);

        const nextCategoryGroup = visibleCategories.find((category) => category.code === categoryCode)
            ?? groupedCategories.find((category) => category.code === categoryCode)
            ?? null;
        const nextFileType = nextCategoryGroup?.file_types[0] ?? null;

        setSelectedFileCode(nextFileType?.code ?? '');
        setTitle(nextFileType?.label ?? '');
    };

    const handleSelectFileType = (fileType: LegalFileType) => {
        setActiveCategory(fileType.category);
        setSelectedFileCode(fileType.code);
        setTitle(fileType.label);
    };

    const handleSave = async () => {
        if (! selectedFileType) {
            return;
        }

        try {
            await createArchiveRecord.mutateAsync({
                file_category: selectedFileType.category,
                file_code: selectedFileType.code,
                title: effectiveTitle.trim(),
                related_name: relatedName.trim(),
                document_date: documentDate || undefined,
                notes: notes.trim() || undefined,
                file: selectedFile,
            });

            toast.success('Legal file archived.');
            setRelatedName('');
            setDocumentDate('');
            setNotes('');
            setSelectedFile(null);
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    return (
        <div className="w-full space-y-6 p-8 pb-12">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-text-primary">Legal File Archive</h1>
                    <p className="mt-2 max-w-3xl text-sm text-text-muted">
                        Save non-notarial legal files and attach the document when available.
                    </p>
                </div>
                <CurrentDateTime
                    className="shrink-0 text-right"
                    timeClassName="text-2xl font-bold tabular-nums text-text-primary"
                    dateClassName="text-sm text-text-muted"
                />
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
                <div className="rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Archive Types</p>
                    <p className="mt-1.5 text-xl font-bold tracking-tight text-text-primary">{fileTypes.length} titles</p>
                    <p className="mt-1 text-sm text-text-muted">
                        Archive-only files.
                    </p>
                </div>
                <div className="rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Selected Upload</p>
                    <p className="mt-1.5 truncate text-xl font-bold tracking-tight text-text-primary">
                        {selectedFile ? selectedFile.name : 'Optional'}
                    </p>
                    <p className="mt-1 text-sm text-text-muted">
                        Upload now or later.
                    </p>
                </div>
                <div className="rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Recent Archive Entries</p>
                    <p className="mt-1.5 text-xl font-bold tracking-tight text-text-primary">{archiveQuery.data?.meta.total ?? 0}</p>
                    <p className="mt-1 text-sm text-text-muted">
                        Saved archive records.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
                <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Archive File Selector</p>
                                <p className="mt-1 text-sm text-text-muted">
                                    Choose the exact file type first.
                                </p>
                            </div>
                            <div className="rounded-full border border-border bg-surface-secondary/40 px-2.5 py-1 text-[11px] font-semibold text-text-muted">
                                {fileTypes.length} titles
                            </div>
                        </div>

                        <div className="mt-4 grid gap-2">
                            {visibleCategories.map((category) => (
                                <button
                                    key={category.code}
                                    type="button"
                                    onClick={() => handleSelectCategory(category.code)}
                                    className={[
                                        'flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors',
                                        activeCategory === category.code
                                            ? 'border-black bg-black text-white'
                                            : 'border-border bg-surface text-text-primary hover:bg-surface-secondary/20',
                                    ].join(' ')}
                                >
                                    <span className="pr-3">{category.label}</span>
                                    <span
                                        className={[
                                            'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                                            activeCategory === category.code
                                                ? 'bg-white/15 text-white'
                                                : 'bg-surface-secondary text-text-primary',
                                        ].join(' ')}
                                    >
                                        {category.file_types.length}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-4">
                            <input
                                id="legal-archive-search"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search file..."
                                className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-black/10"
                            />
                        </div>
                    </div>

                    <div className="border-b border-border bg-surface-secondary/20 px-5 py-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-text-primary">
                                    {activeCategoryGroup?.label ?? 'Archive Types'}
                                </p>
                                <p className="mt-1 text-xs text-text-muted">
                                    {visibleFileCount} type{visibleFileCount === 1 ? '' : 's'}
                                </p>
                            </div>
                            {selectedFileType ? (
                                <div className="rounded-full border border-amber-400/35 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-300">
                                    Selected: {selectedFileType.label}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="max-h-[560px] overflow-y-auto p-3">
                        {activeCategoryGroup && activeCategoryGroup.file_types.length > 0 ? (
                            <div className="space-y-1.5">
                                {activeCategoryGroup.file_types.map((fileType) => (
                                    <button
                                        key={fileType.code}
                                        type="button"
                                        onClick={() => handleSelectFileType(fileType)}
                                        className={[
                                            'flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left transition-colors',
                                            selectedFileType?.code === fileType.code
                                                ? 'border-amber-400/40 bg-amber-500/10 shadow-sm'
                                                : 'border-transparent bg-surface hover:border-border hover:bg-surface-secondary/20',
                                        ].join(' ')}
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-text-primary">{fileType.label}</p>
                                        </div>
                                        <span
                                            className={[
                                                'ml-3 h-2.5 w-2.5 shrink-0 rounded-full',
                                                selectedFileType?.code === fileType.code ? 'bg-amber-500' : 'bg-border',
                                            ].join(' ')}
                                        />
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
                                <p className="text-sm font-semibold text-text-primary">No matching archive file types</p>
                                <p className="mt-2 text-sm text-text-muted">
                                    Try another search term or switch categories.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                <div className="space-y-6">
                    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                        <div className="border-b border-border px-5 py-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Archive Entry</p>
                            <h2 className="mt-1.5 text-xl font-bold tracking-tight text-text-primary">
                                {selectedFileType?.label ?? 'Select a legal file type'}
                            </h2>
                            <p className="mt-1 text-sm text-text-muted">
                                Capture only archive metadata for non-notarial files: title, related person or entity, document date, notes, and the uploaded file when available.
                            </p>
                        </div>

                        <div className="grid gap-4 p-5 md:grid-cols-2">
                            <label className="space-y-1.5 md:col-span-2">
                                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Record Title</span>
                                <input
                                    id="legal-archive-title"
                                    value={effectiveTitle}
                                    onChange={(event) => setTitle(event.target.value)}
                                    className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                                />
                            </label>

                            <label className="space-y-1.5">
                                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Related Person / Company / Intern</span>
                                <input
                                    id="legal-archive-related-name"
                                    value={relatedName}
                                    onChange={(event) => setRelatedName(event.target.value)}
                                    placeholder="Enter the related name for this file"
                                    className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                                />
                            </label>

                            <label className="space-y-1.5">
                                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Document Date</span>
                                <input
                                    id="legal-archive-document-date"
                                    type="date"
                                    value={documentDate}
                                    onChange={(event) => setDocumentDate(event.target.value)}
                                    className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                                />
                            </label>

                            <label className="space-y-1.5 md:col-span-2">
                                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Notes</span>
                                <textarea
                                    id="legal-archive-notes"
                                    value={notes}
                                    onChange={(event) => setNotes(event.target.value)}
                                    rows={4}
                                    placeholder="Optional filing context, archive remarks, or migration notes"
                                    className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                                />
                            </label>

                            <label className="space-y-1.5 md:col-span-2">
                                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Legal File Upload</span>
                                <div className="rounded-2xl border border-dashed border-border p-4">
                                    <input
                                        id="legal-archive-file"
                                        type="file"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                        onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                                        className="block w-full text-sm text-text-primary file:mr-4 file:rounded-lg file:border-0 file:bg-surface-secondary file:px-3 file:py-2 file:text-sm file:font-semibold"
                                    />
                                    <p className="mt-2 text-xs text-text-muted">
                                        Optional for now. Use this upload for archive-only legal files, not for notarized register scans.
                                    </p>
                                </div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-border bg-surface-secondary/20 px-5 py-4">
                            <p className="text-xs text-text-muted">
                                {selectedFileType
                                    ? `${selectedFileType.label} • archive-only record`
                                    : 'Select a legal file type from the archive catalog to begin.'}
                            </p>
                            <button
                                type="button"
                                id="legal-archive-save"
                                onClick={() => void handleSave()}
                                disabled={!selectedFileType || createArchiveRecord.isPending}
                                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Save Legal File
                            </button>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                        <div className="border-b border-border px-5 py-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Recent Archive Records</p>
                            <h2 className="mt-1.5 text-xl font-bold tracking-tight text-text-primary">Latest Saved Legal Files</h2>
                            <p className="mt-1 text-sm text-text-muted">
                                The archive workspace keeps recent entries visible without mixing them into the generated notarial records list.
                            </p>
                        </div>

                        <div className="divide-y divide-border">
                            {recentArchiveRecords.length > 0 ? (
                                recentArchiveRecords.map((record) => (
                                    <div key={record.id} className="flex items-start justify-between gap-4 px-5 py-4">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-text-primary">
                                                {record.file_code_label ?? record.title}
                                            </p>
                                            <p className="mt-1 truncate text-sm text-text-muted">{record.related_name}</p>
                                            <p className="mt-1 text-xs text-text-muted">{formatDate(record.document_date)}</p>
                                        </div>
                                        <div className="text-right">
                                            <span
                                                className={[
                                                    'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
                                                    record.upload_status === 'uploaded'
                                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                        : 'border-amber-200 bg-amber-50 text-amber-700',
                                                ].join(' ')}
                                            >
                                                {record.upload_status === 'uploaded' ? 'Uploaded' : 'Pending Upload'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex min-h-40 flex-col items-center justify-center px-6 text-center">
                                    <p className="text-sm font-semibold text-text-primary">No archive files saved yet</p>
                                    <p className="mt-2 text-sm text-text-muted">
                                        Save the first non-notarial legal file to start the archive workspace.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
