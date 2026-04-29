import { useMemo, useState } from 'react';

import { Icon } from '../../../../components/Icon';
import type { EncoderUser } from '../../../oversight/types/transaction.types';
import type {
    AdminReviewReadinessFilter,
    AdminReviewStatusFilter,
    AdminReviewTypeFilter,
} from '../../types/document.types';

// ---------------------------------------------------------------------------
// PillGroup — a row of pill-style toggle buttons for a single filter dim
// ---------------------------------------------------------------------------

function PillGroup<T extends string | number>({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: { label: string; value: T }[];
    value: T;
    onChange: (value: T) => void;
}) {
    return (
        <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">{label}</p>
            <div className="flex flex-wrap gap-1">
                {options.map((option) => {
                    const isActive = option.value === value;
                    return (
                        <button
                            key={String(option.value)}
                            type="button"
                            onClick={() => onChange(option.value)}
                            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                isActive
                                    ? 'border-blue-500/30 bg-blue-500/10 text-blue-600'
                                    : 'border-border bg-background text-text-secondary hover:bg-hover hover:text-text-primary'
                            }`}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// FilterPopover
// ---------------------------------------------------------------------------

export const FilterPopover = ({
    typeFilter,
    statusFilter,
    readinessFilter,
    assignedUserIdFilter,
    assignedUsers,
    onTypeFilterChange,
    onStatusFilterChange,
    onReadinessFilterChange,
    onAssignedUserFilterChange,
    onResetFilters,
    onClose,
}: {
    typeFilter: AdminReviewTypeFilter;
    statusFilter: AdminReviewStatusFilter;
    readinessFilter: AdminReviewReadinessFilter;
    assignedUserIdFilter: number | 'all';
    assignedUsers: EncoderUser[];
    onTypeFilterChange: (value: AdminReviewTypeFilter) => void;
    onStatusFilterChange: (value: AdminReviewStatusFilter) => void;
    onReadinessFilterChange: (value: AdminReviewReadinessFilter) => void;
    onAssignedUserFilterChange: (value: number | 'all') => void;
    onResetFilters: () => void;
    onClose: () => void;
}) => {
    const [encoderSearch, setEncoderSearch] = useState('');
    const encoderOptions = useMemo<{ label: string; value: number | 'all' }[]>(
        () => [
            { label: 'All', value: 'all' },
            ...assignedUsers
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((user) => ({ label: user.name, value: user.id as number | 'all' })),
        ],
        [assignedUsers],
    );
    const filteredEncoderOptions = useMemo(() => {
        const query = encoderSearch.trim().toLowerCase();

        if (!query) {
            return encoderOptions;
        }

        return encoderOptions.filter((option) => option.label.toLowerCase().includes(query));
    }, [encoderOptions, encoderSearch]);

    return (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-72 rounded-2xl border border-border bg-surface shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Refine Queue</p>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md p-0.5 text-text-muted transition-colors hover:bg-hover hover:text-text-primary"
                >
                    <Icon name="x" className="h-3.5 w-3.5" />
                </button>
            </div>

            <div className="space-y-4 px-4 py-3">
                <PillGroup<AdminReviewTypeFilter>
                    label="Type"
                    value={typeFilter}
                    onChange={onTypeFilterChange}
                    options={[
                        { label: 'All', value: 'all' },
                        { label: 'Import', value: 'import' },
                        { label: 'Export', value: 'export' },
                    ]}
                />
                <PillGroup<AdminReviewStatusFilter>
                    label="Status"
                    value={statusFilter}
                    onChange={onStatusFilterChange}
                    options={[
                        { label: 'All', value: 'all' },
                        { label: 'Completed', value: 'completed' },
                        { label: 'Cancelled', value: 'cancelled' },
                    ]}
                />
                <PillGroup<AdminReviewReadinessFilter>
                    label="Readiness"
                    value={readinessFilter}
                    onChange={onReadinessFilterChange}
                    options={[
                        { label: 'All', value: 'all' },
                        { label: 'Ready', value: 'ready' },
                        { label: 'Missing Docs', value: 'missing_docs' },
                        { label: 'Flagged', value: 'flagged' },
                    ]}
                />
                {assignedUsers.length > 0 ? (
                    <div>
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Encoder</p>
                            <span className="text-[10px] font-mono text-text-muted">{assignedUsers.length} total</span>
                        </div>
                        {assignedUsers.length > 6 ? (
                            <div className="relative mb-2">
                                <Icon name="search" className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="text"
                                    value={encoderSearch}
                                    onChange={(event) => setEncoderSearch(event.target.value)}
                                    placeholder="Search encoder..."
                                    className="w-full rounded-xl border border-border bg-background py-2 pl-8 pr-3 text-xs text-text-primary placeholder:text-text-muted focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        ) : null}
                        <div className="max-h-48 overflow-y-auto pr-1">
                            <div className="flex flex-wrap gap-1">
                                {filteredEncoderOptions.length > 0 ? (
                                    filteredEncoderOptions.map((option) => {
                                        const isActive = option.value === assignedUserIdFilter;

                                        return (
                                            <button
                                                key={String(option.value)}
                                                type="button"
                                                onClick={() => onAssignedUserFilterChange(option.value)}
                                                className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                                    isActive
                                                        ? 'border-blue-500/30 bg-blue-500/10 text-blue-600'
                                                        : 'border-border bg-background text-text-secondary hover:bg-hover hover:text-text-primary'
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        );
                                    })
                                ) : (
                                    <p className="text-[11px] text-text-muted">No encoder matches the current search.</p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="border-t border-border px-4 py-2.5">
                <button
                    type="button"
                    onClick={() => {
                        onResetFilters();
                        onClose();
                    }}
                    className="text-[11px] font-semibold text-text-secondary transition-colors hover:text-text-primary"
                >
                    Clear all filters
                </button>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// FilterChips — dismissible active-filter row
// ---------------------------------------------------------------------------

export const FilterChips = ({
    typeFilter,
    statusFilter,
    readinessFilter,
    assignedUserIdFilter,
    assignedUsers,
    onTypeFilterChange,
    onStatusFilterChange,
    onReadinessFilterChange,
    onAssignedUserFilterChange,
    onResetAll,
}: {
    typeFilter: AdminReviewTypeFilter;
    statusFilter: AdminReviewStatusFilter;
    readinessFilter: AdminReviewReadinessFilter;
    assignedUserIdFilter: number | 'all';
    assignedUsers: EncoderUser[];
    onTypeFilterChange: (value: AdminReviewTypeFilter) => void;
    onStatusFilterChange: (value: AdminReviewStatusFilter) => void;
    onReadinessFilterChange: (value: AdminReviewReadinessFilter) => void;
    onAssignedUserFilterChange: (value: number | 'all') => void;
    onResetAll: () => void;
}) => {
    const READINESS_LABELS: Record<Exclude<AdminReviewReadinessFilter, 'all' | 'ready'>, string> = {
        missing_docs: 'Missing Docs',
        flagged: 'Flagged',
    };

    const chips: { key: string; label: string; value: string; onRemove: () => void }[] = [];

    if (typeFilter !== 'all') {
        chips.push({
            key: 'type',
            label: 'Type',
            value: typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1),
            onRemove: () => onTypeFilterChange('all'),
        });
    }
    if (statusFilter !== 'all') {
        chips.push({
            key: 'status',
            label: 'Status',
            value: statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1),
            onRemove: () => onStatusFilterChange('all'),
        });
    }
    if (readinessFilter !== 'all' && readinessFilter !== 'ready') {
        chips.push({
            key: 'readiness',
            label: 'Readiness',
            value: READINESS_LABELS[readinessFilter],
            onRemove: () => onReadinessFilterChange('all'),
        });
    }
    if (assignedUserIdFilter !== 'all') {
        const userName = assignedUsers.find((u) => u.id === assignedUserIdFilter)?.name ?? 'Selected';
        chips.push({
            key: 'encoder',
            label: 'Encoder',
            value: userName,
            onRemove: () => onAssignedUserFilterChange('all'),
        });
    }

    if (chips.length === 0) return null;

    return (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {chips.map((chip) => (
                <span
                    key={chip.key}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface pl-2.5 pr-1.5 py-1 text-[11px] text-text-secondary"
                >
                    <span className="font-semibold text-text-primary">{chip.label}:</span>
                    {chip.value}
                    <button
                        type="button"
                        onClick={chip.onRemove}
                        className="flex items-center rounded-full p-0.5 text-text-muted transition-colors hover:bg-hover hover:text-text-primary"
                        aria-label={`Remove ${chip.label} filter`}
                    >
                        <Icon name="x" className="h-2.5 w-2.5" />
                    </button>
                </span>
            ))}
            <button
                type="button"
                onClick={onResetAll}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-text-secondary transition-colors hover:bg-hover hover:text-text-primary"
            >
                <Icon name="x" className="h-3 w-3" />
                Clear
            </button>
        </div>
    );
};
