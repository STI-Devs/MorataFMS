import React, { useCallback, useRef, useState } from 'react';
import { LegacyFolderBrowserPanel, MOCK_BATCHES } from './LegacyFolderBrowserPanel';
import type { LegacyBatch } from './LegacyFolderBrowserPanel';

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadPhase =
    | 'empty'
    | 'selected'
    | 'uploading'
    | 'complete'
    | 'partial'
    | 'failed';

interface FolderSummary {
    rootName: string;
    subfolderCount: number;
    fileCount: number;
    totalBytes: number;
    selectedAt: Date;
    previewTree: string[];
}

interface BatchMeta {
    batchName: string;
    year: string;
    department: string;
    notes: string;
    preserveNames: boolean;
    markLegacy: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
};

// ─── Small shared UI pieces ───────────────────────────────────────────────────

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-xs font-black text-text-muted uppercase tracking-widest mb-4">{children}</h3>
);

const StatusChip = ({ status }: { status: LegacyBatch['status'] }) => {
    const cls =
        status === 'Complete'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : status === 'Partial'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-red-50 text-red-700 border-red-200';
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}>
            {status}
        </span>
    );
};

// ─── 1. Info Banner ───────────────────────────────────────────────────────────

const InfoBanner = () => (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
        <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-black text-amber-800 uppercase tracking-widest mb-1">Legacy Reference Upload</p>
                <p className="text-sm font-semibold text-amber-950 mb-2">
                    This area is for uploading old historical folder structures exactly as they exist.
                </p>
                <ul className="space-y-1 text-xs text-amber-800">
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        Files uploaded here <strong>do not enter the live transaction workflow</strong>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        Original folder structure and names are preserved exactly as-is
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        Best used for vessel folders, transaction folders, and BL-level folders from previous manual filing
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        Intended for historical reference and retrieval only — no classification required
                    </li>
                </ul>
            </div>
        </div>
    </div>
);

// ─── Folder tree visual ───────────────────────────────────────────────────────

const FolderTreeGraphic = () => (
    <div className="flex flex-col items-center gap-1 py-5 select-none">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <span className="text-xs font-bold text-blue-700">Root Folder</span>
        </div>
        <div className="w-px h-3 bg-border-strong" />
        <div className="flex items-start gap-3">
            {['Subfolder A', 'Subfolder B', 'Subfolder C'].map((name, i) => (
                <div key={name} className={`flex flex-col items-center gap-1 ${i === 1 ? 'mt-4' : ''}`}>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-surface-secondary border border-border">
                        <svg className="w-3.5 h-3.5 text-text-muted" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                        <span className="text-[10px] text-text-secondary font-medium">{name}</span>
                    </div>
                    {i !== 1 && (
                        <>
                            <div className="w-px h-2 bg-border-strong" />
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-surface">
                                <svg className="w-3 h-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-[9px] text-text-muted">{i === 0 ? 'file.pdf' : 'doc.xlsx'}</span>
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
    </div>
);

// ─── 2. Folder Dropzone ───────────────────────────────────────────────────────

interface DropzoneProps {
    isDragging: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onSelectFolder: () => void;
    folderInputRef: React.RefObject<HTMLInputElement | null>;
    onFolderInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FolderDropzone = ({
    isDragging, onDragOver, onDragLeave, onDrop,
    onSelectFolder, folderInputRef, onFolderInput,
}: DropzoneProps) => (
    <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative rounded-xl border-2 border-dashed transition-all text-center ${isDragging
            ? 'border-blue-400 bg-blue-50/60'
            : 'border-border-strong bg-surface-secondary hover:border-blue-300 hover:bg-blue-50/30'
            }`}
    >
        <input
            ref={folderInputRef}
            type="file"
            // @ts-expect-error — webkitdirectory is not in standard HTMLInputElement typings but is supported by all modern browsers
            webkitdirectory=""
            multiple
            className="sr-only"
            onChange={onFolderInput}
        />

        <FolderTreeGraphic />

        <div className="px-8 pb-6">
            <p className="text-sm font-semibold text-text-secondary mb-1">
                Drag a root folder here
            </p>
            <p className="text-xs text-text-muted mb-5">
                e.g. a vessel folder, a client folder, or a year folder — nested subfolders are fully supported
            </p>

            <button
                type="button"
                id="legacy-select-folder-btn"
                onClick={onSelectFolder}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all active:scale-95"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                </svg>
                Select Folder
            </button>

            <div className="flex items-center justify-center gap-5 mt-5 text-[11px] text-text-muted">
                {['Folder hierarchy preserved', 'No classification required', 'For historical reference'].map(label => (
                    <span key={label} className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {label}
                    </span>
                ))}
            </div>
        </div>
    </div>
);

// ─── 3. Batch Metadata Panel ──────────────────────────────────────────────────

interface MetaPanelProps {
    meta: BatchMeta;
    onChange: (meta: BatchMeta) => void;
}

const MetadataPanel = ({ meta, onChange }: MetaPanelProps) => {
    const set = <K extends keyof BatchMeta>(key: K, value: BatchMeta[K]) =>
        onChange({ ...meta, [key]: value });

    const inputCls = 'w-full px-3 py-2.5 bg-input-bg border border-border-strong rounded-lg text-sm text-text-primary focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all placeholder:text-text-muted';
    const labelCls = 'text-[10px] font-black text-text-muted uppercase tracking-widest';

    return (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
            <SectionTitle>Batch Details</SectionTitle>

            <div className="space-y-1.5">
                <label className={labelCls}>Batch Name</label>
                <input
                    type="text"
                    value={meta.batchName}
                    onChange={e => set('batchName', e.target.value)}
                    placeholder="e.g. MV Golden Tide — 2022 Archive"
                    className={inputCls}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className={labelCls}>Year</label>
                    <select
                        value={meta.year}
                        onChange={e => set('year', e.target.value)}
                        className={`${inputCls} appearance-none cursor-pointer`}
                    >
                        {Array.from({ length: 15 }, (_, i) => 2026 - i).map(y => (
                            <option key={y} value={String(y)}>{y}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className={labelCls}>Department</label>
                    <select
                        value={meta.department}
                        onChange={e => set('department', e.target.value)}
                        className={`${inputCls} appearance-none cursor-pointer`}
                    >
                        <option value="Brokerage">Brokerage</option>
                        <option value="Legal">Legal</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1.5">
                <label className={labelCls}>Notes / Description</label>
                <textarea
                    value={meta.notes}
                    onChange={e => set('notes', e.target.value)}
                    placeholder="Add any relevant context about this folder batch…"
                    rows={3}
                    className={`${inputCls} resize-none`}
                />
            </div>

            <div className="space-y-2 pt-1">
                {([
                    { key: 'preserveNames' as const, label: 'Preserve original folder names exactly' },
                    { key: 'markLegacy' as const, label: 'Mark this upload as legacy reference only' },
                ]).map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${meta[key]
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-border-strong bg-input-bg group-hover:border-blue-400'
                            }`}
                            onClick={() => set(key, !meta[key])}
                        >
                            {meta[key] && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <span className="text-xs font-medium text-text-secondary">{label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

// ─── 4. Folder Summary Card ────────────────────────────────────────────────────

interface SummaryCardProps {
    summary: FolderSummary;
    onRemove: () => void;
    onReplace: () => void;
    onViewFull: () => void;
}

const FolderSummaryCard = ({ summary, onRemove, onReplace, onViewFull }: SummaryCardProps) => (
    <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                </div>
                <div>
                    <p className="text-sm font-bold text-text-primary">{summary.rootName}</p>
                    <p className="text-xs text-text-muted">Selected {summary.selectedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 shrink-0">
                Ready to Upload
            </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
            {[
                { label: 'Subfolders', value: summary.subfolderCount.toLocaleString() },
                { label: 'Files', value: summary.fileCount.toLocaleString() },
                { label: 'Total Size', value: formatBytes(summary.totalBytes) },
            ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-lg border border-blue-200 px-3 py-2.5 text-center">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-base font-black text-text-primary tabular-nums">{value}</p>
                </div>
            ))}
        </div>

        {/* Mini tree preview */}
        <div className="bg-white rounded-lg border border-blue-200 px-3 py-2.5 mb-4">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Folder Preview</p>
            <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-text-primary font-semibold">
                    <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                    {summary.rootName}/
                </div>
                {summary.previewTree.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-text-secondary pl-4">
                        <span className="text-border-strong select-none">└─</span>
                        {item.endsWith('/') ? (
                            <svg className="w-3 h-3 text-text-muted shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                            </svg>
                        ) : (
                            <svg className="w-3 h-3 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        )}
                        <span>{item}</span>
                    </div>
                ))}
                {summary.subfolderCount > 4 && (
                    <p className="text-[10px] text-text-muted pl-4 mt-0.5">
                        … and {summary.subfolderCount - 4} more subfolders
                    </p>
                )}
            </div>
        </div>

        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={onViewFull}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-strong bg-white text-xs font-bold text-text-secondary hover:bg-hover transition-all"
            >
                View Full Structure
            </button>
            <button
                type="button"
                onClick={onReplace}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-strong bg-white text-xs font-bold text-text-secondary hover:bg-hover transition-all"
            >
                Replace Folder
            </button>
            <button
                type="button"
                onClick={onRemove}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-xs font-bold text-red-600 hover:bg-red-100 transition-all ml-auto"
            >
                Remove
            </button>
        </div>
    </div>
);

// ─── 5. Upload Progress ────────────────────────────────────────────────────────

type BatchStatus = 'Preparing' | 'Uploading' | 'Completed' | 'Partial Success' | 'Failed';

interface ProgressState {
    total: number;
    done: number;
    failed: number;
    currentItem: string;
    status: BatchStatus;
}

const batchStatusColor: Record<BatchStatus, string> = {
    Preparing: 'bg-blue-100 text-blue-700 border-blue-200',
    Uploading: 'bg-blue-100 text-blue-700 border-blue-200',
    Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Partial Success': 'bg-amber-100 text-amber-700 border-amber-200',
    Failed: 'bg-red-100 text-red-700 border-red-200',
};

interface UploadProgressProps {
    progress: ProgressState;
    onCancel: () => void;
    onRetry: () => void;
}

const UploadProgressSection = ({ progress, onCancel, onRetry }: UploadProgressProps) => {
    const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

    return (
        <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    {(progress.status === 'Preparing' || progress.status === 'Uploading') && (
                        <div className="w-4 h-4 border-2 border-blue-400/40 border-t-blue-500 rounded-full animate-spin" />
                    )}
                    <span className="text-sm font-bold text-text-primary">
                        {progress.status === 'Preparing' ? 'Preparing upload…' : 'Uploading folder…'}
                    </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${batchStatusColor[progress.status]}`}>
                    {progress.status}
                </span>
            </div>

            <div className="mb-3">
                <div className="flex justify-between text-[11px] text-text-muted font-semibold mb-1.5">
                    <span>{progress.done.toLocaleString()} / {progress.total.toLocaleString()} files</span>
                    <span>{pct}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-surface-secondary overflow-hidden">
                    <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>

            <div className="flex items-center gap-5 mb-3 text-xs">
                <span className="text-text-muted">
                    <span className="font-bold text-text-primary">{progress.done.toLocaleString()}</span> uploaded
                </span>
                {progress.failed > 0 && (
                    <span className="text-text-muted">
                        <span className="font-bold text-red-500">{progress.failed.toLocaleString()}</span> failed
                    </span>
                )}
            </div>

            {progress.currentItem && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-secondary text-xs text-text-secondary mb-4">
                    <svg className="w-3.5 h-3.5 shrink-0 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="truncate font-medium">{progress.currentItem}</span>
                </div>
            )}

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 rounded-lg border border-border-strong bg-surface text-xs font-bold text-text-secondary hover:bg-hover transition-all"
                >
                    Cancel Upload
                </button>
                {progress.failed > 0 && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="px-4 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-all"
                    >
                        Retry Failed Files
                    </button>
                )}
            </div>
        </div>
    );
};

// ─── 6. Success State ─────────────────────────────────────────────────────────

interface SuccessStateProps {
    summary: FolderSummary;
    meta: BatchMeta;
    completedAt: Date;
    onViewFolder: () => void;
    onUploadAnother: () => void;
}

const SuccessState = ({ summary, meta, completedAt, onViewFolder, onUploadAnother }: SuccessStateProps) => (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-6">
        <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <div>
                <p className="text-sm font-bold text-emerald-900">Upload Complete</p>
                <p className="text-xs text-emerald-700">All files have been stored for reference.</p>
            </div>
        </div>

        <div className="bg-white rounded-lg border border-emerald-200 divide-y divide-emerald-100 mb-5">
            {[
                { label: 'Batch Name', value: meta.batchName || '—' },
                { label: 'Root Folder', value: summary.rootName },
                { label: 'Folders Uploaded', value: summary.subfolderCount.toLocaleString() },
                { label: 'Files Uploaded', value: summary.fileCount.toLocaleString() },
                { label: 'Total Size', value: formatBytes(summary.totalBytes) },
                {
                    label: 'Completed At', value: completedAt.toLocaleString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                    }),
                },
            ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs font-semibold text-text-muted">{label}</span>
                    <span className="text-xs font-bold text-text-primary">{value}</span>
                </div>
            ))}
        </div>

        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={onViewFolder}
                className="flex-1 px-4 py-2.5 rounded-lg border border-border-strong bg-white text-sm font-bold text-text-secondary hover:bg-hover transition-all"
            >
                View Legacy Folder
            </button>
            <button
                type="button"
                onClick={onUploadAnother}
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm transition-all"
            >
                Upload Another Folder
            </button>
        </div>
    </div>
);

// ─── 7. Error / Partial Success State ────────────────────────────────────────

interface ErrorStateProps {
    uploaded: number;
    failed: number;
    isPartial: boolean;
    onRetry: () => void;
    onStartNew: () => void;
}

const ErrorState = ({ uploaded, failed, isPartial, onRetry, onStartNew }: ErrorStateProps) => (
    <div className={`rounded-xl border p-6 ${isPartial ? 'border-amber-200 bg-amber-50/40' : 'border-red-200 bg-red-50/30'}`}>
        <div className="flex items-center gap-3 mb-4">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isPartial ? 'bg-amber-100 border border-amber-200' : 'bg-red-100 border border-red-200'}`}>
                <svg className={`w-4.5 h-4.5 ${isPartial ? 'text-amber-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <div>
                <p className={`text-sm font-bold ${isPartial ? 'text-amber-900' : 'text-red-900'}`}>
                    {isPartial ? 'Partial Upload' : 'Upload Failed'}
                </p>
                <p className={`text-xs ${isPartial ? 'text-amber-700' : 'text-red-700'}`}>
                    {isPartial
                        ? 'Some files could not be uploaded. The rest have been saved.'
                        : 'The upload could not be completed. No files were saved.'}
                </p>
            </div>
        </div>

        <div className="flex items-center gap-4 mb-4 text-xs">
            <span><span className="font-bold text-emerald-600">{uploaded}</span> files uploaded successfully</span>
            <span><span className="font-bold text-red-600">{failed}</span> files failed</span>
        </div>

        {isPartial && (
            <p className="text-xs text-text-muted mb-4">
                Failed files are usually caused by unsupported file types or network interruptions during upload.
                You can retry them or download an error list for review.
            </p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
            <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-700 transition-all"
            >
                Retry Failed Files
            </button>
            <button
                type="button"
                className="px-4 py-2 rounded-lg border border-border-strong bg-surface hover:bg-hover text-xs font-bold text-text-secondary transition-all"
            >
                Download Error List
            </button>
            <button
                type="button"
                onClick={onStartNew}
                className="px-4 py-2 rounded-lg border border-border-strong bg-surface hover:bg-hover text-xs font-bold text-text-secondary transition-all"
            >
                Start New Upload
            </button>
        </div>
    </div>
);

// ─── 8. Upload History Table ──────────────────────────────────────────────────

const UploadHistoryTable = ({
    rows,
    onView,
}: {
    rows: LegacyBatch[];
    onView: (batch: LegacyBatch) => void;
}) => (
    <div>
        <div className="flex items-center justify-between mb-4">
            <SectionTitle>Previous Legacy Uploads</SectionTitle>
        </div>

        {rows.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface-secondary py-12 text-center">
                <svg className="w-10 h-10 text-text-muted mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <p className="text-sm font-bold text-text-secondary">No legacy uploads yet</p>
                <p className="text-xs text-text-muted mt-1">Uploaded folder batches will appear here.</p>
            </div>
        ) : (
            <div className="rounded-xl border border-border overflow-hidden bg-surface">
                {/* Header */}
                <div
                    className="grid items-center px-4 py-3 border-b border-border bg-surface-secondary"
                    style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 80px 90px 90px 100px' }}
                >
                    {['Batch Name', 'Root Folder', 'Uploaded By', 'Date', 'Files', 'Size', 'Status', 'Actions'].map(h => (
                        <span key={h} className="text-[10px] font-black text-text-muted uppercase tracking-widest">{h}</span>
                    ))}
                </div>

                {/* Rows */}
                <div className="divide-y divide-border">
                    {rows.map(row => (
                        <div
                            key={row.id}
                            className="grid items-center px-4 py-3 hover:bg-hover transition-colors"
                            style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 80px 90px 90px 100px' }}
                        >
                            <div className="min-w-0 pr-2">
                                <p className="text-sm font-semibold text-text-primary truncate">{row.batchName}</p>
                            </div>
                            <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                                    </svg>
                                    <span className="text-xs text-text-secondary truncate font-medium">{row.rootFolder}</span>
                                </div>
                            </div>
                            <span className="text-xs text-text-secondary">{row.uploadedBy}</span>
                            <span className="text-xs text-text-muted">{row.uploadDate}</span>
                            <span className="text-xs tabular-nums text-text-secondary">{row.fileCount.toLocaleString()}</span>
                            <span className="text-xs tabular-nums text-text-secondary">{row.totalSize}</span>
                            <StatusChip status={row.status} />
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => onView(row)}
                                    className="px-2 py-1 rounded text-[10px] font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                    View
                                </button>
                                <button
                                    type="button"
                                    className="px-2 py-1 rounded text-[10px] font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                    Download
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const DEFAULT_META: BatchMeta = {
    batchName: '',
    year: String(new Date().getFullYear()),
    department: 'Brokerage',
    notes: '',
    preserveNames: true,
    markLegacy: true,
};

// ─── Demo seed data (mirrors client's real VESSEL 1 folder photos) ────────────
const DEMO_FOLDER: FolderSummary = {
    rootName: 'VESSEL 1',
    subfolderCount: 47,
    fileCount: 892,
    totalBytes: 4_512_000_000,
    selectedAt: new Date(),
    previewTree: [
        'CIL ATTACHMENT/',
        'CMA VESSEL/',
        'CONTSHIP WAY/',
        'DANU BHUM/',
        'DOCS FILE/',
        'ED CANCELLATION/',
        'KOTA HAKIM/',
        'KOTA MAKIM/',
    ],
};

const DEMO_META: BatchMeta = {
    batchName: 'VESSEL 1 — Historical Archive',
    year: '2025',
    department: 'Brokerage',
    notes: 'Legacy import files organized by vessel. Covers voyages from 2023–2025. Original folder structure preserved.',
    preserveNames: true,
    markLegacy: true,
};

export const LegacyFolderUploadView = () => {
    const [phase, setPhase] = useState<UploadPhase>('selected');
    const [isDragging, setIsDragging] = useState(false);
    const [folderSummary, setFolderSummary] = useState<FolderSummary | null>(DEMO_FOLDER);
    const [meta, setMeta] = useState<BatchMeta>(DEMO_META);
    const [completedAt, setCompletedAt] = useState<Date | null>(null);
    const [progress, setProgress] = useState<ProgressState>({
        total: 0, done: 0, failed: 0, currentItem: '', status: 'Preparing',
    });
    const [viewingBatch, setViewingBatch] = useState<LegacyBatch | null>(null);

    const folderInputRef = useRef<HTMLInputElement | null>(null);
    const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const buildSummaryFromFiles = (files: FileList): FolderSummary => {
        const folderPaths = new Set<string>();
        let totalBytes = 0;
        const previewItems: string[] = [];

        Array.from(files).forEach(file => {
            totalBytes += file.size;
            const parts = file.webkitRelativePath.split('/');
            if (parts.length > 1) folderPaths.add(parts.slice(0, -1).join('/'));
            if (previewItems.length < 5) {
                const name = parts.length > 2 ? parts[1] + '/' : file.name;
                if (!previewItems.includes(name)) previewItems.push(name);
            }
        });

        const rootName = files[0]?.webkitRelativePath.split('/')[0] ?? 'Selected Folder';

        return {
            rootName,
            subfolderCount: folderPaths.size,
            fileCount: files.length,
            totalBytes,
            selectedAt: new Date(),
            previewTree: previewItems,
        };
    };

    const handleFolderInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setFolderSummary(buildSummaryFromFiles(files));
        setMeta(prev => ({
            ...prev,
            batchName: prev.batchName || (files[0]?.webkitRelativePath.split('/')[0] ?? ''),
        }));
        setPhase('selected');
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        folderInputRef.current?.click();
    }, []);

    const startSimulatedUpload = () => {
        if (!folderSummary) return;
        const total = folderSummary.fileCount;
        setProgress({ total, done: 0, failed: 0, currentItem: 'Preparing…', status: 'Preparing' });
        setPhase('uploading');

        let done = 0;
        const step = Math.max(1, Math.floor(total / 40));

        simulationRef.current = setInterval(() => {
            done = Math.min(done + step + Math.floor(Math.random() * step), total);
            setProgress(prev => ({
                ...prev,
                done,
                status: done === 0 ? 'Preparing' : 'Uploading',
                currentItem: `Uploading file ${done} of ${total}…`,
            }));

            if (done >= total) {
                clearInterval(simulationRef.current!);
                const now = new Date();
                setCompletedAt(now);
                setProgress(prev => ({ ...prev, done: total, status: 'Completed', currentItem: '' }));
                setTimeout(() => setPhase('complete'), 600);
            }
        }, 120);
    };

    const handleCancel = () => {
        if (simulationRef.current) clearInterval(simulationRef.current);
        setPhase('selected');
    };

    const handleReset = () => {
        if (simulationRef.current) clearInterval(simulationRef.current);
        setFolderSummary(null);
        setMeta(DEFAULT_META);
        setCompletedAt(null);
        setPhase('empty');
        if (folderInputRef.current) folderInputRef.current.value = '';
    };

    const isUploading = phase === 'uploading';
    const isComplete = phase === 'complete';
    const isError = phase === 'failed' || phase === 'partial';

    return (
        <>
            <div className="space-y-6">
                {/* ── 1. Info Banner ── */}
                <InfoBanner />

                {/* ── Main upload area ───────────────────────────────────── */}
                {!isComplete && !isError && (
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
                        {/* Left: dropzone or summary or progress */}
                        <div className="space-y-4">
                            {!isUploading && (
                                <>
                                    {phase === 'empty' ? (
                                        /* ── 2. Dropzone ── */
                                        <FolderDropzone
                                            isDragging={isDragging}
                                            onDragOver={handleDragOver}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={handleDrop}
                                            onSelectFolder={() => folderInputRef.current?.click()}
                                            folderInputRef={folderInputRef}
                                            onFolderInput={handleFolderInput}
                                        />
                                    ) : folderSummary ? (
                                        /* ── 4. Summary Card ── */
                                        <FolderSummaryCard
                                            summary={folderSummary}
                                            onRemove={handleReset}
                                            onReplace={() => folderInputRef.current?.click()}
                                            onViewFull={() => { /* future: open tree modal */ }}
                                        />
                                    ) : null}

                                    {/* Hidden input re-used for Replace */}
                                    <input
                                        ref={folderInputRef}
                                        type="file"
                                        // @ts-expect-error — webkitdirectory not in standard typings
                                        webkitdirectory=""
                                        multiple
                                        className="sr-only"
                                        onChange={handleFolderInput}
                                    />
                                </>
                            )}

                            {/* ── 5. Progress Section ── */}
                            {isUploading && (
                                <UploadProgressSection
                                    progress={progress}
                                    onCancel={handleCancel}
                                    onRetry={() => startSimulatedUpload()}
                                />
                            )}

                            {/* Upload button — only in selected phase */}
                            {phase === 'selected' && folderSummary && (
                                <button
                                    type="button"
                                    id="legacy-start-upload-btn"
                                    onClick={startSimulatedUpload}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all active:scale-[.99]"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    Upload {folderSummary.fileCount.toLocaleString()} Files to Legacy Storage
                                </button>
                            )}
                        </div>

                        {/* Right: Metadata panel */}
                        {!isUploading && (
                            /* ── 3. Metadata Panel ── */
                            <MetadataPanel meta={meta} onChange={setMeta} />
                        )}
                    </div>
                )}

                {/* ── 6. Success State ── */}
                {isComplete && folderSummary && completedAt && (
                    <SuccessState
                        summary={folderSummary}
                        meta={meta}
                        completedAt={completedAt}
                        onViewFolder={() => { /* future: navigate to legacy folder view */ }}
                        onUploadAnother={handleReset}
                    />
                )}

                {/* ── 7. Error / Partial Success ── */}
                {isError && (
                    <ErrorState
                        uploaded={phase === 'partial' ? (folderSummary?.fileCount ?? 0) - 12 : 0}
                        failed={12}
                        isPartial={phase === 'partial'}
                        onRetry={() => startSimulatedUpload()}
                        onStartNew={handleReset}
                    />
                )}

                {/* ── 8. Upload History ── */}
                <div className="pt-4 border-t border-border">
                    <UploadHistoryTable
                        rows={MOCK_BATCHES}
                        onView={batch => setViewingBatch(batch)}
                    />
                </div>
            </div>

            {/* ── Folder Browser Slide-Over ── */}
            {viewingBatch && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/40 z-40"
                        onClick={() => setViewingBatch(null)}
                    />
                    {/* Panel */}
                    <div className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-5xl bg-surface shadow-2xl border-l border-border">
                        <LegacyFolderBrowserPanel
                            batch={viewingBatch}
                            onClose={() => setViewingBatch(null)}
                        />
                    </div>
                </>
            )}
        </>
    );
};
