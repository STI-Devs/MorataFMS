import { Icon } from '../../../../components/Icon';
import type { ArchiveYear } from '../../../documents/types/document.types';
import { exportArchiveCSV } from '../../utils/export.utils';
import type { DocStatusFilter } from '../../utils/archive.utils';

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
};

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
}: Props) => (
    <div className="flex flex-col gap-2 px-4 py-2.5 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
                type="text"
                value={globalSearch}
                onChange={(e) => onGlobalSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && onGlobalSearchChange('')}
                placeholder={searchPlaceholder}
                className="h-9 w-full rounded-lg border border-border-strong bg-input-bg pl-10 pr-10 text-sm text-text-primary shadow-sm transition-all placeholder:text-text-muted focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
            />
            {globalSearch && (
                <button
                    onClick={() => onGlobalSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[126px]">
                <select
                    value={filterYear}
                    onChange={(e) => onFilterYearChange(e.target.value)}
                    aria-label="Filter by year"
                    className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-border-strong bg-input-bg px-3 text-xs font-bold text-text-primary shadow-sm focus:border-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                    <option value="all">All Years</option>
                    {availableYears.map((y) => (
                        <option key={y} value={String(y)}>{y}</option>
                    ))}
                </select>
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-border bg-surface-secondary p-1">
                {(['all', 'import', 'export'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => onFilterTypeChange(t)}
                        className={`h-8 rounded-lg px-3 text-xs font-bold transition-all ${filterType === t ? 'bg-text-primary text-surface shadow-sm' : 'text-text-secondary hover:bg-hover hover:text-text-primary'}`}
                    >
                        {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-border bg-surface-secondary p-1">
                {([{ value: 'all', label: 'All' }, { value: 'complete', label: 'Complete' }, { value: 'incomplete', label: 'Incomplete' }] as const).map(({ value, label }) => (
                    <button
                        key={value}
                        onClick={() => onFilterStatusChange(value)}
                        className={`h-8 rounded-lg px-3 text-xs font-bold transition-all ${filterStatus === value ? 'bg-text-primary text-surface shadow-sm' : 'text-text-secondary hover:bg-hover hover:text-text-primary'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <button
                onClick={() => exportArchiveCSV(archiveData, { year: filterYear, type: filterType, status: filterStatus })}
                title="Export visible BL records as CSV"
                aria-label="Export CSV"
                className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-border-strong bg-surface-secondary px-3 text-xs font-bold text-text-secondary shadow-sm transition-colors hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-500"
            >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CSV
            </button>
            <button
                onClick={onOpenUpload}
                aria-label="Upload Document"
                className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
                <Icon name="plus" className="h-4 w-4" />
                Upload
            </button>
        </div>
    </div>
);
