import type { VesselGroup } from '../../types';

interface VesselGroupHeaderProps<T> {
    group: VesselGroup<T>;
    isExpanded: boolean;
    onToggle: () => void;
    mode?: 'live' | 'review';
}

export function VesselGroupHeader<T>({
    group,
    isExpanded,
    onToggle,
    mode = 'live',
}: VesselGroupHeaderProps<T>) {
    const isReviewMode = mode === 'review';
    const etaLabel = group.type === 'import' ? 'ETA' : 'ETD';
    const progressLabel = isReviewMode ? 'in review' : 'active';
    const blockedLabel = isReviewMode ? 'flagged' : 'blocked';
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
          ? 'border-l-amber-400'
          : 'border-l-transparent';

    const bgClass = hasBlocked
        ? 'bg-red-50/45 dark:bg-red-950/15 hover:bg-red-50/70 dark:hover:bg-red-950/25'
        : isDelayed
          ? 'bg-amber-50/25 dark:bg-amber-950/10 hover:bg-amber-50/45 dark:hover:bg-amber-950/20'
          : isReviewMode
            ? 'bg-surface-secondary/25 hover:bg-surface-secondary/40 dark:bg-surface-secondary/15 dark:hover:bg-surface-secondary/30'
            : 'bg-surface-secondary/40 hover:bg-surface-secondary/70 dark:bg-surface-secondary/20 dark:hover:bg-surface-secondary/40';

    return (
        <button
            type="button"
            onClick={onToggle}
            className={`
                w-full flex items-center gap-2.5 px-4 py-3 border-b border-border border-l-2
                transition-colors duration-150 select-none text-left
                ${bgClass} ${accentClass}
            `}
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
                    <span className="truncate text-sm font-semibold tracking-tight text-text-primary">
                        {group.vesselName}
                    </span>
                    {group.voyage && (
                        <span className="shrink-0 rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                            Voy. {group.voyage}
                        </span>
                    )}
                    <span className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:inline-flex ${
                        group.type === 'import'
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                        {group.type}
                    </span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
                    {isReviewMode ? (
                        <span className="font-medium text-text-secondary">{reviewSubtitle}</span>
                    ) : (
                        <span>
                            <span className="mr-1 font-semibold uppercase tracking-wide opacity-60">{etaLabel}</span>
                            <span className="font-medium text-text-secondary">{formattedEta || '—'}</span>
                        </span>
                    )}
                    <span className="sm:hidden">
                        <span className="font-semibold text-text-secondary">{group.stats.total}</span> total
                    </span>
                    {!isReviewMode && group.stats.in_progress > 0 && (
                        <span className="sm:hidden">
                            <span className="font-semibold text-amber-600 dark:text-amber-400">{group.stats.in_progress}</span> {progressLabel}
                        </span>
                    )}
                </div>
            </div>

            <div className="hidden shrink-0 items-center gap-2 sm:flex">
                {isDelayed && (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        Late
                    </span>
                )}
                    <span className="rounded-lg border border-border bg-surface px-2.5 py-0.5 text-[11px] text-text-muted">
                        <span className="font-semibold text-text-primary">{group.stats.total}</span> total
                    </span>
                {!isReviewMode && group.stats.in_progress > 0 && (
                    <span className="rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-1 text-[11px] text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-300">
                        <span className="font-semibold">{group.stats.in_progress}</span> {progressLabel}
                    </span>
                )}
                {hasBlocked && (
                    <span className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-[11px] text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
                        <span className="font-semibold">{group.stats.blocked}</span> {blockedLabel}
                    </span>
                )}
                {!isReviewMode && group.stats.completed > 0 && (
                    <span className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-300">
                        <span className="font-semibold">{group.stats.completed}</span> done
                    </span>
                )}
            </div>
        </button>
    );
}
