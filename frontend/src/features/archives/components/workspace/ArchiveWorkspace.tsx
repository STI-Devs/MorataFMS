import { CurrentDateTime } from '../../../../components/CurrentDateTime';
import { ConfirmationModal } from '../../../../components/ConfirmationModal';
import { useAuth } from '../../../auth/hooks/useAuth';
import type { ArchiveDocument, ArchiveYear } from '../../../documents/types/document.types';
import { useArchiveWorkspace } from '../../hooks/useArchiveWorkspace';
import type { DrillState } from '../../utils/archive.utils';
import { buildBreadcrumbParts } from '../../utils/archiveWorkspace.utils';
import { AddArchiveDocumentModal } from '../documents/AddArchiveDocumentModal';
import { EditArchiveRecordModal } from '../documents/EditArchiveRecordModal';
import { ReplaceArchiveDocumentModal } from '../documents/ReplaceArchiveDocumentModal';
import { ArchiveLegacyUploadPage } from '../pages/ArchiveLegacyUploadPage';
import { EmptyState } from '../ui/EmptyState';
import { ArchiveBrowserHeader } from './ArchiveBrowserHeader';
import { ArchiveFilesView } from './ArchiveFilesView';
import { ArchivesFolderView } from './ArchivesFolderView';
import { ArchivesBLView, ArchivesDocumentView, GlobalSearchResults } from './ArchivesViews';
import { ArchiveWorkspaceControlBand } from './ArchiveWorkspaceControlBand';
import { ArchiveWorkspaceFilters } from './ArchiveWorkspaceFilters';

type ArchiveMetric = {
    label: string;
    value: string;
    tone: string;
};

type ArchiveWorkspaceProps = {
    archiveData: ArchiveYear[];
    isLoading: boolean;
    isError: boolean;
    queryKey: readonly unknown[];
    pageDescription: string;
    controlTitle: string;
    healthLabel: string;
    healthTone: 'good' | 'danger';
    metrics: ArchiveMetric[];
    searchPlaceholder: string;
    documentViewTitle: string;
    showAuditButton?: boolean;
    canDeleteDocument?: (doc: ArchiveDocument, userId?: number) => boolean;
    canReplaceDocument?: (doc: ArchiveDocument, userId?: number) => boolean;
};

export const ArchiveWorkspace = ({
    archiveData,
    isLoading,
    isError,
    queryKey,
    pageDescription,
    controlTitle,
    healthLabel,
    healthTone,
    metrics,
    searchPlaceholder,
    documentViewTitle,
    showAuditButton = true,
    canDeleteDocument = () => true,
    canReplaceDocument = () => true,
}: ArchiveWorkspaceProps) => {
    const { user } = useAuth();
    const workspace = useArchiveWorkspace({ archiveData, queryKey });

    if (workspace.showLegacyUpload) {
        const currentYear = workspace.currentDrill.level !== 'years'
            ? workspace.currentDrill.year.year
            : new Date().getFullYear() - 1;
        return (
            <div className="flex justify-center py-10 px-6">
                <div className="w-full max-w-2xl">
                    <ArchiveLegacyUploadPage
                        defaultYear={currentYear}
                        onBack={() => workspace.setShowLegacyUpload(false)}
                        onSubmit={workspace.handleArchiveUploadSuccess}
                    />
                </div>
            </div>
        );
    }

    if (isError) {
        return <EmptyState icon="alert-circle" title="Failed to load archives" subtitle="Check your connection and try again." />;
    }

    const totalImports = archiveData.reduce((sum, year) => sum + year.imports, 0);
    const totalExports = archiveData.reduce((sum, year) => sum + year.exports, 0);
    const totalDocs = archiveData.reduce((sum, year) => sum + year.documents.length, 0);
    const availableYears = archiveData.map((y) => y.year);

    const breadcrumbParts = buildBreadcrumbParts({
        currentDrill: workspace.currentDrill,
        nav: workspace.nav,
        navToYear: workspace.navToYear,
    });

    return (
        <div className="w-full space-y-3 pb-8 pt-1">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-text-primary">Records Archive</h1>
                    <p className="mt-0.5 max-w-3xl text-sm text-text-secondary">{pageDescription}</p>
                </div>
                <CurrentDateTime
                    className="hidden shrink-0 text-right sm:block"
                    timeClassName="text-xl font-bold tabular-nums text-text-primary leading-none"
                    dateClassName="text-xs font-semibold text-text-muted mt-1 uppercase tracking-widest leading-none"
                />
            </div>

            <section className="rounded-xl border border-border bg-surface shadow-sm">
                <ArchiveWorkspaceControlBand
                    controlTitle={controlTitle}
                    healthLabel={healthLabel}
                    healthTone={healthTone}
                    metrics={metrics}
                    isLoading={isLoading}
                />

                <ArchiveWorkspaceFilters
                    archiveData={archiveData}
                    availableYears={availableYears}
                    searchPlaceholder={searchPlaceholder}
                    globalSearch={workspace.globalSearch}
                    onGlobalSearchChange={workspace.setGlobalSearch}
                    filterYear={workspace.filterYear}
                    onFilterYearChange={workspace.setFilterYear}
                    filterType={workspace.filterType}
                    onFilterTypeChange={workspace.setFilterType}
                    filterStatus={workspace.filterStatus}
                    onFilterStatusChange={(value) => {
                        workspace.setFilterStatus(value);
                        workspace.setIncompleteFilterActive(false);
                    }}
                    onOpenUpload={() => workspace.setShowLegacyUpload(true)}
                />
            </section>

            <div className="rounded-xl border border-border overflow-hidden bg-surface shadow-sm">
                <ArchiveBrowserHeader
                    viewMode={workspace.viewMode}
                    onViewModeChange={(m) => {
                        workspace.setViewMode(m);
                        if (m === 'folder') {
                            workspace.setFilterStatus('all');
                            workspace.setIncompleteFilterActive(false);
                        }
                    }}
                    documentViewTitle={documentViewTitle}
                    flatDocumentCount={workspace.flatDocumentList.length}
                    currentDrill={workspace.currentDrill}
                    archiveData={archiveData}
                    totalDocs={totalDocs}
                    totalImports={totalImports}
                    totalExports={totalExports}
                    breadcrumbParts={breadcrumbParts}
                    sortKey={workspace.sortKey}
                    sortDir={workspace.sortDir}
                    onSortKeyChange={workspace.setSortKey}
                    onSortDirChange={workspace.setSortDir}
                />

                {isLoading ? (
                    <div className="divide-y divide-border/50">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between border-b border-border/50 p-4 px-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 animate-pulse rounded-lg bg-surface-secondary" />
                                    <div>
                                        <div className="h-4 w-32 animate-pulse rounded bg-surface-secondary" />
                                        <div className="mt-2 h-3 w-20 animate-pulse rounded bg-surface-secondary" />
                                    </div>
                                </div>
                                <div className="h-4 w-24 animate-pulse rounded bg-surface-secondary" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {workspace.viewMode === 'document' && (
                            <ArchivesDocumentView
                                flatDocumentList={workspace.flatDocumentList}
                                nav={workspace.nav}
                                setViewMode={workspace.setViewMode}
                            />
                        )}

                        {workspace.viewMode === 'folder' && workspace.globalSearch.trim() && (
                            <GlobalSearchResults
                                globalSearch={workspace.globalSearch}
                                globalResults={workspace.globalResults}
                                nav={workspace.nav}
                                setGlobalSearch={workspace.setGlobalSearch}
                            />
                        )}

                        {workspace.viewMode === 'folder' && !workspace.globalSearch.trim() && workspace.drill.level === 'years' && (
                            <ArchivesFolderView
                                archiveData={archiveData}
                                filterYear={workspace.filterYear}
                                filterType={workspace.filterType}
                                filterStatus={workspace.filterStatus}
                                expandedYears={workspace.expandedYears}
                                toggleYear={workspace.toggleYear}
                                nav={workspace.nav}
                                openMenuKey={workspace.openMenuKey}
                                setOpenMenuKey={workspace.setOpenMenuKey}
                                onOpenUpload={() => workspace.setShowLegacyUpload(true)}
                                showAuditButton={showAuditButton}
                            />
                        )}
                    </>
                )}

                {workspace.viewMode === 'folder' && !workspace.globalSearch.trim() && workspace.currentDrill.level === 'bls' && (
                    <ArchivesBLView
                        drill={workspace.currentDrill as Extract<DrillState, { level: 'bls' }>}
                        search={workspace.search}
                        sortKey={workspace.sortKey}
                        sortDir={workspace.sortDir}
                        nav={workspace.nav}
                    />
                )}

                {workspace.currentDrill.level === 'files' && (
                    <ArchiveFilesView
                        drill={workspace.currentDrill as Extract<DrillState, { level: 'files' }>}
                        userId={user?.id}
                        canDeleteDocument={canDeleteDocument}
                        canReplaceDocument={canReplaceDocument}
                        onEditRecord={workspace.handleEditArchiveRecord}
                        onDeleteDoc={workspace.handleDeleteArchiveDoc}
                        onReplaceDoc={workspace.handleReplaceArchiveDoc}
                        onAddDoc={(blNo, type, docs) =>
                            workspace.setAddDocModal({ isOpen: true, blNo, type, docs })
                        }
                    />
                )}
            </div>

            <ConfirmationModal
                isOpen={workspace.confirmModal.isOpen}
                onClose={() => workspace.setConfirmModal((m) => ({ ...m, isOpen: false }))}
                onConfirm={workspace.confirmModal.onConfirm}
                title={workspace.confirmModal.title}
                message={workspace.confirmModal.message}
                confirmText={workspace.confirmModal.confirmText}
                confirmButtonClass={workspace.confirmModal.confirmButtonClass}
            />
            <AddArchiveDocumentModal
                isOpen={workspace.addDocModal.isOpen}
                onClose={() => workspace.setAddDocModal((m) => ({ ...m, isOpen: false }))}
                blNo={workspace.addDocModal.blNo}
                type={workspace.addDocModal.type}
                existingDocs={workspace.addDocModal.docs}
            />
            <ReplaceArchiveDocumentModal
                isOpen={workspace.replaceDocModal.isOpen}
                onClose={() => workspace.setReplaceDocModal((m) => ({ ...m, isOpen: false }))}
                document={workspace.replaceDocModal.document}
            />
            <EditArchiveRecordModal
                isOpen={workspace.editRecordModal.isOpen}
                onClose={() => workspace.setEditRecordModal((m) => ({ ...m, isOpen: false }))}
                record={workspace.editRecordModal.record}
            />
        </div>
    );
};
