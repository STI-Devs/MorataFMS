import type { ReactNode } from 'react';
import { Download, Plus, Search, X } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import type { ArchiveYear } from '../../../documents/types/document.types';
import type { DocStatusFilter } from '../../utils/archive.utils';
import { exportArchiveCSV } from '../../utils/export.utils';

type Props = {
    archiveData: ArchiveYear[];
    availableYears: number[];
    searchPlaceholder: string;
    globalSearch: string;
    onGlobalSearchChange: (value: string) => void;
    filterYear: string;
    onFilterYearChange: (value: string) => void;
    filterType: string;
    onFilterTypeChange: (value: string) => void;
    filterStatus: DocStatusFilter;
    onFilterStatusChange: (value: DocStatusFilter) => void;
    onOpenUpload: () => void;
    zipRequestsAction?: ReactNode;
};

const selectCls =
    'h-8 px-2.5 rounded-lg border border-border/80 bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-colors cursor-pointer';

export const ArchiveWorkspaceFilters = ({
    archiveData,
    availableYears,
    searchPlaceholder,
    globalSearch,
    onGlobalSearchChange,
    filterYear,
    onFilterYearChange,
    filterType,
    onFilterTypeChange,
    filterStatus,
    onFilterStatusChange,
    onOpenUpload,
    zipRequestsAction,
}: Props) => (
    <div className="flex flex-col gap-3 p-3">
        <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
            {/* Left Filter Controls */}
            <div className="flex flex-1 flex-wrap items-center gap-2">
                {/* Search Input */}
                <div className="relative w-full min-w-0 sm:w-[240px] lg:w-[280px]">
                    <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        value={globalSearch}
                        onChange={(e) => onGlobalSearchChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Escape' && onGlobalSearchChange('')}
                        placeholder={searchPlaceholder}
                        className="h-8 pl-8 pr-7 text-xs"
                    />
                    {globalSearch ? (
                        <button
                            type="button"
                            onClick={() => onGlobalSearchChange('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                            <X className="size-3.5" />
                        </button>
                    ) : null}
                </div>

                {/* Year Select */}
                <select
                    value={filterYear}
                    onChange={(e) => onFilterYearChange(e.target.value)}
                    aria-label="Filter by year"
                    className={selectCls}
                >
                    <option value="all">All Years</option>
                    {availableYears.map((y) => (
                        <option key={y} value={String(y)}>
                            {y}
                        </option>
                    ))}
                </select>

                {/* Type Filter Pills */}
                <div className="flex flex-wrap items-center gap-1">
                    {(['all', 'import', 'export'] as const).map((t) => {
                        const isSelected = filterType === t;
                        return (
                            <Button
                                key={t}
                                variant={isSelected ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => onFilterTypeChange(t)}
                                className={`h-8 px-2.5 text-xs font-medium shrink-0 shadow-2xs transition-all cursor-pointer ${
                                    !isSelected
                                        ? 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border-border/80'
                                        : ''
                                }`}
                            >
                                {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                            </Button>
                        );
                    })}
                </div>

                {/* Status Filter Pills */}
                <div className="flex flex-wrap items-center gap-1">
                    {(
                        [
                            { value: 'all', label: 'All' },
                            { value: 'complete', label: 'Complete' },
                            { value: 'incomplete', label: 'Incomplete' },
                        ] as const
                    ).map(({ value, label }) => {
                        const isSelected = filterStatus === value;
                        return (
                            <Button
                                key={value}
                                variant={isSelected ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => onFilterStatusChange(value)}
                                className={`h-8 px-2.5 text-xs font-medium shrink-0 shadow-2xs transition-all cursor-pointer ${
                                    !isSelected
                                        ? 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border-border/80'
                                        : ''
                                }`}
                            >
                                {label}
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* Right Action Cluster */}
            <div className="flex flex-wrap items-center justify-end gap-2 self-end xl:self-center">
                {zipRequestsAction}

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        exportArchiveCSV(archiveData, {
                            year: filterYear,
                            type: filterType,
                            status: filterStatus,
                        })
                    }
                    title="Export visible BL records as CSV"
                    aria-label="Export CSV"
                    className="h-8 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground border-border/80 cursor-pointer"
                >
                    <Download className="mr-1 size-3.5" />
                    CSV
                </Button>

                <Button
                    size="sm"
                    onClick={onOpenUpload}
                    aria-label="Upload Document"
                    className="h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer gap-1"
                >
                    <Plus className="size-3.5" />
                    Upload
                </Button>
            </div>
        </div>
    </div>
);

