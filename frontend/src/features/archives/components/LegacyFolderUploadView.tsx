import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLegacyBatch } from '../hooks/useLegacyBatch';
import { useLegacyBatchMutations } from '../hooks/useLegacyBatchMutations';
import type { FileNode, LegacyBatch, LegacyBatchMetadata, LegacyBatchSummary } from '../types/legacyBatch.types';
import { LegacyFolderBrowserPanel } from './LegacyFolderBrowserPanel';

type UploadPhase = 'empty' | 'selected' | 'uploading' | 'complete' | 'interrupted' | 'failed';

interface FolderSummary {
    rootName: string;
    topLevelFolderCount: number;
    subfolderCount: number;
    fileCount: number;
    totalBytes: number;
    maxDepth: number;
    selectedAt: Date;
    previewTree: string[];
}

interface BatchMeta {
    batchName: string;
    year: string;
    department: string;
    notes: string;
}

interface ProgressState {
    total: number;
    done: number;
    failed: number;
    currentItem: string;
    status: string;
}

interface PreflightCheck {
    label: string;
    value: string;
    tone: 'good' | 'warn' | 'neutral';
}

interface PreflightReport {
    patternLabel: string;
    reviewStatus: string;
    checks: PreflightCheck[];
    warnings: string[];
}

interface RejectedLegacyFile {
    relativePath: string;
    reason: string;
}

const DEFAULT_META: BatchMeta = {
    batchName: '',
    year: '',
    department: '',
    notes: '',
};

const LEGACY_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const LEGACY_ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'xlsm', 'csv', 'txt', 'jpg', 'jpeg', 'png'] as const;
const LEGACY_ALLOWED_FILE_ACCEPT = LEGACY_ALLOWED_EXTENSIONS.map((extension) => `.${extension}`).join(',');
const LEGACY_ALLOWED_FILE_LABEL = 'PDF, Word, Excel (including XLSM), CSV, TXT, JPG, JPEG, and PNG';
const LEGACY_MANIFEST_CHUNK_SIZE = 250;
const LEGACY_SIGNED_UPLOAD_CHUNK_SIZE = 10;
const LEGACY_LARGE_BATCH_WARNING_FILE_COUNT = 1000;

const semanticToneClasses = {
    info: 'border-blue-200 bg-blue-50/80 text-blue-700 dark:border-blue-900/80 dark:bg-blue-950/30 dark:text-blue-200',
    good: 'border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900/80 dark:bg-emerald-950/25 dark:text-emerald-200',
    warn: 'border-amber-200 bg-amber-50/80 text-amber-700 dark:border-amber-900/80 dark:bg-amber-950/25 dark:text-amber-200',
    danger: 'border-red-200 bg-red-50/80 text-red-700 dark:border-red-900/80 dark:bg-red-950/25 dark:text-red-200',
} as const;

const statusBadgeBaseClass = 'inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider';
const raisedSurfaceClass = 'border border-border-strong bg-surface font-bold text-text-secondary transition-all hover:bg-hover dark:bg-surface-secondary/75';
const tintedInsetSurfaceClass = 'bg-surface border border-border shadow-sm dark:bg-surface-secondary/75 dark:shadow-none';

const formatBytes = (bytes: number): string => {
    if (bytes === 0) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / 1024 ** unitIndex;

    return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
};

const normalizeRelativePath = (path: string): string => path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/|\/$/g, '');

const getFileExtension = (path: string): string => {
    const normalizedPath = normalizeRelativePath(path);
    const segments = normalizedPath.split('/');
    const filename = segments[segments.length - 1] ?? '';
    const parts = filename.split('.');

    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

const validateLegacyFiles = (files: File[]): { validFiles: File[]; rejectedFiles: RejectedLegacyFile[] } => {
    const validFiles: File[] = [];
    const rejectedFiles: RejectedLegacyFile[] = [];

    files.forEach((file) => {
        const relativePath = normalizeRelativePath(file.webkitRelativePath || file.name);
        const extension = getFileExtension(relativePath);

        if (!LEGACY_ALLOWED_EXTENSIONS.includes(extension as (typeof LEGACY_ALLOWED_EXTENSIONS)[number])) {
            rejectedFiles.push({
                relativePath,
                reason: `Blocked file type. Only ${LEGACY_ALLOWED_FILE_LABEL} are allowed.`,
            });
            return;
        }

        if (file.size > LEGACY_MAX_FILE_SIZE_BYTES) {
            rejectedFiles.push({
                relativePath,
                reason: `File exceeds the 50 MB limit (${formatBytes(file.size)}).`,
            });
            return;
        }

        validFiles.push(file);
    });

    return { validFiles, rejectedFiles };
};

const getLegacyUploadErrorMessage = (error: unknown): string => {
    const responseData = (error as {
        response?: {
            data?: {
                message?: string;
                errors?: Record<string, string[]>;
            };
        };
    })?.response?.data;

    const validationMessage = responseData?.errors
        ? Object.values(responseData.errors).flat().find((message) => typeof message === 'string' && message.trim().length > 0)
        : null;

    return validationMessage
        ?? responseData?.message
        ?? (error instanceof Error ? error.message : null)
        ?? 'Legacy upload failed. Please try again.';
};

const formatDateLabel = (isoDate?: string | null): string => {
    if (!isoDate) {
        return '—';
    }

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(isoDate));
};

const getMissingMetadataFields = (meta: BatchMeta): string[] => {
    const missing: string[] = [];

    if (!meta.batchName.trim()) {
        missing.push('Batch name');
    }

    if (!meta.year.trim()) {
        missing.push('Year');
    }

    if (!meta.department.trim()) {
        missing.push('Department');
    }

    return missing;
};

const inspectTree = (node: FileNode, depth = 1): { folders: number; files: number; maxDepth: number } => {
    if (node.type === 'file') {
        return { folders: 0, files: 1, maxDepth: depth };
    }

    let folders = 0;
    let files = 0;
    let maxDepth = depth;

    (node.children ?? []).forEach((child) => {
        if (child.type === 'folder') {
            folders += 1;
        }

        const totals = inspectTree(child, depth + 1);
        folders += totals.folders;
        files += totals.files;
        maxDepth = Math.max(maxDepth, totals.maxDepth);
    });

    return { folders, files, maxDepth };
};

const buildSummaryFromFiles = (files: File[]): FolderSummary => {
    const folderPaths = new Set<string>();
    const topLevelFolders = new Set<string>();
    const previewItems: string[] = [];
    let totalBytes = 0;
    let maxDepth = 1;

    files.forEach((file) => {
        totalBytes += file.size;
        const relativePath = normalizeRelativePath(file.webkitRelativePath || file.name);
        const parts = relativePath.split('/').filter(Boolean);

        maxDepth = Math.max(maxDepth, parts.length);

        if (parts.length > 1) {
            folderPaths.add(parts.slice(0, -1).join('/'));
        }

        if (parts.length > 2) {
            topLevelFolders.add(parts[1]);
            if (previewItems.length < 8 && !previewItems.includes(`${parts[1]}/`)) {
                previewItems.push(`${parts[1]}/`);
            }
        }
    });

    const rootName = normalizeRelativePath(files[0]?.webkitRelativePath || files[0]?.name || 'Selected Folder').split('/')[0];

    return {
        rootName,
        topLevelFolderCount: topLevelFolders.size,
        subfolderCount: folderPaths.size,
        fileCount: files.length,
        totalBytes,
        maxDepth,
        selectedAt: new Date(),
        previewTree: previewItems,
    };
};

const buildTreeFromFiles = (files: File[], rootName: string): FileNode => {
    const root: FileNode = {
        name: rootName,
        type: 'folder',
        children: [],
    };

    const findFolder = (children: FileNode[], name: string): FileNode => {
        let folder = children.find((child) => child.type === 'folder' && child.name === name);

        if (!folder) {
            folder = { name, type: 'folder', children: [] };
            children.push(folder);
        }

        return folder;
    };

    files.forEach((file) => {
        const parts = normalizeRelativePath(file.webkitRelativePath || `${rootName}/${file.name}`).split('/');
        const relativeParts = parts[0] === rootName ? parts.slice(1) : parts;

        if (relativeParts.length === 0) {
            return;
        }

        let current = root;

        relativeParts.forEach((part, index) => {
            const isLast = index === relativeParts.length - 1;

            if (isLast) {
                current.children ??= [];
                current.children.push({
                    name: part,
                    type: 'file',
                    size: formatBytes(file.size),
                    modified: new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    }).format(new Date(file.lastModified)),
                    status: 'pending',
                });
                return;
            }

            current.children ??= [];
            current = findFolder(current.children, part);
        });
    });

    return root;
};

const buildPreflightReport = (
    summary: FolderSummary,
    isResumeMode: boolean,
): PreflightReport => ({
    patternLabel: summary.rootName.toUpperCase().includes('VESSEL')
        ? 'Vessel-based legacy archive detected'
        : 'Legacy root folder detected',
    reviewStatus: isResumeMode ? 'Resume-ready structure loaded' : 'Ready for upload',
    checks: [
        {
            label: 'Root folder',
            value: summary.rootName,
            tone: 'neutral',
        },
        {
            label: 'Visible folder groups',
            value: `${summary.topLevelFolderCount} top-level groups`,
            tone: summary.topLevelFolderCount > 0 ? 'good' : 'warn',
        },
        {
            label: 'Detected depth',
            value: `${summary.maxDepth} levels from root to deepest file`,
            tone: summary.maxDepth >= 5 ? 'warn' : 'neutral',
        },
        {
            label: 'Cloud handling',
            value: isResumeMode
                ? 'Resume only the remaining files in this interrupted batch'
                : 'Store as one legacy batch with preserved relative paths',
            tone: 'good',
        },
    ],
    warnings: [
        'Original relative paths should stay exactly as the user selected them.',
        summary.maxDepth >= 5
            ? 'Deep nesting is acceptable for retrieval, but normalization should remain optional later.'
            : 'Hierarchy depth is manageable for browser-based retrieval.',
        isResumeMode
            ? 'Select the same root folder again so remaining files can be matched against the preserved manifest.'
            : 'Final validation should still happen server-side before the batch is committed.',
    ],
});

const chunk = <T,>(items: T[], size: number): T[][] => {
    const result: T[][] = [];

    for (let index = 0; index < items.length; index += size) {
        result.push(items.slice(index, index + size));
    }

    return result;
};

const WorkflowSteps = ({ phase }: { phase: UploadPhase }) => {
    const activeIndex =
        phase === 'empty' ? 1
            : phase === 'selected' ? 2
                : phase === 'uploading' ? 3
                    : 3;

    const steps = [
        {
            title: 'Select root folder',
            description: 'Start from the same top-level folder the staff already recognizes from the client archive.',
        },
        {
            title: 'Review preflight',
            description: 'Confirm the detected hierarchy and required metadata before the batch is created.',
        },
        {
            title: 'Upload batch',
            description: 'Upload the preserved hierarchy and keep progress resumable at the file level.',
        },
    ];

    return (
        <div className="grid gap-3 md:grid-cols-3">
            {steps.map((step, index) => {
                const stepIndex = index + 1;
                const isActive = activeIndex === stepIndex;
                const isComplete = activeIndex > stepIndex;

                return (
                    <div
                        key={step.title}
                        className={`rounded-xl border px-4 py-4 ${
                            isActive
                                ? semanticToneClasses.info
                                : isComplete
                                    ? semanticToneClasses.good
                                    : 'border-border bg-surface'
                        }`}
                    >
                        <div className="mb-2 flex items-center gap-2">
                            <span
                                className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-black ${
                                    isActive
                                        ? 'border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-200'
                                        : isComplete
                                            ? 'border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-200'
                                            : 'border-border-strong bg-surface-secondary text-text-muted'
                                }`}
                            >
                                {stepIndex}
                            </span>
                            <p className="text-sm font-bold text-text-primary">{step.title}</p>
                        </div>
                        <p className="text-xs leading-relaxed text-text-muted">{step.description}</p>
                    </div>
                );
            })}
        </div>
    );
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-xs font-black uppercase tracking-widest text-text-muted">{children}</h3>
);

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-1">
        <span>{children}</span>
        <span className="text-red-500">*</span>
    </span>
);

const MetadataPanel = ({
    meta,
    onChange,
}: {
    meta: BatchMeta;
    onChange: React.Dispatch<React.SetStateAction<BatchMeta>>;
}) => (
    <div className="rounded-2xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
            <SectionTitle>Batch Details</SectionTitle>
        </div>

        <div className="space-y-4 px-5 py-5">
            <label className="block">
                <span className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-text-muted">
                    <RequiredLabel>Batch Name</RequiredLabel>
                </span>
                <input
                    aria-label="Batch Name"
                    value={meta.batchName}
                    onChange={(event) => onChange((current) => ({ ...current, batchName: event.target.value }))}
                    className="w-full rounded-xl border border-border-strong bg-input-bg px-4 py-3 text-sm text-text-primary outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                    <span className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-text-muted">
                        <RequiredLabel>Year</RequiredLabel>
                    </span>
                    <input
                        aria-label="Year"
                        value={meta.year}
                        onChange={(event) => onChange((current) => ({ ...current, year: event.target.value }))}
                        placeholder="Enter year"
                        className="w-full rounded-xl border border-border-strong bg-input-bg px-4 py-3 text-sm text-text-primary outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                    />
                </label>

                <label className="block">
                    <span className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-text-muted">
                        <RequiredLabel>Department</RequiredLabel>
                    </span>
                    <select
                        aria-label="Department"
                        value={meta.department}
                        onChange={(event) => onChange((current) => ({ ...current, department: event.target.value }))}
                        className="w-full rounded-xl border border-border-strong bg-input-bg px-4 py-3 text-sm text-text-primary outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                    >
                        <option value="">Select department</option>
                        <option value="Brokerage">Brokerage</option>
                        <option value="Legal">Legal</option>
                    </select>
                </label>
            </div>

            <label className="block">
                <span className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-text-muted">
                    Notes
                </span>
                <textarea
                    aria-label="Notes"
                    rows={4}
                    value={meta.notes}
                    onChange={(event) => onChange((current) => ({ ...current, notes: event.target.value }))}
                    className="w-full rounded-xl border border-border-strong bg-input-bg px-4 py-3 text-sm text-text-primary outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
            </label>
        </div>
    </div>
);

const FolderDropzone = ({
    isDragging,
    onDragOver,
    onDragLeave,
    onDrop,
    onSelectFolder,
    isResumeMode,
}: {
    isDragging: boolean;
    onDragOver: (event: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (event: React.DragEvent) => void;
    onSelectFolder: () => void;
    isResumeMode: boolean;
}) => (
    <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`rounded-2xl border-2 border-dashed transition-all ${
            isDragging
                ? 'border-blue-400 bg-blue-50/70 dark:border-blue-700 dark:bg-blue-950/25'
                : 'border-border-strong bg-surface hover:border-blue-300 hover:bg-blue-50/30 dark:hover:border-blue-700 dark:hover:bg-blue-950/20'
        }`}
    >
        <div className="border-b border-border px-6 py-5">
            <SectionTitle>{isResumeMode ? 'Resume Legacy Batch' : 'Select Root Legacy Folder'}</SectionTitle>
            <h3 className="mt-2 text-xl font-black tracking-tight text-text-primary">
                {isResumeMode
                    ? 'Select the same root folder again so the interrupted batch can continue'
                    : 'Start with the same top-level folder the client already recognizes'}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-muted">
                Drag the root folder from Windows Explorer or select it manually. The UI should inspect the hierarchy first,
                then upload the full batch with preserved relative paths.
            </p>
        </div>

        <div className="px-6 py-6">
            <div className="rounded-2xl border border-border bg-surface-secondary/60 p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200 bg-blue-100 dark:border-blue-900/80 dark:bg-blue-950/40">
                    <svg className="h-7 w-7 text-blue-600 dark:text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                </div>
                <p className="text-base font-bold text-text-primary">Drag a root folder here</p>
                <p className="mt-2 text-xs font-medium text-text-muted">
                    Allowed files: {LEGACY_ALLOWED_FILE_LABEL}. Maximum 50 MB per file.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={onSelectFolder}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700"
                    >
                        Select Folder
                    </button>
                </div>
            </div>
        </div>
    </div>
);

const SelectedFolderPanel = ({
    summary,
    onRemove,
    onReplace,
    onViewFull,
}: {
    summary: FolderSummary;
    onRemove: () => void;
    onReplace: () => void;
    onViewFull: () => void;
}) => (
    <div className="rounded-2xl border border-border bg-surface">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div>
                <SectionTitle>Selected Root Folder</SectionTitle>
                <h3 className="mt-2 text-lg font-black tracking-tight text-text-primary">{summary.rootName}</h3>
                <p className="mt-1 text-sm text-text-muted">
                    Selected {summary.selectedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                    {' '}The cloud batch should preserve this folder as the top-level legacy container.
                </p>
            </div>
            <span className={`${statusBadgeBaseClass} ${semanticToneClasses.info}`}>
                Ready for preflight
            </span>
        </div>

        <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 xl:grid-cols-4">
            {[
                { label: 'Top-level folders', value: summary.topLevelFolderCount.toLocaleString() },
                { label: 'Nested folders', value: summary.subfolderCount.toLocaleString() },
                { label: 'Files', value: summary.fileCount.toLocaleString() },
                { label: 'Deepest path', value: `${summary.maxDepth} levels` },
            ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border bg-surface-secondary/50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{item.label}</p>
                    <p className="mt-1 text-lg font-black text-text-primary">{item.value}</p>
                </div>
            ))}
        </div>

        <div className="border-t border-border px-5 py-4">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-text-muted">Top-Level Preview</p>
            <div className="grid gap-2 sm:grid-cols-2">
                {summary.previewTree.map((item) => (
                    <div key={item} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-text-secondary ${tintedInsetSurfaceClass}`}>
                        <svg className="h-3.5 w-3.5 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                        <span className="truncate">{item}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-4">
            <button
                type="button"
                onClick={onViewFull}
                className={`rounded-xl ${raisedSurfaceClass}`}
            >
                View Full Structure
            </button>
            <button
                type="button"
                onClick={onReplace}
                className={`rounded-xl ${raisedSurfaceClass}`}
            >
                Replace Folder
            </button>
            <button
                type="button"
                onClick={onRemove}
                className={`ml-auto rounded-xl px-4 py-2 text-xs font-bold transition-all hover:bg-red-100 dark:hover:bg-red-950/40 ${semanticToneClasses.danger}`}
            >
                Clear Selection
            </button>
        </div>
    </div>
);

const toneClasses: Record<'good' | 'warn' | 'neutral', string> = {
    good: semanticToneClasses.good,
    warn: semanticToneClasses.warn,
    neutral: 'border-border bg-surface-secondary text-text-secondary',
};

const PreflightPanel = ({
    report,
    summary,
    rejectedFiles,
}: {
    report: PreflightReport;
    summary: FolderSummary;
    rejectedFiles: RejectedLegacyFile[];
}) => (
    <div className="rounded-2xl border border-border bg-surface">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div>
                <SectionTitle>Preflight</SectionTitle>
                <h3 className="mt-2 text-lg font-black tracking-tight text-text-primary">{report.patternLabel}</h3>
            </div>
            <span className={`${statusBadgeBaseClass} ${semanticToneClasses.info}`}>
                {report.reviewStatus}
            </span>
        </div>

        <div className="grid gap-3 px-5 py-5 md:grid-cols-3">
            {report.checks.map((check) => (
                <div key={check.label} className={`rounded-xl border px-4 py-3 ${toneClasses[check.tone]}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest">{check.label}</p>
                    <p className="mt-1 text-sm font-bold">{check.value}</p>
                </div>
            ))}
        </div>

        <div className="border-t border-border px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">What the system detected</p>
            <p className="mt-2 text-sm text-text-secondary">
                {summary.fileCount.toLocaleString()} files · {summary.subfolderCount.toLocaleString()} folders · {formatBytes(summary.totalBytes)}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                {report.warnings.map((warning) => (
                    <li key={warning} className="rounded-xl border border-border bg-surface-secondary/50 px-3 py-2">
                        {warning}
                    </li>
                ))}
            </ul>

            {rejectedFiles.length > 0 && (
                <div className={`mt-4 rounded-2xl px-4 py-4 ${semanticToneClasses.danger}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-current">Upload Policy</p>
                            <p className="mt-2 text-sm font-bold text-current">
                                {rejectedFiles.length} file{rejectedFiles.length === 1 ? '' : 's'} blocked before upload
                            </p>
                            <p className="mt-1 text-sm text-current">
                                Remove these files from the selected folder, then choose the root folder again.
                            </p>
                        </div>
                        <span className={`${statusBadgeBaseClass} bg-surface text-current dark:bg-surface-secondary/85`}>
                            Upload blocked
                        </span>
                    </div>

                    <ul className="mt-4 space-y-2">
                        {rejectedFiles.slice(0, 8).map((file) => (
                            <li key={file.relativePath} className={`rounded-xl px-3 py-3 ${tintedInsetSurfaceClass}`}>
                                <p className="truncate text-sm font-bold text-text-primary">{file.relativePath}</p>
                                <p className="mt-1 text-xs text-current">{file.reason}</p>
                            </li>
                        ))}
                    </ul>

                    {rejectedFiles.length > 8 && (
                        <p className="mt-3 text-xs font-semibold text-current">
                            Showing 8 of {rejectedFiles.length} blocked files.
                        </p>
                    )}
                </div>
            )}
        </div>
    </div>
);

const UploadProgressSection = ({
    progress,
    onCancel,
    isCancelling,
}: {
    progress: ProgressState;
    onCancel: () => void;
    isCancelling: boolean;
}) => {
    const percentage = progress.total > 0 ? Math.min(100, Math.round((progress.done / progress.total) * 100)) : 0;

    return (
        <div className="rounded-2xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
                <SectionTitle>Upload Progress</SectionTitle>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-black tracking-tight text-text-primary">{progress.status}</h3>
                    <span className="text-sm font-bold text-text-secondary">{percentage}%</span>
                </div>
            </div>

            <div className="space-y-4 px-5 py-5">
                <div className="h-3 overflow-hidden rounded-full bg-surface-secondary">
                    <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${percentage}%` }} />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                    <span><span className="font-bold text-emerald-600">{progress.done.toLocaleString()}</span> uploaded</span>
                    <span><span className="font-bold text-red-500">{progress.failed.toLocaleString()}</span> failed</span>
                    <span>{progress.total.toLocaleString()} total</span>
                </div>

                {progress.currentItem && (
                    <div className="rounded-xl bg-surface-secondary px-3 py-2 text-xs font-medium text-text-secondary">
                        {progress.currentItem}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isCancelling}
                        className="rounded-xl border border-border-strong bg-surface px-4 py-2 text-xs font-bold text-text-secondary transition-all hover:bg-hover"
                    >
                        {isCancelling ? 'Stopping Upload...' : 'Cancel Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ResumeNotice = ({ batch }: { batch: LegacyBatch }) => (
    <div className={`rounded-2xl px-5 py-4 ${semanticToneClasses.warn}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
                <SectionTitle>Interrupted Batch</SectionTitle>
                <h3 className="mt-2 text-lg font-black tracking-tight text-text-primary">{batch.batchName}</h3>
                <p className="mt-1 text-sm text-text-secondary">
                    {batch.uploadSummary.uploaded} of {batch.uploadSummary.expected} files are already stored.
                    Select the same root folder again to continue the remaining upload.
                </p>
            </div>
            <span className={`${statusBadgeBaseClass} bg-surface text-current dark:bg-surface-secondary/85`}>
                Interrupted
            </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className={`rounded-xl px-4 py-3 ${tintedInsetSurfaceClass}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Root Folder</p>
                <p className="mt-1 text-sm font-bold text-text-primary">{batch.rootFolder}</p>
            </div>
            <div className={`rounded-xl px-4 py-3 ${tintedInsetSurfaceClass}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Remaining Files</p>
                <p className="mt-1 text-sm font-bold text-text-primary">{batch.uploadSummary.remaining}</p>
            </div>
            <div className={`rounded-xl px-4 py-3 ${tintedInsetSurfaceClass}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Last Activity</p>
                <p className="mt-1 text-sm font-bold text-text-primary">{formatDateLabel(batch.lastActivityAt)}</p>
            </div>
        </div>
    </div>
);

const SuccessState = ({
    batch,
    onViewFolder,
    onOpenBatches,
    onUploadAnother,
}: {
    batch: LegacyBatch;
    onViewFolder: () => void;
    onOpenBatches: () => void;
    onUploadAnother: () => void;
}) => (
    <div className={`rounded-2xl p-6 ${semanticToneClasses.good}`}>
        <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/55">
                <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <div>
                <p className="text-base font-bold text-current">Ingestion complete</p>
                <p className="text-sm text-current/85">The legacy batch is ready for retrieval and reference browsing.</p>
            </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[
                { label: 'Batch Name', value: batch.batchName },
                { label: 'Root Folder', value: batch.rootFolder },
                { label: 'Files Uploaded', value: batch.uploadSummary.uploaded.toLocaleString() },
                { label: 'Folders Uploaded', value: batch.tree ? inspectTree(batch.tree).folders.toLocaleString() : '0' },
                { label: 'Total Size', value: batch.totalSize },
                { label: 'Completed At', value: formatDateLabel(batch.completedAt) },
            ].map((item) => (
                <div key={item.label} className={`rounded-xl px-4 py-3 ${tintedInsetSurfaceClass}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{item.label}</p>
                    <p className="mt-1 text-sm font-bold text-text-primary">{item.value}</p>
                </div>
            ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
                type="button"
                onClick={onViewFolder}
                className={`rounded-xl px-4 py-2.5 text-sm ${raisedSurfaceClass}`}
            >
                Browse Legacy Batch
            </button>
            <button
                type="button"
                onClick={onOpenBatches}
                className={`rounded-xl px-4 py-2.5 text-sm ${raisedSurfaceClass}`}
            >
                Open Batch List
            </button>
            <button
                type="button"
                onClick={onUploadAnother}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700"
            >
                Start New Batch
            </button>
        </div>
    </div>
);

const ErrorState = ({
    batch,
    message,
    onRetry,
    onStartNew,
}: {
    batch: LegacyBatch | null;
    message: string;
    onRetry: () => void;
    onStartNew: () => void;
}) => {
    const isInterrupted = batch?.status === 'interrupted';

    return (
        <div className={`rounded-2xl border p-6 ${isInterrupted ? semanticToneClasses.warn : semanticToneClasses.danger}`}>
            <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                    isInterrupted
                        ? 'border-amber-200 bg-amber-100 dark:border-amber-800 dark:bg-amber-950/55'
                        : 'border-red-200 bg-red-100 dark:border-red-800 dark:bg-red-950/55'
                }`}>
                    <svg className={`h-4.5 w-4.5 ${isInterrupted ? 'text-amber-600 dark:text-amber-200' : 'text-red-600 dark:text-red-200'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div>
                    <p className="text-base font-bold text-current">
                        {isInterrupted ? 'Upload interrupted' : 'Upload failed'}
                    </p>
                    <p className="text-sm text-current/85">{message}</p>
                </div>
            </div>

            {batch && (
                <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
                    <span><span className="font-bold text-emerald-600">{batch.uploadSummary.uploaded}</span> uploaded</span>
                    <span><span className="font-bold text-red-600">{batch.uploadSummary.remaining}</span> remaining</span>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
                {batch?.canResume && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition-all hover:bg-amber-100 dark:hover:bg-amber-950/40 ${semanticToneClasses.warn}`}
                    >
                        Resume Upload
                    </button>
                )}
                <button
                    type="button"
                    onClick={onStartNew}
                    className="rounded-xl border border-border-strong bg-surface px-4 py-2 text-xs font-bold text-text-secondary transition-all hover:bg-hover"
                >
                    Start New Batch
                </button>
            </div>
        </div>
    );
};

export const LegacyFolderUploadView = ({
    onOpenBatches,
    resumeBatchId,
    onResumeCleared,
}: {
    onOpenBatches?: () => void;
    resumeBatchId?: string | null;
    onResumeCleared?: () => void;
}) => {
    const [phase, setPhase] = useState<UploadPhase>('empty');
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [rejectedFiles, setRejectedFiles] = useState<RejectedLegacyFile[]>([]);
    const [folderSummary, setFolderSummary] = useState<FolderSummary | null>(null);
    const [meta, setMeta] = useState<BatchMeta>(DEFAULT_META);
    const [progress, setProgress] = useState<ProgressState>({
        total: 0,
        done: 0,
        failed: 0,
        currentItem: '',
        status: 'Waiting for upload',
    });
    const [activeBatch, setActiveBatch] = useState<LegacyBatch | null>(null);
    const [viewingBatch, setViewingBatch] = useState<LegacyBatch | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [isCancellingUpload, setIsCancellingUpload] = useState(false);

    const folderInputRef = useRef<HTMLInputElement | null>(null);
    const cancelRequestedRef = useRef(false);
    const currentUploadControllerRef = useRef<AbortController | null>(null);
    const { createBatch, appendManifest, signUploads, completeUploads, finalizeBatch } = useLegacyBatchMutations();
    const { data: resumeBatch } = useLegacyBatch(resumeBatchId, Boolean(resumeBatchId));

    useEffect(() => {
        return () => {
            cancelRequestedRef.current = true;
            currentUploadControllerRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (!resumeBatchId || !resumeBatch || activeBatch?.id === resumeBatch.id) {
            return;
        }

        setActiveBatch(resumeBatch);
        setMeta({
            batchName: resumeBatch.batchName,
            year: resumeBatch.metadata.year,
            department: resumeBatch.metadata.department,
            notes: resumeBatch.metadata.notes,
        });
        setPhase('empty');
        setErrorMessage('');
    }, [activeBatch?.id, resumeBatch, resumeBatchId]);

    const localTree = useMemo(() => {
        if (!folderSummary || selectedFiles.length === 0) {
            return null;
        }

        return buildTreeFromFiles(selectedFiles, folderSummary.rootName);
    }, [folderSummary, selectedFiles]);

    const previewBatch = useMemo<LegacyBatch | null>(() => {
        if (!folderSummary || !localTree) {
            return activeBatch;
        }

        const metadata: LegacyBatchMetadata = {
            year: meta.year,
            department: meta.department,
            notes: meta.notes,
            preserveNames: true,
            legacyReferenceOnly: true,
        };

        const summary: LegacyBatchSummary = activeBatch ?? {
            id: 'local-preview',
            batchName: meta.batchName || folderSummary.rootName,
            rootFolder: folderSummary.rootName,
            uploadedBy: 'Current User',
            uploadDate: new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }).format(folderSummary.selectedAt),
            status: 'draft',
            statusLabel: 'Draft',
            fileCount: folderSummary.fileCount,
            uploadedFileCount: 0,
            failedFileCount: 0,
            pendingFileCount: folderSummary.fileCount,
            totalSize: formatBytes(folderSummary.totalBytes),
            totalSizeBytes: folderSummary.totalBytes,
            metadata,
            uploadSummary: {
                expected: folderSummary.fileCount,
                uploaded: 0,
                failed: 0,
                remaining: folderSummary.fileCount,
            },
            canResume: true,
        };

        return {
            ...summary,
            batchName: meta.batchName || summary.batchName,
            metadata,
            tree: localTree,
            remainingRelativePaths: Array.from(
                new Set(selectedFiles.map((file) => normalizeRelativePath(file.webkitRelativePath || `${folderSummary.rootName}/${file.name}`))),
            ),
            startedAt: activeBatch?.startedAt ?? null,
            completedAt: activeBatch?.completedAt ?? null,
            lastActivityAt: activeBatch?.lastActivityAt ?? null,
        };
    }, [activeBatch, folderSummary, localTree, meta, selectedFiles]);

    const preflight = useMemo(() => {
        if (!folderSummary) {
            return null;
        }

        return buildPreflightReport(folderSummary, Boolean(activeBatch?.canResume));
    }, [activeBatch?.canResume, folderSummary]);

    const missingMetadataFields = getMissingMetadataFields(meta);
    const resumeRootMismatch = Boolean(activeBatch && folderSummary && activeBatch.rootFolder !== folderSummary.rootName);
    const hasRejectedFiles = rejectedFiles.length > 0;
    const hasUploadableFiles = selectedFiles.length > 0;
    const isMetadataComplete = missingMetadataFields.length === 0 && !resumeRootMismatch;
    const isUploadReady = isMetadataComplete && hasUploadableFiles && !hasRejectedFiles;
    const isLargeBatch = (folderSummary?.fileCount ?? 0) >= LEGACY_LARGE_BATCH_WARNING_FILE_COUNT;

    const selectFiles = (files: File[]) => {
        if (files.length === 0) {
            return;
        }

        const summary = buildSummaryFromFiles(files);
        const validationResult = validateLegacyFiles(files);

        setSelectedFiles(validationResult.validFiles);
        setRejectedFiles(validationResult.rejectedFiles);
        setFolderSummary(summary);
        setPhase('selected');
        setErrorMessage('');
    };

    const handleFolderInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        selectFiles(Array.from(event.target.files ?? []));
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragging(false);
        selectFiles(Array.from(event.dataTransfer.files ?? []));
    };

    const handleReset = () => {
        setSelectedFiles([]);
        setRejectedFiles([]);
        setFolderSummary(null);
        setMeta(DEFAULT_META);
        setProgress({
            total: 0,
            done: 0,
            failed: 0,
            currentItem: '',
            status: 'Waiting for upload',
        });
        cancelRequestedRef.current = false;
        currentUploadControllerRef.current?.abort();
        currentUploadControllerRef.current = null;
        setIsCancellingUpload(false);
        setActiveBatch(null);
        setViewingBatch(null);
        setErrorMessage('');
        setPhase('empty');
        onResumeCleared?.();

        if (folderInputRef.current) {
            folderInputRef.current.value = '';
        }
    };

    const performUpload = async () => {
        if (!folderSummary || selectedFiles.length === 0) {
            return;
        }

        cancelRequestedRef.current = false;
        setIsCancellingUpload(false);
        const filesByPath = new Map(
            selectedFiles.map((file) => [
                normalizeRelativePath(file.webkitRelativePath || `${folderSummary.rootName}/${file.name}`),
                file,
            ]),
        );
        const manifestFiles = Array.from(filesByPath.entries()).map(([relativePath, file]) => ({
            relativePath,
            sizeBytes: file.size,
            mimeType: file.type || undefined,
            modifiedAt: new Date(file.lastModified).toISOString(),
        }));
        const manifestChunks = chunk(manifestFiles, LEGACY_MANIFEST_CHUNK_SIZE);
        const isResumeUpload = Boolean(activeBatch);

        setPhase('uploading');
        setErrorMessage('');

        try {
            let batch = activeBatch;

            if (!batch) {
                const [initialManifestChunk, ...remainingManifestChunks] = manifestChunks;

                batch = await createBatch.mutateAsync({
                    batchName: meta.batchName,
                    rootFolder: folderSummary.rootName,
                    year: meta.year,
                    department: meta.department,
                    notes: meta.notes,
                    expectedFileCount: folderSummary.fileCount,
                    totalSizeBytes: folderSummary.totalBytes,
                    files: initialManifestChunk,
                });
                setActiveBatch(batch);

                if (remainingManifestChunks.length > 0) {
                    for (const [chunkIndex, manifestChunk] of remainingManifestChunks.entries()) {
                        setProgress((current) => ({
                            ...current,
                            total: folderSummary.fileCount,
                            status: `Registering manifest ${chunkIndex + 2} of ${manifestChunks.length}`,
                            currentItem: `Recording ${manifestChunk.length} files before upload begins...`,
                        }));

                        await appendManifest.mutateAsync({
                            batchId: batch.id,
                            files: manifestChunk,
                        });
                    }
                }
            }

            const uploadTargets = isResumeUpload && batch.remainingRelativePaths.length > 0
                ? batch.remainingRelativePaths
                : Array.from(filesByPath.keys());

            const matchedTargets = uploadTargets.filter((relativePath) => filesByPath.has(relativePath));

            if (matchedTargets.length === 0) {
                throw new Error('The selected folder does not contain the remaining files for this batch. Please choose the same root folder used when the batch was created.');
            }

            let done = batch.uploadSummary.uploaded;
            let failed = 0;

            setProgress({
                total: batch.uploadSummary.expected,
                done,
                failed,
                currentItem: 'Preparing signed upload links...',
                status: isResumeUpload ? 'Resuming batch upload' : 'Uploading batch',
            });

            for (const group of chunk(matchedTargets, LEGACY_SIGNED_UPLOAD_CHUNK_SIZE)) {
                if (cancelRequestedRef.current) {
                    break;
                }

                const signed = await signUploads.mutateAsync({
                    batchId: batch.id,
                    relativePaths: group,
                });

                const successfulPaths: string[] = [];

                for (const upload of signed.uploads) {
                    if (cancelRequestedRef.current) {
                        break;
                    }

                    const file = filesByPath.get(upload.relativePath);

                    if (!file) {
                        failed += 1;
                        setProgress((current) => ({
                            ...current,
                            failed,
                            currentItem: `Skipping ${upload.relativePath} because it is missing from the selected folder.`,
                        }));
                        continue;
                    }

                    setProgress((current) => ({
                        ...current,
                        currentItem: `Uploading ${upload.relativePath}...`,
                    }));

                    try {
                        const uploadController = new AbortController();
                        currentUploadControllerRef.current = uploadController;
                        const response = await fetch(upload.uploadUrl, {
                            method: upload.method,
                            headers: upload.headers,
                            body: file,
                            signal: uploadController.signal,
                        });
                        currentUploadControllerRef.current = null;

                        if (!response.ok) {
                            throw new Error(`Upload failed with status ${response.status}.`);
                        }

                        successfulPaths.push(upload.relativePath);
                        done += 1;
                        setProgress((current) => ({
                            ...current,
                            done,
                            currentItem: `Uploaded ${upload.relativePath}`,
                        }));
                    } catch (error) {
                        currentUploadControllerRef.current = null;

                        if (cancelRequestedRef.current || (error instanceof DOMException && error.name === 'AbortError')) {
                            setProgress((current) => ({
                                ...current,
                                status: 'Stopping upload',
                                currentItem: 'Preserving uploaded files before exit...',
                            }));
                            break;
                        }

                        failed += 1;
                        setProgress((current) => ({
                            ...current,
                            failed,
                            currentItem: `Failed to upload ${upload.relativePath}`,
                        }));
                    }
                }

                if (successfulPaths.length > 0) {
                    await completeUploads.mutateAsync({
                        batchId: batch.id,
                        relativePaths: successfulPaths,
                    });
                }
            }

            const finalizedBatch = await finalizeBatch.mutateAsync(batch.id);
            const wasCancelled = cancelRequestedRef.current;
            setActiveBatch(finalizedBatch);
            setIsCancellingUpload(false);
            cancelRequestedRef.current = false;

            if (finalizedBatch.status === 'completed') {
                setPhase('complete');
                setProgress((current) => ({ ...current, status: 'Completed', currentItem: '' }));
                onResumeCleared?.();
                return;
            }

            setPhase(finalizedBatch.status === 'interrupted' ? 'interrupted' : 'failed');
            setErrorMessage(
                finalizedBatch.status === 'interrupted'
                    ? wasCancelled
                        ? 'Upload stopped. The batch state has been preserved and you can resume from the remaining files.'
                        : 'Some files still need to be uploaded. The batch state has been preserved and you can resume from the remaining files.'
                    : 'The batch could not be finalized. Review the selected folder and try again.',
            );
        } catch (error) {
            setIsCancellingUpload(false);
            currentUploadControllerRef.current = null;
            cancelRequestedRef.current = false;
            setPhase('failed');
            setErrorMessage(getLegacyUploadErrorMessage(error));
        }
    };

    const handleCancelUpload = () => {
        cancelRequestedRef.current = true;
        setIsCancellingUpload(true);
        setProgress((current) => ({
            ...current,
            status: 'Stopping upload',
            currentItem: 'Waiting for the current request to stop safely...',
        }));
        currentUploadControllerRef.current?.abort();
    };

    const showBrowser = () => {
        if (activeBatch?.tree) {
            setViewingBatch(activeBatch);
            return;
        }

        if (previewBatch) {
            setViewingBatch(previewBatch);
        }
    };

    return (
        <>
            <div className="space-y-6">
                <WorkflowSteps phase={phase} />

                {resumeBatch && phase === 'empty' && <ResumeNotice batch={resumeBatch} />}

                {(phase === 'empty' || phase === 'selected' || phase === 'uploading') && (
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
                        <div className="space-y-4">
                            {phase === 'empty' && (
                                <FolderDropzone
                                    isDragging={isDragging}
                                    onDragOver={(event) => {
                                        event.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    onSelectFolder={() => folderInputRef.current?.click()}
                                    isResumeMode={Boolean(resumeBatch)}
                                />
                            )}

                            {phase === 'selected' && folderSummary && preflight && (
                                <>
                                    <SelectedFolderPanel
                                        summary={folderSummary}
                                        onRemove={handleReset}
                                        onReplace={() => folderInputRef.current?.click()}
                                        onViewFull={showBrowser}
                                    />
                                    <PreflightPanel report={preflight} summary={folderSummary} rejectedFiles={rejectedFiles} />
                                </>
                            )}

                            {phase === 'uploading' && (
                                <UploadProgressSection
                                    progress={progress}
                                    onCancel={handleCancelUpload}
                                    isCancelling={isCancellingUpload}
                                />
                            )}

                            {phase === 'selected' && folderSummary && (
                                <div className="space-y-3">
                                    {resumeRootMismatch && (
                                        <div className={`rounded-xl px-4 py-3 text-sm ${semanticToneClasses.danger}`}>
                                            This folder root does not match the interrupted batch. Expected <span className="font-bold">{activeBatch?.rootFolder}</span>.
                                        </div>
                                    )}

                                    {hasRejectedFiles && (
                                        <div className={`rounded-xl px-4 py-3 text-sm ${semanticToneClasses.danger}`}>
                                            Remove the blocked files first. Legacy batches accept only {LEGACY_ALLOWED_FILE_LABEL} up to 50 MB per file.
                                        </div>
                                    )}

                                    {isLargeBatch && (
                                        <div className={`rounded-xl px-4 py-3 text-sm ${semanticToneClasses.warn}`}>
                                            Large legacy batch detected. This folder contains {folderSummary?.fileCount} files, so the system will register the
                                            manifest in smaller chunks before upload starts to reduce browser and network risk.
                                        </div>
                                    )}

                                    {!hasRejectedFiles && !hasUploadableFiles && (
                                        <div className={`rounded-xl px-4 py-3 text-sm ${semanticToneClasses.danger}`}>
                                            No uploadable files were detected in this folder selection.
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={performUpload}
                                        disabled={!isUploadReady}
                                        className={`w-full rounded-2xl px-6 py-4 text-sm font-bold shadow-sm transition-all ${
                                            isUploadReady
                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                : 'cursor-not-allowed bg-surface-secondary text-text-muted'
                                        }`}
                                    >
                                        {activeBatch?.canResume ? 'Resume Legacy Ingestion' : 'Start Legacy Ingestion'}
                                    </button>
                                </div>
                            )}

                            <input
                                ref={folderInputRef}
                                type="file"
                                // @ts-expect-error webkitdirectory is supported by the browser even if it is not part of the standard typings yet
                                webkitdirectory=""
                                multiple
                                accept={LEGACY_ALLOWED_FILE_ACCEPT}
                                className="sr-only"
                                onChange={handleFolderInput}
                            />
                        </div>

                        {phase !== 'uploading' && <MetadataPanel meta={meta} onChange={setMeta} />}
                    </div>
                )}

                {phase === 'complete' && activeBatch && (
                    <SuccessState
                        batch={activeBatch}
                        onViewFolder={showBrowser}
                        onOpenBatches={() => {
                            onResumeCleared?.();
                            onOpenBatches?.();
                        }}
                        onUploadAnother={handleReset}
                    />
                )}

                {(phase === 'interrupted' || phase === 'failed') && (
                    <ErrorState
                        batch={activeBatch}
                        message={errorMessage}
                        onRetry={performUpload}
                        onStartNew={handleReset}
                    />
                )}
            </div>

            {viewingBatch && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setViewingBatch(null)} />
                    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-5xl flex-col border-l border-border bg-surface shadow-2xl">
                        <LegacyFolderBrowserPanel batch={viewingBatch} onClose={() => setViewingBatch(null)} />
                    </div>
                </>
            )}

        </>
    );
};
