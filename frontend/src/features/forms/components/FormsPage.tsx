import { useRef, useState } from 'react';
import { CurrentDateTime } from '../../../components/CurrentDateTime';

type Tab = 'files' | 'affidavit' | 'deed-of-sale';

type UploadedFile = { file: File; id: string };

const DOCUMENT_TYPES = [
    'Select Document Type',
    'Certificate of Completion',
    'Contract of Lease',
    'Agreement',
    'Contract Agreement',
    'Compromise Agreement',
    'Waiver of Right',
    'Secretary Certificate',
    'Special Power of Attorney',
    'Sworn Statement',
    'Position Paper',
    'Contract to Sell',
    'Demand Letter',
];

const AFFIDAVIT_TYPES = [
    'Select Document Type',
    'Affidavit of Loss',
    'Affidavit of No Income',
    'Affidavit of Low Income',
    'Affidavit of No Support',
    'Affidavit of Support',
    'Affidavit of Two Disinterested Persons',
    'Affidavit of Discrepancy',
    'Affidavit of Undertaking',
    'Affidavit of Guardianship',
    'Affidavit of Car Accident',
    'Affidavit of Own Accident',
    'Affidavit of Change of Information',
    'Affidavit of Explanation',
    'Affidavit of No Client',
    'Affidavit of No Representative',
    'Affidavit of No Operation',
];

const DEED_OF_SALE_TYPES = [
    'Select Document Type',
    'Motor Vehicle',
    'Real Property',
    'Firearm',
];

const ALLOWED_FILE_LABEL = 'PDF, Word, Excel (including XLSM), CSV, TXT, JPG, JPEG, and PNG';
const ALLOWED_FILE_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.xlsm,.csv,.txt,.jpg,.jpeg,.png';

const TABS: { id: Tab; label: string }[] = [
    { id: 'files', label: 'Files' },
    { id: 'affidavit', label: 'Affidavit' },
    { id: 'deed-of-sale', label: 'Deed of Sale' },
];

const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// Files tab — two-state: dropzone → staged upload panel
const FilesTab = () => {
    const folderInputRef = useRef<HTMLInputElement>(null);
    const addMoreRef = useRef<HTMLInputElement>(null);
    const [docType, setDocType] = useState('All Document Types');
    const [isDragging, setIsDragging] = useState(false);
    const [staged, setStaged] = useState<UploadedFile[]>([]);
    const [uploaded, setUploaded] = useState(false);

    const addFiles = (incoming: FileList | null) => {
        if (!incoming) return;
        const newEntries: UploadedFile[] = Array.from(incoming).map(f => ({
            file: f,
            id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
        }));
        setStaged(prev => [...prev, ...newEntries]);
        setUploaded(false);
    };

    const removeStaged = (id: string) => setStaged(prev => prev.filter(r => r.id !== id));

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        addFiles(e.dataTransfer.files);
    };

    const totalSize = staged.reduce((acc, { file }) => acc + file.size, 0);

    const handleUploadToRecords = () => {
        // Wire to real API when backend contract is ready
        setUploaded(true);
        setStaged([]);
    };

    const isTypeSelected = docType !== DOCUMENT_TYPES[0];

    return (
        <div className="space-y-6">
            {/* Filter row */}
            <div className="flex flex-col gap-1">
                <label htmlFor="doc-type-filter" className="text-xs font-semibold text-text-muted">
                    Select Type <span className="text-red-500">*</span>
                </label>
                <div className="relative w-fit">
                    <select
                        id="doc-type-filter"
                        value={docType}
                        onChange={e => setDocType(e.target.value)}
                        className={[
                            'appearance-none pl-3 pr-8 py-2 rounded-lg text-sm font-medium bg-surface-secondary border text-text-primary focus:outline-none focus:ring-2 cursor-pointer transition-all',
                            isTypeSelected
                                ? 'border-border focus:ring-blue-500/40'
                                : 'border-red-500/60 focus:ring-red-500/30',
                        ].join(' ')}
                    >
                        {DOCUMENT_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                    <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Upload success notice */}
            {uploaded && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/8">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        Files submitted to Law Firm Records.
                    </p>
                    <button
                        type="button"
                        onClick={() => setUploaded(false)}
                        className="ml-auto text-xs text-text-muted hover:text-text-primary transition-colors"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {staged.length === 0 ? (
                /* ── STATE 1: Dropzone (matches Affidavit / Deed of Sale style) ── */
                <div
                    onDragOver={(e) => { e.preventDefault(); if (isTypeSelected) setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { if (!isTypeSelected) { e.preventDefault(); return; } handleDrop(e); }}
                    className={[
                        'rounded-2xl border-2 border-dashed transition-all',
                        isDragging
                            ? 'border-blue-400 bg-blue-50/70 dark:border-blue-700 dark:bg-blue-950/25'
                            : 'border-border-strong bg-surface hover:border-blue-300 hover:bg-blue-50/30 dark:hover:border-blue-700 dark:hover:bg-blue-950/20',
                    ].join(' ')}
                >
                    <div className="border-b border-border px-6 py-5">
                        <p className="text-xs font-black uppercase tracking-widest text-text-muted">
                            Upload Files
                        </p>
                        <h3 className="mt-2 text-xl font-black tracking-tight text-text-primary">
                            Drag and drop your documents here
                        </h3>
                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-muted">
                            Drop files directly into this area or click the button below to browse from your computer.
                        </p>
                    </div>
                    <div className="px-6 py-6">
                        <div className="rounded-2xl border border-border bg-surface-secondary/60 p-8 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200 bg-blue-100 dark:border-blue-900/80 dark:bg-blue-950/40">
                                <svg className="h-7 w-7 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <p className="text-base font-bold text-text-primary">
                                {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                            </p>
                            <p className="mt-2 text-xs font-medium text-text-muted">
                                Allowed files: {ALLOWED_FILE_LABEL}. Maximum 50 MB per file.
                            </p>
                            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                                <button
                                    type="button"
                                    id="files-tab-select-file-btn"
                                    disabled={!isTypeSelected}
                                    onClick={() => folderInputRef.current?.click()}
                                    title={!isTypeSelected ? 'Please select a document type first' : undefined}
                                    className={[
                                        'inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition-all',
                                        isTypeSelected
                                            ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                                            : 'bg-blue-600/40 cursor-not-allowed',
                                    ].join(' ')}
                                >
                                    Select File
                                </button>
                            </div>
                            <input
                                ref={folderInputRef}
                                type="file"
                                id="files-tab-file-input"
                                multiple
                                accept={ALLOWED_FILE_ACCEPT}
                                className="sr-only"
                                onChange={e => { addFiles(e.target.files); e.target.value = ''; }}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                /* ── STATE 2: Staged upload panel ── */
                <div className="rounded-2xl border-2 border-emerald-500/40 bg-surface overflow-hidden transition-all">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-border bg-emerald-500/5">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                    Ready to Upload
                                </p>
                                <h3 className="text-base font-bold text-text-primary mt-0.5">
                                    {staged.length} file{staged.length !== 1 ? 's' : ''} staged for Law Firm Records
                                </h3>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setStaged([])}
                            className="text-xs font-semibold text-text-muted hover:text-red-500 transition-colors"
                        >
                            Clear All
                        </button>
                    </div>

                    {/* File list */}
                    <div className="px-6 py-4 space-y-2 max-h-72 overflow-y-auto">
                        {staged.map(({ file, id }) => (
                            <div
                                key={id}
                                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-border bg-surface-secondary/40 hover:bg-surface-secondary/70 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-text-primary truncate">{file.name}</p>
                                    <p className="text-xs text-text-muted">{formatSize(file.size)}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeStaged(id)}
                                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all"
                                    title="Remove"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Footer actions */}
                    <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-surface-secondary/20">
                        <div className="flex items-center gap-4">
                            <p className="text-xs text-text-muted">
                                <span className="font-bold text-text-primary">{staged.length}</span> file{staged.length !== 1 ? 's' : ''} &bull; <span className="font-bold text-text-primary">{formatSize(totalSize)}</span> total
                            </p>
                            <button
                                type="button"
                                onClick={() => addMoreRef.current?.click()}
                                className="text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors"
                            >
                                + Add more files
                            </button>
                            <input
                                ref={addMoreRef}
                                type="file"
                                id="files-tab-add-more-input"
                                multiple
                                accept={ALLOWED_FILE_ACCEPT}
                                className="sr-only"
                                onChange={e => { addFiles(e.target.files); e.target.value = ''; }}
                            />
                        </div>
                        <button
                            id="files-tab-upload-to-records-btn"
                            type="button"
                            onClick={handleUploadToRecords}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload to Records
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


const DocumentListTab = ({ tabId, label, types = DOCUMENT_TYPES }: { tabId: string; label: string; types?: string[] }) => {
    const dropzoneInputRef = useRef<HTMLInputElement>(null);
    const [docType, setDocType] = useState(types[0]);
    const [isDragging, setIsDragging] = useState(false);
    const [records, setRecords] = useState<UploadedFile[]>([]);

    const addFiles = (incoming: FileList | null) => {
        if (!incoming) return;
        const newEntries: UploadedFile[] = Array.from(incoming).map(f => ({
            file: f,
            id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
        }));
        setRecords(prev => [...prev, ...newEntries]);
    };

    const removeRecord = (id: string) => setRecords(prev => prev.filter(r => r.id !== id));

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        addFiles(e.dataTransfer.files);
    };

    const filteredRecords = docType === types[0]
        ? records
        : records.filter(r => r.file.name.toLowerCase().includes(docType.toLowerCase()));

    const isTypeSelected = docType !== types[0];

    return (
        <div className="space-y-6">
            {/* Filter row */}
            <div className="flex flex-col gap-1">
                <label htmlFor={`${tabId}-doc-type-filter`} className="text-xs font-semibold text-text-muted">
                    Select Type <span className="text-red-500">*</span>
                </label>
                <div className="relative w-fit">
                    <select
                        id={`${tabId}-doc-type-filter`}
                        value={docType}
                        onChange={e => setDocType(e.target.value)}
                        className={[
                            'appearance-none pl-3 pr-8 py-2 rounded-lg text-sm font-medium bg-surface-secondary border text-text-primary focus:outline-none focus:ring-2 cursor-pointer transition-all',
                            isTypeSelected
                                ? 'border-border focus:ring-blue-500/40'
                                : 'border-red-500/60 focus:ring-red-500/30',
                        ].join(' ')}
                    >
                        {types.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                    <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Inline drag-and-drop upload zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); if (isTypeSelected) setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { if (!isTypeSelected) { e.preventDefault(); return; } handleDrop(e); }}
                className={[
                    'rounded-2xl border-2 border-dashed transition-all',
                    isDragging
                        ? 'border-blue-400 bg-blue-50/70 dark:border-blue-700 dark:bg-blue-950/25'
                        : 'border-border-strong bg-surface hover:border-blue-300 hover:bg-blue-50/30 dark:hover:border-blue-700 dark:hover:bg-blue-950/20',
                ].join(' ')}
            >
                <div className="border-b border-border px-6 py-5">
                    <p className="text-xs font-black uppercase tracking-widest text-text-muted">
                        Upload {label}
                    </p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-text-primary">
                        Drag and drop your {label} documents here
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-muted">
                        Drop files directly into this area or click the button below to browse from your computer.
                    </p>
                </div>

                <div className="px-6 py-6">
                    <div className="rounded-2xl border border-border bg-surface-secondary/60 p-8 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200 bg-blue-100 dark:border-blue-900/80 dark:bg-blue-950/40">
                            <svg className="h-7 w-7 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <p className="text-base font-bold text-text-primary">
                            {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                        </p>
                        <p className="mt-2 text-xs font-medium text-text-muted">
                            Allowed files: {ALLOWED_FILE_LABEL}. Maximum 50 MB per file.
                        </p>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            <button
                                type="button"
                                id={`${tabId}-inline-select-file-btn`}
                                disabled={!isTypeSelected}
                                onClick={() => dropzoneInputRef.current?.click()}
                                title={!isTypeSelected ? 'Please select a document type first' : undefined}
                                className={[
                                    'inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition-all',
                                    isTypeSelected
                                        ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                                        : 'bg-blue-600/40 cursor-not-allowed',
                                ].join(' ')}
                            >
                                Select File
                            </button>
                        </div>
                        <input
                            ref={dropzoneInputRef}
                            type="file"
                            id={`${tabId}-inline-file-input`}
                            multiple
                            accept={ALLOWED_FILE_ACCEPT}
                            className="sr-only"
                            onChange={e => { addFiles(e.target.files); e.target.value = ''; }}
                        />
                    </div>
                </div>
            </div>

            {/* Records list — files appear here after upload */}
            {filteredRecords.length > 0 ? (
                <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-text-muted px-1">
                        Records ({filteredRecords.length})
                    </p>
                    {filteredRecords.map(({ file, id }) => (
                        <div
                            key={id}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-surface-secondary/40 hover:bg-surface-secondary/70 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-text-primary truncate">{file.name}</p>
                                <p className="text-xs text-text-muted">{formatSize(file.size)}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeRecord(id)}
                                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all"
                                title="Remove"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                    <svg className="w-7 h-7 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-text-muted">No {label} records yet. Upload a file to get started.</p>
                </div>
            )}
        </div>
    );
};

export const FormsPage = () => {
    const [activeTab, setActiveTab] = useState<Tab>('files');

    return (
        <div className="w-full p-8 pb-12 space-y-7">

            {/* Page header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-text-primary">Documents</h1>
                    <p className="text-base text-text-muted mt-1">F.M. Morata — Legal Documents</p>
                </div>
                <CurrentDateTime
                    className="text-right shrink-0"
                    timeClassName="text-2xl font-bold tabular-nums text-text-primary"
                    dateClassName="text-sm text-text-muted"
                />
            </div>

            {/* Card container */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">

                {/* Tab bar */}
                <div className="flex items-center gap-1 px-4 pt-4 border-b border-border">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            id={`tab-${tab.id}`}
                            onClick={() => setActiveTab(tab.id)}
                            className={[
                                'px-5 py-2 rounded-t-lg text-sm font-semibold transition-all',
                                activeTab === tab.id
                                    ? 'bg-surface-secondary text-text-primary border border-b-0 border-border'
                                    : 'text-text-muted hover:text-text-primary',
                            ].join(' ')}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="p-6">
                    {activeTab === 'files' && <FilesTab />}
                    {activeTab === 'affidavit' && <DocumentListTab tabId="affidavit" label="Affidavit" types={AFFIDAVIT_TYPES} />}
                    {activeTab === 'deed-of-sale' && <DocumentListTab tabId="deed-of-sale" label="Deed of Sale" types={DEED_OF_SALE_TYPES} />}
                </div>
            </div>
        </div>
    );
};

