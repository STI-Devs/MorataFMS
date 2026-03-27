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
    const accentTones = {
        neutral: 'bg-slate-400/70',
        warning: isZero ? 'bg-slate-400/70' : 'bg-amber-500',
        success: isZero ? 'bg-slate-400/70' : 'bg-emerald-500',
    };

    return (
        <div className="rounded-xl border border-border bg-surface px-3 py-2.5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">{title}</p>
                <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${accentTones[tone]}`} />
            </div>
            {isLoading ? (
                <div className="mt-2 h-6 w-12 animate-pulse rounded bg-hover" />
            ) : (
                <p className={`mt-2 text-xl font-bold tracking-tight ${tones[tone]}`}>{value}</p>
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
    <div className="rounded-xl border border-border bg-surface px-4 py-3.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">{label}</p>
        <p className="mt-2 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">{value}</p>
    </div>
);

export const QueueSkeleton = () => (
    <div className="space-y-0 divide-y divide-border">
        {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="animate-pulse px-6 py-7">
                <div className="flex items-start justify-between gap-4">
                    <div className="h-4 w-32 rounded bg-hover" />
                    <div className="h-3 w-14 rounded bg-hover" />
                </div>
                <div className="mt-3.5 h-4 w-44 rounded bg-hover" />
                <div className="mt-2.5 h-3 w-28 rounded bg-hover" />
                <div className="mt-6 flex items-center gap-2">
                    <div className="h-6 w-16 rounded bg-hover" />
                    <div className="h-6 w-20 rounded bg-hover" />
                    <div className="h-6 w-24 rounded bg-hover" />
                </div>
            </div>
        ))}
    </div>
);

export const DetailSkeleton = () => (
    <div className="space-y-8 px-8 py-10">
        <div className="animate-pulse rounded-xl border border-border bg-surface px-6 py-6">
            <div className="h-7 w-48 rounded bg-hover" />
            <div className="mt-4 h-4 w-36 rounded bg-hover" />
            <div className="mt-5 flex gap-2.5">
                <div className="h-6 w-16 rounded bg-hover" />
                <div className="h-6 w-20 rounded bg-hover" />
                <div className="h-6 w-24 rounded bg-hover" />
            </div>
        </div>
    </div>
);

export const DocumentMeta = ({ file }: { file: AdminReviewDocumentFile }) => (
    <p className="mt-1.5 text-xs text-text-muted">
        {file.size}
        {file.uploaded_by ? ` · Uploaded by ${file.uploaded_by}` : ''}
        {file.uploaded_at ? ` · ${formatDateTime(file.uploaded_at)}` : ''}
    </p>
);
