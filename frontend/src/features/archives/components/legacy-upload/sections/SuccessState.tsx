import { formatDateLabel, inspectTree } from '../../../utils/legacyUpload.utils';
import type { LegacyBatch } from '../../../types/legacyBatch.types';
import { raisedSurfaceClass, semanticToneClasses, tintedInsetSurfaceClass } from './legacyUploadStyles';

interface Props {
    batch: LegacyBatch;
    onViewFolder: () => void;
    onOpenBatches: () => void;
    onUploadAnother: () => void;
}

export const SuccessState = ({ batch, onViewFolder, onOpenBatches, onUploadAnother }: Props) => (
    <div className={`rounded-2xl p-6 ${semanticToneClasses.good}`}>
        <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/55">
                <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <div>
                <p className="text-base font-bold text-current">Ingestion complete</p>
                <p className="text-sm text-current/85">The legacy batch is ready for retrieval and reference browsing.</p>
            </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[
                { label: 'Batch Name', value: batch.batchName },
                { label: 'Root Folder', value: batch.rootFolder },
                { label: 'Files Uploaded', value: batch.uploadSummary.uploaded.toLocaleString() },
                { label: 'Folders Uploaded', value: batch.tree ? inspectTree(batch.tree).folders.toLocaleString() : '0' },
                { label: 'Total Size', value: batch.totalSize },
                { label: 'Completed At', value: formatDateLabel(batch.completedAt) },
            ].map((item) => (
                <div key={item.label} className={`rounded-xl px-4 py-3 ${tintedInsetSurfaceClass}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{item.label}</p>
                    <p className="mt-1 text-sm font-bold text-text-primary">{item.value}</p>
                </div>
            ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
                type="button"
                onClick={onViewFolder}
                className={`rounded-xl px-4 py-2.5 text-sm ${raisedSurfaceClass}`}
            >
                Browse Legacy Batch
            </button>
            <button
                type="button"
                onClick={onOpenBatches}
                className={`rounded-xl px-4 py-2.5 text-sm ${raisedSurfaceClass}`}
            >
                Open Batch List
            </button>
            <button
                type="button"
                onClick={onUploadAnother}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700"
            >
                Start New Batch
            </button>
        </div>
    </div>
);
