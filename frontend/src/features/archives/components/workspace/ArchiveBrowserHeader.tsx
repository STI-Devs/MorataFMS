import type { ArchiveYear } from '../../../documents/types/document.types';
import type { DrillState, SortKey, ViewMode } from '../../utils/archive.utils';
import { Breadcrumb } from '../ui/Breadcrumb';
import { ViewToggle } from '../ui/ViewToggle';
import type { BreadcrumbPart } from '../../utils/archiveWorkspace.utils';

type Props = {
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    documentViewTitle: string;
    flatDocumentCount: number;
    currentDrill: DrillState;
    archiveData: ArchiveYear[];
    totalDocs: number;
    totalImports: number;
    totalExports: number;
    breadcrumbParts: BreadcrumbPart[];
    sortKey: SortKey;
    sortDir: 'asc' | 'desc';
    onSortKeyChange: (key: SortKey) => void;
    onSortDirChange: (dir: 'asc' | 'desc') => void;
};

export const ArchiveBrowserHeader = ({
    viewMode,
    onViewModeChange,
    documentViewTitle,
    flatDocumentCount,
    currentDrill,
    archiveData,
    totalDocs,
    totalImports,
    totalExports,
    breadcrumbParts,
    sortKey,
    sortDir,
    onSortKeyChange,
    onSortDirChange,
}: Props) => (
    <div className="flex flex-col gap-2 border-b border-border bg-surface-subtle px-4 py-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Records Browser</p>
            <div className="mt-0.5 flex min-w-0 items-center gap-2">
                {viewMode === 'document' ? (
                    <div className="min-w-0">
                        <p className="truncate text-sm font-black text-text-primary">{documentViewTitle}</p>
                        <p className="text-xs font-semibold text-text-muted">
                            {flatDocumentCount.toLocaleString()} visible records
                        </p>
                    </div>
                ) : currentDrill.level !== 'years' ? (
                    <Breadcrumb parts={breadcrumbParts} />
                ) : (
                    <div className="min-w-0">
                        <p className="truncate text-sm font-black text-text-primary">Folder View</p>
                        <p className="text-xs font-semibold text-text-muted">
                            {archiveData.length.toLocaleString()} filing years · {totalDocs.toLocaleString()} files · {totalImports.toLocaleString()} imports · {totalExports.toLocaleString()} exports
                        </p>
                    </div>
                )}
            </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
            {currentDrill.level === 'bls' && viewMode === 'folder' && (
                <select
                    value={`${sortKey}:${sortDir}`}
                    onChange={(e) => {
                        const [k, d] = e.target.value.split(':');
                        onSortKeyChange(k as SortKey);
                        onSortDirChange(d as 'asc' | 'desc');
                    }}
                    className="h-9 rounded-lg border border-border-strong bg-input-bg px-3 text-xs font-bold text-text-secondary shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                >
                    <option value="period:desc">Period newest first</option>
                    <option value="period:asc">Period oldest first</option>
                    <option value="bl:asc">BL A-Z</option>
                    <option value="bl:desc">BL Z-A</option>
                    <option value="client:asc">Client A-Z</option>
                    <option value="files:desc">Most files</option>
                    <option value="files:asc">Fewest files</option>
                </select>
            )}
            <ViewToggle mode={viewMode} onChange={onViewModeChange} />
        </div>
    </div>
);
