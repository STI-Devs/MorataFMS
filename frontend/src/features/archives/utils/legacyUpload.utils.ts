import type { FileNode } from '../types/legacyBatch.types';

export type UploadPhase = 'empty' | 'selected' | 'uploading' | 'complete' | 'interrupted' | 'failed';

export interface FolderSummary {
    rootName: string;
    topLevelFolderCount: number;
    subfolderCount: number;
    fileCount: number;
    totalBytes: number;
    maxDepth: number;
    selectedAt: Date;
    previewTree: string[];
}

export interface BatchMeta {
    batchName: string;
    yearFrom: string;
    yearTo: string;
    useYearRange: boolean;
    department: string;
    notes: string;
}

export interface ProgressState {
    total: number;
    done: number;
    failed: number;
    currentItem: string;
    status: string;
}

export interface PreflightCheck {
    label: string;
    value: string;
    tone: 'good' | 'warn' | 'neutral';
}

export interface PreflightReport {
    patternLabel: string;
    reviewStatus: string;
    checks: PreflightCheck[];
    warnings: string[];
}

export interface RejectedLegacyFile {
    relativePath: string;
    reason: string;
}

export const DEFAULT_META: BatchMeta = {
    batchName: '',
    yearFrom: '',
    yearTo: '',
    useYearRange: false,
    department: '',
    notes: '',
};

export const LEGACY_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
export const LEGACY_ALLOWED_EXTENSIONS = [
    'pdf',
    'doc',
    'docx',
    'docm',
    'dotm',
    'xls',
    'xlsx',
    'xlsm',
    'xlsb',
    'xltm',
    'xlam',
    'pptm',
    'potm',
    'ppsm',
    'ppam',
    'csv',
    'txt',
    'msg',
    'eml',
    'jpg',
    'jpeg',
    'png',
] as const;
export const LEGACY_ALLOWED_FILE_ACCEPT = LEGACY_ALLOWED_EXTENSIONS.map((extension) => `.${extension}`).join(',');
export const LEGACY_ALLOWED_FILE_LABEL = 'PDF, Word, Excel, PowerPoint, email archive files, CSV, TXT, JPG, JPEG, and PNG';
export const LEGACY_IGNORED_FILENAMES = new Set([
    'desktop.ini',
    'thumbs.db',
    'ehthumbs.db',
    '.ds_store',
]);
export const LEGACY_MANIFEST_CHUNK_SIZE = 250;
export const LEGACY_SIGNED_UPLOAD_CHUNK_SIZE = 10;
export const LEGACY_LARGE_BATCH_WARNING_FILE_COUNT = 1000;
export const LEGACY_MIN_YEAR = 2000;
export const LEGACY_YEAR_OPTIONS = Array.from(
    { length: new Date().getFullYear() - LEGACY_MIN_YEAR + 1 },
    (_, index) => String(new Date().getFullYear() - index),
);

export const buildCoverageYearLabel = (yearFrom: string, yearTo: string): string => {
    if (!yearFrom || !yearTo) {
        return '';
    }

    return yearFrom === yearTo ? yearFrom : `${yearFrom} - ${yearTo}`;
};

export const formatBytes = (bytes: number): string => {
    if (bytes === 0) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / 1024 ** unitIndex;

    return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
};

export const normalizeRelativePath = (path: string): string =>
    path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/|\/$/g, '');

export const getFileExtension = (path: string): string => {
    const normalizedPath = normalizeRelativePath(path);
    const segments = normalizedPath.split('/');
    const filename = segments[segments.length - 1] ?? '';
    const parts = filename.split('.');

    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

export const shouldIgnoreLegacyFile = (path: string): boolean => {
    const normalizedPath = normalizeRelativePath(path);
    const segments = normalizedPath.split('/');
    const filename = (segments[segments.length - 1] ?? '').toLowerCase();

    return LEGACY_IGNORED_FILENAMES.has(filename) || filename.startsWith('~$');
};

export const validateLegacyFiles = (
    files: File[],
): { validFiles: File[]; rejectedFiles: RejectedLegacyFile[] } => {
    const validFiles: File[] = [];
    const rejectedFiles: RejectedLegacyFile[] = [];

    files.forEach((file) => {
        const relativePath = normalizeRelativePath(file.webkitRelativePath || file.name);

        if (shouldIgnoreLegacyFile(relativePath)) {
            return;
        }

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

export const getLegacyUploadErrorMessage = (error: unknown): string => {
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

export const formatDateLabel = (isoDate?: string | null): string => {
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

export const getMissingMetadataFields = (meta: BatchMeta): string[] => {
    const missing: string[] = [];

    if (!meta.batchName.trim()) {
        missing.push('Batch name');
    }

    if (!meta.yearFrom.trim()) {
        missing.push(meta.useYearRange ? 'From year' : 'Year');
    }

    if (meta.useYearRange && !meta.yearTo.trim()) {
        missing.push('To year');
    }

    if (!meta.department.trim()) {
        missing.push('Department');
    }

    return missing;
};

export const inspectTree = (
    node: FileNode,
    depth = 1,
): { folders: number; files: number; maxDepth: number } => {
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

export const getRootFolderName = (files: File[]): string =>
    normalizeRelativePath(files[0]?.webkitRelativePath || files[0]?.name || 'Selected Folder').split('/')[0]
        || 'Selected Folder';

export const buildEmptySummary = (rootName: string): FolderSummary => ({
    rootName,
    topLevelFolderCount: 0,
    subfolderCount: 0,
    fileCount: 0,
    totalBytes: 0,
    maxDepth: 1,
    selectedAt: new Date(),
    previewTree: [],
});

export const buildSummaryFromFiles = (files: File[]): FolderSummary => {
    if (files.length === 0) {
        return buildEmptySummary('Selected Folder');
    }

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

    const rootName = getRootFolderName(files);

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

export const buildTreeFromFiles = (files: File[], rootName: string): FileNode => {
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

export const buildPreflightReport = (
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

export const chunk = <T,>(items: T[], size: number): T[][] => {
    const result: T[][] = [];

    for (let index = 0; index < items.length; index += size) {
        result.push(items.slice(index, index + size));
    }

    return result;
};
