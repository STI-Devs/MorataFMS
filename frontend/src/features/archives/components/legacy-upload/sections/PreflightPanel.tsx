import {
    formatBytes,
    type FolderSummary,
    type PreflightReport,
    type RejectedLegacyFile,
} from '../../../utils/legacyUpload.utils';
import { SectionTitle } from './legacyUploadPrimitives';
import {
    checkToneClasses,
    semanticToneClasses,
    statusBadgeBaseClass,
    tintedInsetSurfaceClass,
} from './legacyUploadStyles';

interface Props {
    report: PreflightReport;
    summary: FolderSummary;
    rejectedFiles: RejectedLegacyFile[];
}

export const PreflightPanel = ({ report, summary, rejectedFiles }: Props) => (
    <div className="rounded-2xl border border-border bg-surface">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div>
                <SectionTitle>Preflight</SectionTitle>
                <h3 className="mt-2 text-lg font-black tracking-tight text-text-primary">{report.patternLabel}</h3>
            </div>
            <span className={`${statusBadgeBaseClass} ${semanticToneClasses.info}`}>
                {report.reviewStatus}
            </span>
        </div>

        <div className="grid gap-3 px-5 py-5 md:grid-cols-3">
            {report.checks.map((check) => (
                <div key={check.label} className={`rounded-xl border px-4 py-3 ${checkToneClasses[check.tone]}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest">{check.label}</p>
                    <p className="mt-1 text-sm font-bold">{check.value}</p>
                </div>
            ))}
        </div>

        <div className="border-t border-border px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">What the system detected</p>
            <p className="mt-2 text-sm text-text-secondary">
                {summary.fileCount.toLocaleString()} files · {summary.subfolderCount.toLocaleString()} folders · {formatBytes(summary.totalBytes)}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
                {report.warnings.map((warning) => (
                    <li key={warning} className="rounded-xl border border-border bg-surface-secondary/50 px-3 py-2">
                        {warning}
                    </li>
                ))}
            </ul>

            {rejectedFiles.length > 0 && (
                <div className={`mt-4 rounded-2xl px-4 py-4 ${semanticToneClasses.danger}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-current">Upload Policy</p>
                            <p className="mt-2 text-sm font-bold text-current">
                                {rejectedFiles.length} file{rejectedFiles.length === 1 ? '' : 's'} blocked before upload
                            </p>
                            <p className="mt-1 text-sm text-current">
                                Remove these files from the selected folder, then choose the root folder again.
                            </p>
                        </div>
                        <span className={`${statusBadgeBaseClass} bg-surface text-current dark:bg-surface-secondary/85`}>
                            Upload blocked
                        </span>
                    </div>

                    <ul className="mt-4 space-y-2">
                        {rejectedFiles.slice(0, 8).map((file) => (
                            <li key={file.relativePath} className={`rounded-xl px-3 py-3 ${tintedInsetSurfaceClass}`}>
                                <p className="truncate text-sm font-bold text-text-primary">{file.relativePath}</p>
                                <p className="mt-1 text-xs text-current">{file.reason}</p>
                            </li>
                        ))}
                    </ul>

                    {rejectedFiles.length > 8 && (
                        <p className="mt-3 text-xs font-semibold text-current">
                            Showing 8 of {rejectedFiles.length} blocked files.
                        </p>
                    )}
                </div>
            )}
        </div>
    </div>
);
