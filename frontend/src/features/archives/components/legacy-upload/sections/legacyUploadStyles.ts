export const semanticToneClasses = {
    info: 'border-blue-200 bg-blue-50/80 text-blue-700 dark:border-blue-900/80 dark:bg-blue-950/30 dark:text-blue-200',
    good: 'border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900/80 dark:bg-emerald-950/25 dark:text-emerald-200',
    warn: 'border-amber-200 bg-amber-50/80 text-amber-700 dark:border-amber-900/80 dark:bg-amber-950/25 dark:text-amber-200',
    danger: 'border-red-200 bg-red-50/80 text-red-700 dark:border-red-900/80 dark:bg-red-950/25 dark:text-red-200',
} as const;

export const statusBadgeBaseClass = 'inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider';
export const raisedSurfaceClass = 'border border-border-strong bg-surface font-bold text-text-secondary transition-all hover:bg-hover dark:bg-surface-secondary/75';
export const tintedInsetSurfaceClass = 'bg-surface border border-border shadow-sm dark:bg-surface-secondary/75 dark:shadow-none';

export const checkToneClasses: Record<'good' | 'warn' | 'neutral', string> = {
    good: semanticToneClasses.good,
    warn: semanticToneClasses.warn,
    neutral: 'border-border bg-surface-secondary text-text-secondary',
};
