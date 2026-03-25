import { Icon } from '../../../../components/Icon';
import { FILTER_LABELS, type TypeFilter } from './documentsList.utils';

export const DocumentsToolbar = ({
    searchQuery,
    typeFilter,
    isFilterOpen,
    onSearchChange,
    onToggleFilter,
    onTypeFilterChange,
}: {
    searchQuery: string;
    typeFilter: TypeFilter;
    isFilterOpen: boolean;
    onSearchChange: (value: string) => void;
    onToggleFilter: () => void;
    onTypeFilterChange: (value: TypeFilter) => void;
}) => (
    <div className="flex flex-col items-stretch justify-between gap-3 rounded-t-xl border-b border-border bg-surface p-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
            <svg
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
            </svg>
            <input
                type="text"
                placeholder="Search by BL No. or client…"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                className="h-9 w-full rounded-lg border border-border-strong bg-input-bg pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
        </div>

        <div className="flex items-center gap-2">
            <div className="relative">
                <button
                    onClick={onToggleFilter}
                    className="flex h-9 min-w-[120px] items-center justify-between rounded-lg border border-border-strong bg-input-bg px-3 text-left text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary focus:outline-none"
                >
                    {FILTER_LABELS[typeFilter]}
                    <Icon name="chevron-down" className="ml-2 h-3.5 w-3.5 text-text-muted" />
                </button>
                {isFilterOpen ? (
                    <div className="animate-dropdown-in absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-xl border border-border-strong bg-surface shadow-lg">
                        {(['all', 'import', 'export'] as const).map((category) => (
                            <button
                                key={category}
                                onClick={() => onTypeFilterChange(category)}
                                className={`w-full px-3 py-2 text-left text-xs font-semibold transition-colors hover:bg-hover ${
                                    typeFilter === category
                                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                        : 'text-text-primary'
                                }`}
                            >
                                {FILTER_LABELS[category]}
                            </button>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    </div>
);
