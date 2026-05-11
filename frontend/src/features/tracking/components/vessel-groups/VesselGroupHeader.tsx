import type { ReactNode } from 'react';

import type { VesselGroup } from '../../types';

interface VesselGroupHeaderProps<T> {
    group: VesselGroup<T>;
    isExpanded: boolean;
    onToggle: () => void;
    mode?: 'live' | 'review';
    action?: ReactNode;
}

export function VesselGroupHeader<T>({
    group,
    isExpanded,
    onToggle,
    mode = 'live',
    action,
}: VesselGroupHeaderProps<T>) {
    const isReviewMode = mode === 'review';
    const etaLabel = group.type === 'import' ? 'ETA' : 'ETD';
    const progressLabel = 'in review';
    const reviewLabel = isReviewMode
        ? 'flagged'
        : group.stats.blocked === 1
          ? 'needs review'
          : 'need review';
    const reviewSubtitle =
        group.type === 'import'
            ? 'Completed import transactions'
            : 'Completed export transactions';

    const formattedEta = group.eta
        ? new Date(`${group.eta}T00:00:00`).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : null;

    const hasBlocked = group.stats.blocked > 0;
    const isDelayed = group.isDelayed;

    const accentClass = hasBlocked
        ? 'border-l-red-500'
        : isDelayed
          ? 'border-l-amber-500'
          : 'border-l-transparent';

    const bgClass = hasBlocked
        ? 'bg-red-50/30 dark:bg-red-950/15 hover:bg-red-50/50'
        : isDelayed
          ? 'bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-50/40'
          : isReviewMode
            ? 'bg-surface hover:bg-surface-secondary/30'
            : 'bg-surface hover:bg-surface-secondary/50';

    return (
        <div
            className={`
                w-full flex items-center gap-3 px-5 py-4 border-b border-border border-l-[3px]
                transition-all duration-200 select-none
                ${bgClass} ${accentClass}
            `}
        >
            <button
                type="button"
                onClick={onToggle}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-border bg-surface shadow-sm">
                    <svg
                        className={`h-3 w-3 text-text-muted transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-[15px] font-bold tracking-tight text-text-primary">
                            {group.vesselName}
                        </span>
                        {group.voyage && (
                            <span className="shrink-0 rounded-lg border border-border bg-surface px-2 py-0.5 text-[10px] font-semibold text-text-muted shadow-sm">
                                Voy. {group.voyage}
                            </span>
                        )}
                        <span className={`hidden shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:inline-flex ${
                            group.type === 'import'
                                ? 'border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-300'
                                : 'border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        }`}>
                            {group.type}
                        </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
                        {isReviewMode ? (
                            <span className="font-medium text-text-secondary">{reviewSubtitle}</span>
                        ) : (
                            <span>
                                <span className="mr-1.5 font-bold uppercase tracking-wider opacity-70">{etaLabel}</span>
                                <span className="font-medium text-text-secondary">{formattedEta || '—'}</span>
                            </span>
                        )}
                        <span className="sm:hidden">
                            <span className="font-semibold text-text-secondary">{group.stats.total}</span> total
                        </span>
                    </div>
                </div>

                <div className="hidden shrink-0 items-center gap-2 sm:flex">
                    {isDelayed && (
                        <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                            Late
                        </span>
                    )}
                    <span className="rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] text-text-muted shadow-sm">
                        <span className="font-bold text-text-primary">{group.stats.total}</span> total
                    </span>
                    {isReviewMode && group.stats.in_progress > 0 && (
                        <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                            <span className="font-bold">{group.stats.in_progress}</span> {progressLabel}
                        </span>
                    )}
                    {hasBlocked && (
                        <span className="rounded-lg bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
                            <span className="font-bold">{group.stats.blocked}</span> {reviewLabel}
                        </span>
                    )}
                    {!isReviewMode && group.stats.completed > 0 && (
                        <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                            <span className="font-bold">{group.stats.completed}</span> done
                        </span>
                    )}
                </div>
            </button>

            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    );
}
