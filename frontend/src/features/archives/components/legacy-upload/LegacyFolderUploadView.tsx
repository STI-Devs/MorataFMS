import { useLegacyUploadOrchestrator } from '../../hooks/useLegacyUploadOrchestrator';
import {
    LEGACY_ALLOWED_FILE_ACCEPT,
    LEGACY_ALLOWED_FILE_LABEL,
} from '../../utils/legacyUpload.utils';
import { LegacyFolderBrowserPanel } from './LegacyFolderBrowserPanel';
import { ErrorState } from './sections/ErrorState';
import { FolderDropzone } from './sections/FolderDropzone';
import { MetadataPanel } from './sections/MetadataPanel';
import { PreflightPanel } from './sections/PreflightPanel';
import { ResumeNotice } from './sections/ResumeNotice';
import { SelectedFolderPanel } from './sections/SelectedFolderPanel';
import { SuccessState } from './sections/SuccessState';
import { UploadProgressSection } from './sections/UploadProgressSection';
import { WorkflowSteps } from './sections/WorkflowSteps';
import { semanticToneClasses } from './sections/legacyUploadStyles';

interface Props {
    onOpenBatches?: () => void;
    resumeBatchId?: string | null;
    onResumeCleared?: () => void;
}

export const LegacyFolderUploadView = ({ onOpenBatches, resumeBatchId, onResumeCleared }: Props) => {
    const {
        phase,
        isDragging,
        setIsDragging,
        rejectedFiles,
        folderSummary,
        meta,
        setMeta,
        progress,
        activeBatch,
        viewingBatch,
        setViewingBatch,
        errorMessage,
        isCancellingUpload,
        resumeBatch,
        preflight,
        folderInputRef,
        resumeRootMismatch,
        hasRejectedFiles,
        hasUploadableFiles,
        isUploadReady,
        isLargeBatch,
        handleFolderInput,
        handleDrop,
        handleReset,
        performUpload,
        handleCancelUpload,
        showBrowser,
    } = useLegacyUploadOrchestrator({ resumeBatchId, onResumeCleared });

    return (
        <>
            <div className="space-y-6">
                <WorkflowSteps phase={phase} />

                {resumeBatch && phase === 'empty' && <ResumeNotice batch={resumeBatch} />}

                {(phase === 'empty' || phase === 'selected' || phase === 'uploading') && (
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
                        <div className="space-y-4">
                            {phase === 'empty' && (
                                <FolderDropzone
                                    isDragging={isDragging}
                                    onDragOver={(event) => {
                                        event.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    onSelectFolder={() => folderInputRef.current?.click()}
                                    isResumeMode={Boolean(resumeBatch)}
                                />
                            )}

                            {phase === 'selected' && folderSummary && preflight && (
                                <>
                                    <SelectedFolderPanel
                                        summary={folderSummary}
                                        onRemove={handleReset}
                                        onReplace={() => folderInputRef.current?.click()}
                                        onViewFull={showBrowser}
                                    />
                                    <PreflightPanel report={preflight} summary={folderSummary} rejectedFiles={rejectedFiles} />
                                </>
                            )}

                            {phase === 'uploading' && (
                                <UploadProgressSection
                                    progress={progress}
                                    onCancel={handleCancelUpload}
                                    isCancelling={isCancellingUpload}
                                />
                            )}

                            {phase === 'selected' && folderSummary && (
                                <div className="space-y-3">
                                    {resumeRootMismatch && (
                                        <div className={`rounded-xl px-4 py-3 text-sm ${semanticToneClasses.danger}`}>
                                            This folder root does not match the interrupted batch. Expected <span className="font-bold">{activeBatch?.rootFolder}</span>.
                                        </div>
                                    )}

                                    {hasRejectedFiles && (
                                        <div className={`rounded-xl px-4 py-3 text-sm ${semanticToneClasses.danger}`}>
                                            Remove the blocked files first. Legacy batches accept only {LEGACY_ALLOWED_FILE_LABEL} up to 50 MB per file.
                                        </div>
                                    )}

                                    {isLargeBatch && (
                                        <div className={`rounded-xl px-4 py-3 text-sm ${semanticToneClasses.warn}`}>
                                            Large legacy batch detected. This folder contains {folderSummary?.fileCount} files, so the system will register the
                                            manifest in smaller chunks before upload starts to reduce browser and network risk.
                                        </div>
                                    )}

                                    {!hasRejectedFiles && !hasUploadableFiles && (
                                        <div className={`rounded-xl px-4 py-3 text-sm ${semanticToneClasses.danger}`}>
                                            No uploadable files were detected in this folder selection.
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={performUpload}
                                        disabled={!isUploadReady}
                                        className={`w-full rounded-2xl px-6 py-4 text-sm font-bold shadow-sm transition-all ${
                                            isUploadReady
                                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                : 'cursor-not-allowed bg-surface-secondary text-text-muted'
                                        }`}
                                    >
                                        {activeBatch?.canResume ? 'Resume Legacy Ingestion' : 'Start Legacy Ingestion'}
                                    </button>
                                </div>
                            )}

                            <input
                                ref={folderInputRef}
                                type="file"
                                // @ts-expect-error webkitdirectory is supported by the browser even if it is not part of the standard typings yet
                                webkitdirectory=""
                                multiple
                                accept={LEGACY_ALLOWED_FILE_ACCEPT}
                                className="sr-only"
                                onChange={handleFolderInput}
                            />
                        </div>

                        {phase !== 'uploading' && <MetadataPanel meta={meta} onChange={setMeta} />}
                    </div>
                )}

                {phase === 'complete' && activeBatch && (
                    <SuccessState
                        batch={activeBatch}
                        onViewFolder={showBrowser}
                        onOpenBatches={() => {
                            onResumeCleared?.();
                            onOpenBatches?.();
                        }}
                        onUploadAnother={handleReset}
                    />
                )}

                {(phase === 'interrupted' || phase === 'failed') && (
                    <ErrorState
                        batch={activeBatch}
                        message={errorMessage}
                        onRetry={performUpload}
                        onStartNew={handleReset}
                    />
                )}
            </div>

            {viewingBatch && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setViewingBatch(null)} />
                    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-5xl flex-col border-l border-border bg-surface shadow-2xl">
                        <LegacyFolderBrowserPanel batch={viewingBatch} onClose={() => setViewingBatch(null)} />
                    </div>
                </>
            )}

        </>
    );
};
