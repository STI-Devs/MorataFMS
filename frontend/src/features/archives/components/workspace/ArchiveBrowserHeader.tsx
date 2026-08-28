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
    totalBLRecords: number;
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
    totalBLRecords,
    totalImports,
    totalExports,
    breadcrumbParts,
    sortKey,
    sortDir,
    onSortKeyChange,
    onSortDirChange,
}: Props) => (
    <div className="flex flex-col gap-2 border-b border-border/80 bg-muted/20 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
            {viewMode === 'document' ? (
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{documentViewTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {flatDocumentCount.toLocaleString()} visible records
                    </p>
                </div>
            ) : currentDrill.level !== 'years' ? (
                <Breadcrumb parts={breadcrumbParts} />
            ) : (
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">Folder View</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {archiveData.length.toLocaleString()} filing years · {totalDocs.toLocaleString()} files · {totalBLRecords.toLocaleString()} BL Records · {totalImports.toLocaleString()} imports · {totalExports.toLocaleString()} exports
                    </p>
                </div>
            )}
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
                    className="h-8 rounded-lg border border-border/80 bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
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

