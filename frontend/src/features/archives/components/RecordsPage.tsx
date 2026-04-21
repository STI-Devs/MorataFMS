import { useState } from 'react';
import { ArchivesPage } from './ArchivesPage';
import { LegacyBatchesPage } from './LegacyBatchesPage';
import { LegacyFolderUploadView } from './LegacyFolderUploadView';

type RecordsTab = 'archive' | 'legacyUpload' | 'legacyBatches';
type MountedLegacyPanels = {
    legacyUpload: boolean;
    legacyBatches: boolean;
};

export const RecordsPage = () => {
    const [activeTab, setActiveTab] = useState<RecordsTab>('legacyUpload');
    const [resumeBatchId, setResumeBatchId] = useState<string | null>(null);
    const [mountedLegacyPanels, setMountedLegacyPanels] = useState<MountedLegacyPanels>({
        legacyUpload: true,
        legacyBatches: false,
    });

    const showTab = (tab: RecordsTab) => {
        if (tab === 'archive') {
            setActiveTab(tab);
            return;
        }

        setMountedLegacyPanels((current) => ({
            ...current,
            [tab]: true,
        }));
        setActiveTab(tab);
    };

    return (
        <div className="w-full pb-12">
            {/* ── Page Header ── */}
            <div className="flex items-start justify-between gap-4 mb-1 pt-2">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-text-primary">Records</h1>
                    <p className="text-sm text-text-muted mt-0.5">
                        Archive operations and legacy folders.
                    </p>
                </div>
            </div>

            {/* ── Sub-navigation ── */}
            <div className="flex items-end gap-0 border-b border-border mb-7">
                <button
                    id="records-tab-archive"
                    type="button"
                    onClick={() => showTab('archive')}
                    className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                        activeTab === 'archive'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border-strong'
                    }`}
                >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Archive Transactions
                </button>

                <button
                    id="records-tab-legacy"
                    type="button"
                    onClick={() => showTab('legacyUpload')}
                    className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                        activeTab === 'legacyUpload'
                            ? 'border-amber-500 text-amber-700'
                            : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border-strong'
                    }`}
                >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    Legacy Folder Upload
                </button>

                <button
                    id="records-tab-legacy-batches"
                    type="button"
                    onClick={() => showTab('legacyBatches')}
                    className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                        activeTab === 'legacyBatches'
                            ? 'border-amber-500 text-amber-700'
                            : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border-strong'
                    }`}
                >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7a2 2 0 012-2h3l2 2h7a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V7zm4 5h8m-8 4h5" />
                    </svg>
                    Legacy Batches
                </button>
            </div>

            {/* ── Sub-view content ── */}
            <div hidden={activeTab !== 'archive'}>
                {/* Archive Transactions — renders the full existing ArchivesPage as-is */}
                {/* The ArchivesPage renders its own header; we suppress the extra padding by removing p-8 */}
                <div className="-mx-0">
                    <ArchivesPage />
                </div>
            </div>

            {mountedLegacyPanels.legacyUpload && (
                <div hidden={activeTab !== 'legacyUpload'}>
                    <LegacyFolderUploadView
                        onOpenBatches={() => {
                            setResumeBatchId(null);
                            showTab('legacyBatches');
                        }}
                        resumeBatchId={resumeBatchId}
                        onResumeCleared={() => setResumeBatchId(null)}
                    />
                </div>
            )}

            {mountedLegacyPanels.legacyBatches && (
                <div hidden={activeTab !== 'legacyBatches'}>
                    <LegacyBatchesPage
                        onResumeBatch={(batchId) => {
                            setResumeBatchId(batchId);
                            showTab('legacyUpload');
                        }}
                    />
                </div>
            )}
        </div>
    );
};
