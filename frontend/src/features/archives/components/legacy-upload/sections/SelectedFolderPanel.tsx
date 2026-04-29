import type { FolderSummary } from '../../../utils/legacyUpload.utils';
import { SectionTitle } from './legacyUploadPrimitives';
import {
    raisedSurfaceClass,
    semanticToneClasses,
    statusBadgeBaseClass,
    tintedInsetSurfaceClass,
} from './legacyUploadStyles';

interface Props {
    summary: FolderSummary;
    onRemove: () => void;
    onReplace: () => void;
    onViewFull: () => void;
}

export const SelectedFolderPanel = ({ summary, onRemove, onReplace, onViewFull }: Props) => (
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
