import React, { useMemo, useState } from 'react';
import { legacyBatchApi } from '../api/legacyBatchApi';
import type { FileNode, LegacyBatch } from '../types/legacyBatch.types';

export type { FileNode, LegacyBatch } from '../types/legacyBatch.types';

const countItems = (node: FileNode): { folders: number; files: number } => {
    if (node.type === 'file') {
        return { folders: 0, files: 1 };
    }

    let folders = 0;
    let files = 0;

    (node.children ?? []).forEach((child) => {
        if (child.type === 'folder') {
            folders += 1;
        }

        const totals = countItems(child);
        folders += totals.folders;
        files += totals.files;
    });

    return { folders, files };
};

const FolderIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
);

const FileIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
    <svg
        className={`h-3 w-3 shrink-0 text-text-muted transition-transform ${open ? 'rotate-90' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const MetadataBadge = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
        {children}
    </span>
);

const StatusBadge = ({ status }: { status?: FileNode['status'] }) => {
    if (!status || status === 'uploaded') {
        return null;
    }

    const classes = status === 'failed'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-amber-200 bg-amber-50 text-amber-700';

    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${classes}`}>
            {status}
        </span>
    );
};

interface TreeNodeProps {
    node: FileNode;
    depth: number;
    selectedPath: string;
    onSelectFolder: (path: string, node: FileNode) => void;
    parentPath?: string;
}

const TreeNode = ({ node, depth, selectedPath, onSelectFolder, parentPath = '' }: TreeNodeProps) => {
    const path = parentPath ? `${parentPath}/${node.name}` : node.name;
    const [open, setOpen] = useState(depth < 2);
    const isSelected = selectedPath === path;
    const hasChildren = (node.children ?? []).length > 0;

    if (node.type === 'file') {
        return null;
    }

    return (
        <div>
            <button
                type="button"
                onClick={() => {
                    setOpen((value) => !value);
                    onSelectFolder(path, node);
                }}
                className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left transition-colors ${
                    isSelected
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-text-secondary hover:bg-hover hover:text-text-primary'
                }`}
                style={{ paddingLeft: `${8 + depth * 14}px` }}
            >
                {hasChildren ? <ChevronIcon open={open} /> : <span className="w-3 shrink-0" />}
                <FolderIcon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-blue-500' : 'text-amber-500'}`} />
                <span className="truncate text-xs font-medium">{node.name}</span>
            </button>

            {open && hasChildren && (
                <div>
                    {(node.children ?? [])
                        .filter((child) => child.type === 'folder')
                        .map((child) => (
                            <TreeNode
                                key={`${path}/${child.name}`}
                                node={child}
                                depth={depth + 1}
                                selectedPath={selectedPath}
                                onSelectFolder={onSelectFolder}
                                parentPath={path}
                            />
                        ))}
                </div>
            )}
        </div>
    );
};

const Breadcrumb = ({ path, onNavigate }: { path: string; onNavigate: (path: string) => void }) => {
    const parts = path.split('/');

    return (
        <div className="flex flex-wrap items-center gap-1 text-xs">
            {parts.map((part, index) => {
                const partPath = parts.slice(0, index + 1).join('/');
                const isLast = index === parts.length - 1;

                return (
                    <React.Fragment key={partPath}>
                        {index > 0 && <span className="text-text-muted">/</span>}
                        <button
                            type="button"
                            onClick={() => !isLast && onNavigate(partPath)}
                            className={isLast ? 'cursor-default font-medium text-text-primary' : 'cursor-pointer font-medium text-blue-600 hover:underline'}
                        >
                            {part}
                        </button>
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const findNodeByPath = (root: FileNode, path: string): FileNode | null => {
    const parts = path.split('/').filter(Boolean);
    let current: FileNode = root;

    for (const part of parts) {
        if (part === root.name) {
            current = root;
            continue;
        }

        const child = (current.children ?? []).find((node) => node.name === part);

        if (!child) {
            return null;
        }

        current = child;
    }

    return current;
};

const ContentRow = ({
    batchId,
    node,
    onOpenFolder,
}: {
    batchId: string;
    node: FileNode;
    onOpenFolder?: () => void;
}) => {
    const handleDownload = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();

        if (!node.id || node.type !== 'file') {
            return;
        }

        await legacyBatchApi.downloadLegacyBatchFile(batchId, node.id, node.name);
    };

    const canDownload = node.type === 'file' && node.id && node.status !== 'pending' && node.status !== 'failed';

    return (
        <div
            className={`flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0 ${
                node.type === 'folder'
                    ? 'cursor-pointer transition-colors hover:bg-blue-50/50'
                    : 'transition-colors hover:bg-hover'
            }`}
            onClick={node.type === 'folder' ? onOpenFolder : undefined}
        >
            {node.type === 'folder'
                ? <FolderIcon className="h-4 w-4 shrink-0 text-amber-500" />
                : <FileIcon className="h-4 w-4 shrink-0 text-blue-400" />}

            <span className={`flex-1 truncate text-xs font-medium ${node.type === 'folder' ? 'text-text-primary' : 'text-text-secondary'}`}>
                {node.name}
            </span>

            <div className="flex w-20 justify-end">
                <StatusBadge status={node.status} />
            </div>
            <span className="w-20 shrink-0 text-right text-[11px] text-text-muted">{node.size ?? ''}</span>
            <span className="w-28 shrink-0 text-right text-[11px] text-text-muted">{node.modified ?? ''}</span>

            {canDownload ? (
                <button
                    type="button"
                    onClick={handleDownload}
                    className="w-16 shrink-0 text-right text-[10px] font-bold text-blue-600 hover:underline"
                >
                    Download
                </button>
            ) : (
                <span className="w-16 shrink-0" />
            )}
        </div>
    );
};

interface LegacyFolderBrowserPanelProps {
    batch: LegacyBatch;
    onClose: () => void;
}

export const LegacyFolderBrowserPanel = ({ batch, onClose }: LegacyFolderBrowserPanelProps) => {
    const tree = batch.tree;
    const [selectedPath, setSelectedPath] = useState(tree?.name ?? batch.rootFolder);
    const [search, setSearch] = useState('');

    const totals = useMemo(() => tree ? countItems(tree) : { folders: 0, files: 0 }, [tree]);
    const currentNode = tree ? (findNodeByPath(tree, selectedPath) ?? tree) : null;

    const filteredChildren = useMemo(() => {
        if (!currentNode) {
            return [];
        }

        const children = currentNode.children ?? [];

        if (!search.trim()) {
            return children;
        }

        const normalizedSearch = search.toLowerCase();
        return children.filter((child) => child.name.toLowerCase().includes(normalizedSearch));
    }, [currentNode, search]);

    const folders = filteredChildren.filter((child) => child.type === 'folder');
    const files = filteredChildren.filter((child) => child.type === 'file');

    return (
        <div className="flex h-full flex-col">
            <div className="shrink-0 border-b border-border bg-surface px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-100">
                            <FolderIcon className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-text-primary">{batch.batchName}</p>
                            <p className="text-xs text-text-muted">
                                {totals.folders.toLocaleString()} folders · {totals.files.toLocaleString()} files · {batch.totalSize} · Uploaded {batch.uploadDate}
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <button type="button" onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-hover">
                            <svg className="h-4 w-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="shrink-0 border-b border-border bg-surface px-5 py-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)]">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Batch Notes</p>
                        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                            {batch.metadata.notes || 'No notes recorded for this legacy batch.'}
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-border bg-surface-secondary/50 px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Root Folder</p>
                            <p className="mt-1 text-sm font-bold text-text-primary">{batch.rootFolder}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-surface-secondary/50 px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Uploaded By</p>
                            <p className="mt-1 text-sm font-bold text-text-primary">{batch.uploadedBy}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-surface-secondary/50 px-4 py-3 sm:col-span-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Metadata</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <MetadataBadge>{batch.metadata.department}</MetadataBadge>
                                <MetadataBadge>{batch.metadata.year}</MetadataBadge>
                                {batch.metadata.preserveNames && <MetadataBadge>Preserve names</MetadataBadge>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex min-h-0 flex-1">
                <div className="w-64 shrink-0 overflow-y-auto border-r border-border bg-surface-secondary">
                    <div className="border-b border-border px-3 py-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Folder Tree</p>
                    </div>
                    <div className="p-2">
                        {tree ? (
                            <TreeNode
                                node={tree}
                                depth={0}
                                selectedPath={selectedPath}
                                onSelectFolder={(path, node) => {
                                    if (node.type === 'folder') {
                                        setSelectedPath(path);
                                    }
                                }}
                            />
                        ) : (
                            <p className="px-2 py-3 text-xs text-text-muted">No preserved tree is available yet.</p>
                        )}
                    </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-3">
                        <div className="min-w-0 flex-1">
                            <Breadcrumb path={selectedPath} onNavigate={setSelectedPath} />
                        </div>
                        <div className="relative">
                            <svg className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search in folder..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                className="w-48 rounded-lg border border-border-strong bg-input-bg py-1.5 pl-8 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                            />
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface-secondary px-4 py-2">
                        <span className="w-4 shrink-0" />
                        <span className="flex-1 text-[10px] font-black uppercase tracking-widest text-text-muted">Name</span>
                        <span className="w-20 text-right text-[10px] font-black uppercase tracking-widest text-text-muted">Status</span>
                        <span className="w-20 text-right text-[10px] font-black uppercase tracking-widest text-text-muted">Size</span>
                        <span className="w-28 text-right text-[10px] font-black uppercase tracking-widest text-text-muted">Modified</span>
                        <span className="w-16 shrink-0" />
                    </div>

                    <div className="flex-1 overflow-y-auto bg-surface">
                        {!currentNode ? (
                            <div className="py-12 text-center">
                                <p className="text-sm font-semibold text-text-secondary">No folder is selected.</p>
                            </div>
                        ) : filteredChildren.length === 0 ? (
                            <div className="py-12 text-center">
                                <p className="text-sm font-semibold text-text-secondary">
                                    {search ? 'No items match your search.' : 'This folder is empty.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                {folders.map((child) => (
                                    <ContentRow
                                        key={`${selectedPath}/${child.name}`}
                                        batchId={batch.id}
                                        node={child}
                                        onOpenFolder={() => setSelectedPath(`${selectedPath}/${child.name}`)}
                                    />
                                ))}
                                {files.map((child) => (
                                    <ContentRow
                                        key={`${selectedPath}/${child.name}`}
                                        batchId={batch.id}
                                        node={child}
                                    />
                                ))}
                            </>
                        )}
                    </div>

                    <div className="flex shrink-0 items-center gap-4 border-t border-border bg-surface-secondary px-4 py-2 text-[11px] text-text-muted">
                        <span>{folders.length} folder{folders.length !== 1 ? 's' : ''}</span>
                        <span>{files.length} file{files.length !== 1 ? 's' : ''}</span>
                        {search && <span className="text-blue-600">Filtered by "{search}"</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};
