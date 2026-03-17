import { Icon } from '../../../components/Icon';

// ── Skeleton helper ────────────────────────────────────────────────────────────
const Sk = ({ className = '' }: { className?: string }) => (
    <div className={`skeleton-shimmer ${className}`} />
);

export const TrackingDetailsSkeleton = () => (
    <div className="flex flex-col space-y-5 pb-6">

        {/* Header */}
        <div>
            <div className="text-xs text-text-muted flex items-center gap-1 mb-3 opacity-50 cursor-default">
                <Icon name="chevron-left" className="w-3.5 h-3.5" />
                Back
            </div>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary mb-0.5">Transaction Details</h1>
                    <div className="flex items-center gap-2 text-xs text-text-muted mt-1">
                        Dashboard / Tracking / <Sk className="h-3 w-32 inline-block rounded" />
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 border border-border-strong rounded-lg opacity-50">
                        <Icon name="flag" className="w-3.5 h-3.5 text-text-secondary" />
                        <span className="text-xs font-semibold text-text-secondary">Remarks</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 border border-border-strong rounded-lg opacity-50">
                        <Icon name="edit" className="w-3.5 h-3.5 text-text-secondary" />
                        <span className="text-xs font-semibold text-text-secondary">Edit</span>
                    </div>
                    <Sk className="h-7 w-20 rounded-full" />
                </div>
            </div>
        </div>

        {/* Info card */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border border-b border-border">
                <div className="px-5 py-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5">Bill of Lading</p>
                    <Sk className="h-4 w-28 rounded" />
                </div>
                <div className="px-5 py-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5">Importer / Shipper</p>
                    <Sk className="h-4 w-32 rounded" />
                </div>
                <div className="px-5 py-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5">Arrival / Departure</p>
                    <Sk className="h-4 w-24 rounded" />
                </div>
                <div className="px-5 py-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5">Customs / Details</p>
                    <Sk className="h-4 w-20 rounded" />
                </div>
            </div>
            <div className="px-5 py-4">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-text-secondary">Clearance Progress</p>
                    <Sk className="h-3 w-24 rounded" />
                </div>
                <Sk className="h-2 w-full rounded-full" />
            </div>
        </div>

        {/* Stages */}
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-bold text-text-primary">Processing Stages</h2>
                <Sk className="h-5 w-28 rounded-full" />
            </div>
            <div className="divide-y divide-border/60">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex gap-4 px-5 py-4">
                        <div className="flex flex-col items-center shrink-0 pt-0.5">
                            <Sk className="w-8 h-8 rounded-full" />
                            {i < 5 && <Sk className="w-0.5 flex-1 mt-1 min-h-[28px] rounded-full" />}
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                            <div className="flex items-start justify-between gap-2">
                                <div className="space-y-3 flex-1 min-w-0 pt-1">
                                    <Sk className="h-4 w-48 rounded" />
                                    <Sk className="h-3 w-72 max-w-full rounded" />
                                </div>
                                <Sk className="h-9 w-24 rounded-lg shrink-0" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);
