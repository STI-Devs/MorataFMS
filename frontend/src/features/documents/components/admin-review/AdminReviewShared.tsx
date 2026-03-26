import type { AdminReviewDocumentFile } from '../../types/document.types';
import { formatDateTime } from './adminReview.utils';

export const KpiMetric = ({
    title,
    value,
    tone = 'neutral',
    isLoading = false,
}: {
    title: string;
    value: string | number;
    tone?: 'neutral' | 'warning' | 'success';
    isLoading?: boolean;
}) => {
    // Tone colors only fire when value is meaningful (> 0).
    // A zero warning or zero success is noise, not signal.
    const isZero = value === 0 || value === '0' || value === '—';
    const tones = {
        neutral: 'text-text-primary',
        warning: isZero ? 'text-text-primary' : 'text-amber-500',
        success: isZero ? 'text-text-primary' : 'text-emerald-500',
    };

    return (
        <div className="flex flex-col justify-center border-r border-border bg-surface px-6 py-4 last:border-r-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">{title}</p>
            {isLoading ? (
                <div className="mt-3 h-8 w-16 animate-pulse rounded bg-hover" />
            ) : (
                <p className={`mt-2 text-3xl font-bold tracking-tight ${tones[tone]}`}>{value}</p>
            )}
        </div>
    );
};

export const SummaryCard = ({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) => (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">{value}</p>
    </div>
);

export const QueueSkeleton = () => (
    <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-lg border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                    <div className="h-4 w-28 rounded bg-hover" />
                    <div className="h-3 w-16 rounded bg-hover" />
                </div>
                <div className="mt-3 h-4 w-40 rounded bg-hover" />
                <div className="mt-4 flex items-center justify-between">
                    <div className="h-5 w-20 rounded bg-hover" />
                    <div className="h-4 w-24 rounded bg-hover" />
                </div>
            </div>
        ))}
    </div>
);

export const DetailSkeleton = () => (
    <div className="space-y-8 p-6">
        <div className="animate-pulse rounded-lg border border-border bg-surface p-6">
            <div className="h-6 w-48 rounded bg-hover" />
            <div className="mt-3 h-4 w-32 rounded bg-hover" />
            <div className="mt-4 flex gap-2">
                <div className="h-6 w-16 rounded bg-hover" />
                <div className="h-6 w-20 rounded bg-hover" />
            </div>
        </div>
    </div>
);

export const DocumentMeta = ({ file }: { file: AdminReviewDocumentFile }) => (
    <p className="mt-1 text-xs text-text-muted">
        {file.size}
        {file.uploaded_by ? ` · Uploaded by ${file.uploaded_by}` : ''}
        {file.uploaded_at ? ` · ${formatDateTime(file.uploaded_at)}` : ''}
    </p>
);
