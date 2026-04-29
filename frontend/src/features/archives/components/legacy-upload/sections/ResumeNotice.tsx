import { formatDateLabel } from '../../../utils/legacyUpload.utils';
import type { LegacyBatch } from '../../../types/legacyBatch.types';
import { SectionTitle } from './legacyUploadPrimitives';
import { semanticToneClasses, statusBadgeBaseClass, tintedInsetSurfaceClass } from './legacyUploadStyles';

export const ResumeNotice = ({ batch }: { batch: LegacyBatch }) => (
    <div className={`rounded-2xl px-5 py-4 ${semanticToneClasses.warn}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
                <SectionTitle>Interrupted Batch</SectionTitle>
                <h3 className="mt-2 text-lg font-black tracking-tight text-text-primary">{batch.batchName}</h3>
                <p className="mt-1 text-sm text-text-secondary">
                    {batch.uploadSummary.uploaded} of {batch.uploadSummary.expected} files are already stored.
                    Select the same root folder again to continue the remaining upload.
                </p>
            </div>
            <span className={`${statusBadgeBaseClass} bg-surface text-current dark:bg-surface-secondary/85`}>
                Interrupted
            </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className={`rounded-xl px-4 py-3 ${tintedInsetSurfaceClass}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Root Folder</p>
                <p className="mt-1 text-sm font-bold text-text-primary">{batch.rootFolder}</p>
            </div>
            <div className={`rounded-xl px-4 py-3 ${tintedInsetSurfaceClass}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Remaining Files</p>
                <p className="mt-1 text-sm font-bold text-text-primary">{batch.uploadSummary.remaining}</p>
            </div>
            <div className={`rounded-xl px-4 py-3 ${tintedInsetSurfaceClass}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Last Activity</p>
                <p className="mt-1 text-sm font-bold text-text-primary">{formatDateLabel(batch.lastActivityAt)}</p>
            </div>
        </div>
    </div>
);
