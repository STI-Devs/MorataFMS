import { useRef, useState } from 'react';
import { CurrentDateTime } from '../../../components/CurrentDateTime';
import { FileUploadModal } from './FileUploadModal';

type Tab = 'files' | 'affidavit' | 'deed-of-sale';

const DOCUMENT_TYPES = [
    'All Document Types',
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
    'All Affidavit Types',
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

const ALLOWED_FILE_LABEL = 'PDF, Word, Excel (including XLSM), CSV, TXT, JPG, JPEG, and PNG';
const ALLOWED_FILE_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.xlsm,.csv,.txt,.jpg,.jpeg,.png';

const TABS: { id: Tab; label: string }[] = [
    { id: 'files', label: 'Files' },
    { id: 'affidavit', label: 'Affidavit' },
    { id: 'deed-of-sale', label: 'Deed of Sale' },
];

// Files tab — folder dropzone inline, no Upload button in toolbar
const FilesTab = () => {
    const folderInputRef = useRef<HTMLInputElement>(null);
    const [docType, setDocType] = useState('All Document Types');
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        // Wire to real API when backend contract is ready
    };

    return (
        <div className="space-y-6">
            {/* Filter row only — no Upload button */}
            <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                </svg>
                <div className="relative">
                    <select
                        id="doc-type-filter"
                        value={docType}
                        onChange={e => setDocType(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-2 rounded-lg text-sm font-medium bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
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

            {/* Centered folder dropzone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={[
                    'rounded-2xl border-2 border-dashed transition-all',
                    isDragging
                        ? 'border-blue-400 bg-blue-50/70 dark:border-blue-700 dark:bg-blue-950/25'
                        : 'border-border-strong bg-surface hover:border-blue-300 hover:bg-blue-50/30 dark:hover:border-blue-700 dark:hover:bg-blue-950/20',
                ].join(' ')}
            >
                {/* Dropzone header */}
                <div className="border-b border-border px-6 py-5">
                    <p className="text-xs font-black uppercase tracking-widest text-text-muted">
                        Select Root Legacy Folder
                    </p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-text-primary">
                        Start with the same top-level folder the client already recognizes
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-muted">
                        Drag the root folder from Windows Explorer or select it manually. The UI should
                        inspect the hierarchy first, then upload the full batch with preserved relative paths.
                    </p>
                </div>

                {/* Drop zone inner */}
                <div className="px-6 py-6">
                    <div className="rounded-2xl border border-border bg-surface-secondary/60 p-8 text-center">
                        {/* Folder icon */}
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200 bg-blue-100 dark:border-blue-900/80 dark:bg-blue-950/40">
                            <svg className="h-7 w-7 text-blue-600 dark:text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                            </svg>
                        </div>

                        <p className="text-base font-bold text-text-primary">
                            {isDragging ? 'Drop the folder here' : 'Drag a root folder here'}
                        </p>
                        <p className="mt-2 text-xs font-medium text-text-muted">
                            Allowed files: {ALLOWED_FILE_LABEL}. Maximum 50 MB per file.
                        </p>

                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            <button
                                type="button"
                                id="files-tab-select-folder-btn"
                                onClick={() => folderInputRef.current?.click()}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700"
                            >
                                Select Folder
                            </button>
                        </div>

                        {/* Hidden folder input */}
                        <input
                            ref={folderInputRef}
                            type="file"
                            id="files-tab-folder-input"
                            // @ts-expect-error – webkitdirectory is valid for folder picking
                            webkitdirectory=""
                            multiple
                            accept={ALLOWED_FILE_ACCEPT}
                            className="sr-only"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const DocumentListTab = ({ tabId, label, onUpload, types = DOCUMENT_TYPES }: { tabId: string; label: string; onUpload: () => void; types?: string[] }) => {
    const [docType, setDocType] = useState(types[0]);

    return (
        <div className="space-y-6">
            {/* Filter + Upload row */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                    </svg>
                    <div className="relative">
                        <select
                            id={`${tabId}-doc-type-filter`}
                            value={docType}
                            onChange={e => setDocType(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 rounded-lg text-sm font-medium bg-surface-secondary border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
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
                <button
                    id={`${tabId}-upload-btn`}
                    type="button"
                    onClick={onUpload}
                    className="flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition-all shadow-sm shrink-0"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload File
                </button>
            </div>

            {/* Empty state — uploaded files will appear here */}
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center">
                    <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <div className="space-y-1.5 max-w-sm">
                    <p className="text-sm font-semibold text-text-primary">No {label} files yet</p>
                    <p className="text-sm text-text-muted">
                        Uploaded {label.toLowerCase()} documents will appear here.
                    </p>
                </div>
            </div>
        </div>
    );
};

export const FormsPage = () => {
    const [activeTab, setActiveTab] = useState<Tab>('files');
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    const uploadTitle = {
        files: 'Upload File',
        affidavit: 'Upload Affidavit',
        'deed-of-sale': 'Upload Deed of Sale',
    }[activeTab];

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
                    {activeTab === 'affidavit' && <DocumentListTab tabId="affidavit" label="Affidavit" types={AFFIDAVIT_TYPES} onUpload={() => setUploadModalOpen(true)} />}
                    {activeTab === 'deed-of-sale' && <DocumentListTab tabId="deed-of-sale" label="Deed of Sale" onUpload={() => setUploadModalOpen(true)} />}
                </div>
            </div>

            <FileUploadModal
                isOpen={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                title={uploadTitle}
            />
        </div>
    );
};
