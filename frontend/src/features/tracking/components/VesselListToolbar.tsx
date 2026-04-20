import { Icon } from '../../../components/Icon';

export type ViewMode = 'grouped' | 'flat';

export type StatusFilter = 'all' | 'active' | 'blocked' | 'completed';
export type TimeFilter = 'all' | 'today' | 'week' | 'delayed';

export interface VesselListFilters {
    search: string;
    status: StatusFilter;
    time: TimeFilter;
}

interface VesselListToolbarProps {
    type: 'import' | 'export';
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    filters: VesselListFilters;
    onFiltersChange: (filters: Partial<VesselListFilters>) => void;
    onEncode: () => void;
    encodeLabel: string;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'completed', label: 'Completed' },
];

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
    { value: 'all', label: 'All Dates' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'delayed', label: 'Delayed' },
];

function FilterPill({
    active,
    onClick,
    children,
    danger,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    danger?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                px-3 h-8 rounded-full text-[11px] font-semibold transition-colors shrink-0 shadow-sm
                ${active
                    ? danger
                        ? 'bg-red-600 text-white border border-red-600'
                        : 'bg-text-primary text-surface border border-text-primary'
                    : 'text-text-secondary border border-border bg-surface hover:text-text-primary hover:bg-hover'
                }
            `}
        >
            {children}
        </button>
    );
}

export function VesselListToolbar({
    type,
    viewMode,
    onViewModeChange,
    filters,
    onFiltersChange,
    onEncode,
    encodeLabel,
}: VesselListToolbarProps) {
    const searchPlaceholder = type === 'import'
        ? 'Search vessel, BL, customs ref, importer…'
        : 'Search vessel, BL, ED no., shipper…';

    return (
        <div className="rounded-t-xl border-b border-border bg-gradient-to-b from-surface-secondary/60 to-surface px-4 py-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 min-w-[220px] max-w-xl">
                    <Icon name="search" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={filters.search}
                        onChange={e => onFiltersChange({ search: e.target.value })}
                        className="w-full pl-11 pr-4 h-10 rounded-xl border border-border bg-surface text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-colors shadow-sm"
                    />
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* View mode toggle */}
                <div className="flex items-center rounded-xl border border-border bg-surface p-1 shadow-sm shrink-0">
                    <button
                        type="button"
                        onClick={() => onViewModeChange('grouped')}
                        className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-[11px] font-semibold transition-colors ${viewMode === 'grouped' ? 'bg-text-primary text-surface shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                        title="Group by vessel"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h8M4 18h8" />
                        </svg>
                        Grouped
                    </button>
                    <button
                        type="button"
                        onClick={() => onViewModeChange('flat')}
                        className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-[11px] font-semibold transition-colors ${viewMode === 'flat' ? 'bg-text-primary text-surface shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                        title="Flat list"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        Flat
                    </button>
                </div>

                {/* Encode button */}
                <button
                    type="button"
                    onClick={onEncode}
                    className="flex items-center gap-2 px-4 h-10 rounded-xl text-xs font-bold text-white shadow-sm bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-700 transition-colors shrink-0"
                >
                    <Icon name="plus" className="w-3.5 h-3.5" />
                    {encodeLabel}
                </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                {/* Status filters */}
                {STATUS_OPTIONS.map(opt => (
                    <FilterPill
                        key={opt.value}
                        active={filters.status === opt.value}
                        onClick={() => onFiltersChange({ status: opt.value })}
                        danger={opt.value === 'blocked'}
                    >
                        {opt.label}
                    </FilterPill>
                ))}

                <div className="h-5 w-px bg-border mx-1 shrink-0" />

                {/* Time filters */}
                {TIME_OPTIONS.map(opt => (
                    <FilterPill
                        key={opt.value}
                        active={filters.time === opt.value}
                        onClick={() => onFiltersChange({ time: opt.value })}
                    >
                        {opt.label}
                    </FilterPill>
                ))}



                {/* Clear all */}
                {(filters.search || filters.status !== 'all' || filters.time !== 'all') && (
                    <button
                        type="button"
                        onClick={() => onFiltersChange({
                            search: '',
                            status: 'all',
                            time: 'all',
                        })}
                        className="ml-1 text-[11px] text-text-muted hover:text-text-primary underline underline-offset-2 transition-colors shrink-0"
                    >
                        Clear filters
                    </button>
                )}
            </div>
        </div>
    );
}
