import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
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

    return (
        <div
            className={`
                w-full flex items-center gap-3 px-5 py-3.5 border-b border-border/80
                transition-colors duration-150 select-none bg-muted/40 hover:bg-muted/70
            `}
        >
            <button
                type="button"
                onClick={onToggle}
                className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
            >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border/80 bg-background shadow-2xs">
                    <svg
                        className={`size-3.5 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
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
                        <span className="truncate text-sm font-bold tracking-tight text-foreground">
                            {group.vesselName}
                        </span>
                        {group.voyage && (
                            <span className="shrink-0 rounded-md border border-border/80 bg-background px-2 py-0.5 text-[11px] font-mono font-medium text-muted-foreground shadow-2xs">
                                Voy. {group.voyage}
                            </span>
                        )}
                        <Badge
                            variant="outline"
                            className={`hidden shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 sm:inline-flex ${
                                group.type === 'import'
                                    ? 'border-primary/20 bg-primary/10 text-primary'
                                    : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                            }`}
                        >
                            {group.type}
                        </Badge>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {isReviewMode ? (
                            <span className="font-medium text-foreground/80">{reviewSubtitle}</span>
                        ) : (
                            <span>
                                <span className="mr-1 font-semibold uppercase tracking-wider text-muted-foreground/70">{etaLabel}</span>
                                <span className="font-medium text-foreground/80">{formattedEta || '—'}</span>
                            </span>
                        )}
                        <span className="sm:hidden">
                            <span className="font-semibold text-foreground">{group.stats.total}</span> total
                        </span>
                    </div>
                </div>

                <div className="hidden shrink-0 items-center gap-2 sm:flex">
                    {isDelayed && (
                        <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                            Late
                        </Badge>
                    )}
                    <span className="rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground shadow-2xs font-semibold">
                        <span className="font-bold text-foreground">{group.stats.total}</span> total
                    </span>
                    {isReviewMode && group.stats.in_progress > 0 && (
                        <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium">
                            <span className="font-bold mr-1">{group.stats.in_progress}</span> {progressLabel}
                        </Badge>
                    )}
                    {hasBlocked && (
                        <Badge variant="destructive" className="text-xs font-medium">
                            <span className="font-bold mr-1">{group.stats.blocked}</span> {reviewLabel}
                        </Badge>
                    )}
                    {!isReviewMode && group.stats.completed > 0 && (
                        <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                            <span className="font-bold mr-1">{group.stats.completed}</span> done
                        </Badge>
                    )}
                </div>
            </button>

            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    );
}
