import type { LegacyBatch } from '../../../types/legacyBatch.types';
import { semanticToneClasses } from './legacyUploadStyles';

interface Props {
    batch: LegacyBatch | null;
    message: string;
    onRetry: () => void;
    onStartNew: () => void;
}

export const ErrorState = ({ batch, message, onRetry, onStartNew }: Props) => {
    const isInterrupted = batch?.status === 'interrupted';

    return (
        <div className={`rounded-2xl border p-6 ${isInterrupted ? semanticToneClasses.warn : semanticToneClasses.danger}`}>
            <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                    isInterrupted
                        ? 'border-amber-200 bg-amber-100 dark:border-amber-800 dark:bg-amber-950/55'
                        : 'border-red-200 bg-red-100 dark:border-red-800 dark:bg-red-950/55'
                }`}>
                    <svg className={`h-4.5 w-4.5 ${isInterrupted ? 'text-amber-600 dark:text-amber-200' : 'text-red-600 dark:text-red-200'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div>
                    <p className="text-base font-bold text-current">
                        {isInterrupted ? 'Upload interrupted' : 'Upload failed'}
                    </p>
                    <p className="text-sm text-current/85">{message}</p>
                </div>
            </div>

            {batch && (
                <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
                    <span><span className="font-bold text-emerald-600">{batch.uploadSummary.uploaded}</span> uploaded</span>
                    <span><span className="font-bold text-red-600">{batch.uploadSummary.remaining}</span> remaining</span>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
                {batch?.canResume && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition-all hover:bg-amber-100 dark:hover:bg-amber-950/40 ${semanticToneClasses.warn}`}
                    >
                        Resume Upload
                    </button>
                )}
                <button
                    type="button"
                    onClick={onStartNew}
                    className="rounded-xl border border-border-strong bg-surface px-4 py-2 text-xs font-bold text-text-secondary transition-all hover:bg-hover"
                >
                    Start New Batch
                </button>
            </div>
        </div>
    );
};
