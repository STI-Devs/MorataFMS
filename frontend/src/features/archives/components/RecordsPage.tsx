import { useState } from 'react';
import { ArchivesPage } from './ArchivesPage';
import { LegacyFolderUploadView } from './LegacyFolderUploadView';

type RecordsTab = 'archive' | 'legacy';

export const RecordsPage = () => {
    const [activeTab, setActiveTab] = useState<RecordsTab>('legacy');

    return (
        <div className="w-full pb-12">
            {/* ── Page Header ── */}
            <div className="flex items-start justify-between gap-4 mb-1 pt-2">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-text-primary">Records</h1>
                    <p className="text-sm text-text-muted mt-0.5">
                        Manage normalized archive transactions and upload historical legacy folders for reference.
                    </p>
                </div>
            </div>

            {/* ── Helper text ── */}
            <p className="text-xs text-text-muted mb-5 mt-2 leading-relaxed max-w-2xl">
                Use <span className="font-semibold text-text-secondary">Archive Transactions</span> for system-based archived records.
                {' '}Use <span className="font-semibold text-text-secondary">Legacy Folder Upload</span> for old folder structures from the client's previous filing method.
            </p>

            {/* ── Sub-navigation ── */}
            <div className="flex items-end gap-0 border-b border-border mb-7">
                <button
                    id="records-tab-archive"
                    type="button"
                    onClick={() => setActiveTab('archive')}
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
                    <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                        activeTab === 'archive'
                            ? 'bg-blue-50 text-blue-600 border-blue-200'
                            : 'bg-surface-secondary text-text-muted border-border'
                    }`}>
                        System Records
                    </span>
                </button>

                <button
                    id="records-tab-legacy"
                    type="button"
                    onClick={() => setActiveTab('legacy')}
                    className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                        activeTab === 'legacy'
                            ? 'border-amber-500 text-amber-700'
                            : 'border-transparent text-text-muted hover:text-text-secondary hover:border-border-strong'
                    }`}
                >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    Legacy Folder Upload
                    <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                        activeTab === 'legacy'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-surface-secondary text-text-muted border-border'
                    }`}>
                        Historical
                    </span>
                </button>
            </div>

            {/* ── Sub-view content ── */}
            {activeTab === 'archive' ? (
                /* Archive Transactions — renders the full existing ArchivesPage as-is */
                /* The ArchivesPage renders its own header; we suppress the extra padding by removing p-8 */
                <div className="-mx-0">
                    <ArchivesPage />
                </div>
            ) : (
                /* Legacy Folder Upload */
                <LegacyFolderUploadView />
            )}
        </div>
    );
};
