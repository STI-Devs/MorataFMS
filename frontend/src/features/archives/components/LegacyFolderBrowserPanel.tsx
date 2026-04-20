import React, { useState } from 'react';
import type { FileNode, LegacyBatch } from './legacyFolderMockData';

export type { FileNode, LegacyBatch } from './legacyFolderMockData';
export { MOCK_BATCHES } from './legacyFolderMockData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const countItems = (node: FileNode): { folders: number; files: number } => {
    if (node.type === 'file') return { folders: 0, files: 1 };
    let folders = 0;
    let files = 0;
    (node.children ?? []).forEach(child => {
        if (child.type === 'folder') {
            folders++;
            const sub = countItems(child);
            folders += sub.folders;
            files += sub.files;
        } else {
            files++;
        }
    });
    return { folders, files };
};

// ─── Tree Node ────────────────────────────────────────────────────────────────

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
        className={`w-3 h-3 text-text-muted transition-transform shrink-0 ${open ? 'rotate-90' : ''}`}
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

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

    if (node.type === 'file') return null; // Only show folders in tree

    return (
        <div>
            <button
                type="button"
                onClick={() => {
                    setOpen(o => !o);
                    onSelectFolder(path, node);
                }}
                className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-left transition-colors ${isSelected
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-text-secondary hover:bg-hover hover:text-text-primary'
                    }`}
                style={{ paddingLeft: `${8 + depth * 14}px` }}
            >
                {hasChildren
                    ? <ChevronIcon open={open} />
                    : <span className="w-3 shrink-0" />}
                <FolderIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-500' : 'text-amber-500'}`} />
                <span className="text-xs font-medium truncate">{node.name}</span>
                <span className="ml-auto text-[10px] text-text-muted shrink-0">
                    {(node.children ?? []).filter(c => c.type === 'folder').length > 0
                        ? `${(node.children ?? []).filter(c => c.type === 'folder').length}f`
                        : ''}
                </span>
            </button>

            {open && hasChildren && (
                <div>
                    {(node.children ?? [])
                        .filter(c => c.type === 'folder')
                        .map(child => (
                            <TreeNode
                                key={child.name}
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

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

const Breadcrumb = ({ path, onNavigate }: { path: string; onNavigate: (p: string) => void }) => {
    const parts = path.split('/');
    return (
        <div className="flex items-center gap-1 flex-wrap text-xs">
            {parts.map((part, i) => {
                const partPath = parts.slice(0, i + 1).join('/');
                const isLast = i === parts.length - 1;
                return (
                    <React.Fragment key={partPath}>
                        {i > 0 && <span className="text-text-muted">/</span>}
                        <button
                            type="button"
                            onClick={() => !isLast && onNavigate(partPath)}
                            className={`font-medium ${isLast
                                ? 'text-text-primary cursor-default'
                                : 'text-blue-600 hover:underline cursor-pointer'
                                }`}
                        >
                            {part}
                        </button>
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// ─── File/Folder Row ──────────────────────────────────────────────────────────

const ContentRow = ({ node, onClick }: { node: FileNode; onClick?: () => void }) => (
    <div
        className={`flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0 transition-colors ${node.type === 'folder' ? 'cursor-pointer hover:bg-blue-50/50' : 'cursor-default hover:bg-hover'}`}
        onClick={onClick}
    >
        {node.type === 'folder' ? (
            <FolderIcon className="w-4 h-4 text-amber-500 shrink-0" />
        ) : (
            <FileIcon className="w-4 h-4 text-blue-400 shrink-0" />
        )}
        <span className={`text-xs font-medium flex-1 truncate ${node.type === 'folder' ? 'text-text-primary' : 'text-text-secondary'}`}>
            {node.name}
        </span>
        <span className="text-[11px] text-text-muted w-20 text-right shrink-0">{node.size ?? ''}</span>
        <span className="text-[11px] text-text-muted w-28 text-right shrink-0">{node.modified ?? ''}</span>
        {node.type === 'file' && (
            <button
                type="button"
                onClick={e => e.stopPropagation()}
                className="text-[10px] font-bold text-blue-600 hover:underline shrink-0 w-14 text-right"
            >
                Download
            </button>
        )}
        {node.type === 'folder' && <span className="w-14" />}
    </div>
);

// ─── Main Panel ───────────────────────────────────────────────────────────────

interface LegacyFolderBrowserPanelProps {
    batch: LegacyBatch;
    onClose: () => void;
}

const findNodeByPath = (root: FileNode, path: string): FileNode | null => {
    const parts = path.split('/').filter(Boolean);
    let current: FileNode = root;
    for (const part of parts) {
        if (part === root.name) { current = root; continue; }
        const child = (current.children ?? []).find(c => c.name === part);
        if (!child) return null;
        current = child;
    }
    return current;
};

export const LegacyFolderBrowserPanel = ({ batch, onClose }: LegacyFolderBrowserPanelProps) => {
    const [selectedPath, setSelectedPath] = useState(batch.tree.name);
    const [search, setSearch] = useState('');

    const currentNode = findNodeByPath(batch.tree, selectedPath) ?? batch.tree;
    const { folders: totalFolders, files: totalFiles } = countItems(batch.tree);

    const handleSelectFolder = (path: string, node: FileNode) => {
        if (node.type === 'folder') setSelectedPath(path);
    };

    const rawChildren = currentNode.children ?? [];
    const filteredChildren = search
        ? rawChildren.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
        : rawChildren;

    const folders = filteredChildren.filter(c => c.type === 'folder');
    const files = filteredChildren.filter(c => c.type === 'file');

    return (
        <div className="flex flex-col h-full">
            {/* ── Panel Header ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                        <FolderIcon className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-text-primary truncate">{batch.batchName}</p>
                        <p className="text-xs text-text-muted">
                            {totalFolders.toLocaleString()} folders · {totalFiles.toLocaleString()} files · {batch.totalSize} · Uploaded {batch.uploadDate}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
                        Legacy Reference
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-hover transition-colors"
                    >
                        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* ── Two-pane layout ── */}
            <div className="flex flex-1 min-h-0">
                {/* Left: Folder Tree */}
                <div className="w-64 shrink-0 border-r border-border bg-surface-secondary overflow-y-auto">
                    <div className="px-3 py-3 border-b border-border">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Folder Tree</p>
                    </div>
                    <div className="p-2">
                        <TreeNode
                            node={batch.tree}
                            depth={0}
                            selectedPath={selectedPath}
                            onSelectFolder={handleSelectFolder}
                        />
                    </div>
                </div>

                {/* Right: Contents */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Toolbar row */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface shrink-0">
                        <div className="flex-1 min-w-0">
                            <Breadcrumb path={selectedPath} onNavigate={setSelectedPath} />
                        </div>
                        <div className="relative">
                            <svg className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search in folder…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-8 pr-3 py-1.5 text-xs bg-input-bg border border-border-strong rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none w-48"
                            />
                        </div>
                    </div>

                    {/* Column headers */}
                    <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-surface-secondary shrink-0">
                        <span className="w-4 shrink-0" />
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest flex-1">Name</span>
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest w-20 text-right shrink-0">Size</span>
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest w-28 text-right shrink-0">Modified</span>
                        <span className="w-14" />
                    </div>

                    {/* Contents */}
                    <div className="flex-1 overflow-y-auto bg-surface">
                        {filteredChildren.length === 0 ? (
                            <div className="py-12 text-center">
                                <p className="text-sm font-semibold text-text-secondary">
                                    {search ? 'No items match your search.' : 'This folder is empty.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                {folders.map(child => (
                                    <ContentRow
                                        key={child.name}
                                        node={child}
                                        onClick={() => {
                                            const newPath = `${selectedPath}/${child.name}`;
                                            setSelectedPath(newPath);
                                        }}
                                    />
                                ))}
                                {files.map(child => (
                                    <ContentRow key={child.name} node={child} />
                                ))}
                            </>
                        )}
                    </div>

                    {/* Status bar */}
                    <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-surface-secondary shrink-0 text-[11px] text-text-muted">
                        <span>{folders.length} folder{folders.length !== 1 ? 's' : ''}</span>
                        <span>{files.length} file{files.length !== 1 ? 's' : ''}</span>
                        {search && <span className="text-blue-600">Filtered by "{search}"</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};
