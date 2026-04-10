import { CurrentDateTime } from '../../../components/CurrentDateTime';
import { Icon } from '../../../components/Icon';

export const ParalegalDashboard = () => {
    return (
        <div className="w-full p-8 pb-12 space-y-7">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-text-primary">Dashboard</h1>
                    <p className="text-base text-text-muted mt-1">Paralegal Overview</p>
                </div>
                <CurrentDateTime
                    className="text-right shrink-0"
                    timeClassName="text-2xl font-bold tabular-nums text-text-primary"
                    dateClassName="text-sm text-text-muted"
                />
            </div>

            <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-surface-secondary/40">
                    <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Module Status</p>
                    <h2 className="text-lg font-bold text-text-primary mt-1">Legal workspace is not live yet</h2>
                </div>

                <div className="px-6 py-16 flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center">
                        <Icon name="file-text" className="w-8 h-8 text-text-muted" />
                    </div>
                    <div className="space-y-2 max-w-xl">
                        <p className="text-sm font-semibold text-text-primary">
                            This area is intentionally gated until the legal and notarial backend flows are finalized.
                        </p>
                        <p className="text-sm text-text-muted">
                            Avoid adding mock folders, files, or counters here. Once the backend contract is ready,
                            this screen should be rebuilt from real API resources and permissions.
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-800/60">
                        <span className="w-2 h-2 rounded-full bg-current opacity-80" />
                        Pending backend integration
                    </div>
                </div>
            </div>
        </div>
    );
};
