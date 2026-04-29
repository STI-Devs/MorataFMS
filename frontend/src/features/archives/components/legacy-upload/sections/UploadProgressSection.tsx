import type { ProgressState } from '../../../utils/legacyUpload.utils';
import { SectionTitle } from './legacyUploadPrimitives';

interface Props {
    progress: ProgressState;
    onCancel: () => void;
    isCancelling: boolean;
}

export const UploadProgressSection = ({ progress, onCancel, isCancelling }: Props) => {
    const percentage = progress.total > 0 ? Math.min(100, Math.round((progress.done / progress.total) * 100)) : 0;

    return (
        <div className="rounded-2xl border border-border bg-surface">
            <div className="border-b border-border px-5 py-4">
                <SectionTitle>Upload Progress</SectionTitle>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-black tracking-tight text-text-primary">{progress.status}</h3>
                    <span className="text-sm font-bold text-text-secondary">{percentage}%</span>
                </div>
            </div>

            <div className="space-y-4 px-5 py-5">
                <div className="h-3 overflow-hidden rounded-full bg-surface-secondary">
                    <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${percentage}%` }} />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                    <span><span className="font-bold text-emerald-600">{progress.done.toLocaleString()}</span> uploaded</span>
                    <span><span className="font-bold text-red-500">{progress.failed.toLocaleString()}</span> failed</span>
                    <span>{progress.total.toLocaleString()} total</span>
                </div>

                {progress.currentItem && (
                    <div className="rounded-xl bg-surface-secondary px-3 py-2 text-xs font-medium text-text-secondary">
                        {progress.currentItem}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isCancelling}
                        className="rounded-xl border border-border-strong bg-surface px-4 py-2 text-xs font-bold text-text-secondary transition-all hover:bg-hover"
                    >
                        {isCancelling ? 'Stopping Upload...' : 'Cancel Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
};
