import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LegacyFolderUploadView } from '../../../archives/components/legacy-upload/LegacyFolderUploadView';
import { LegacyBatchesPage } from '../../../archives/components/pages/LegacyBatchesPage';
import type { LegacyBatchModule } from '../../../archives/types/legacyBatch.types';
import type { BatchMeta } from '../../../archives/utils/legacyUpload.utils';
import { appRoutes } from '../../../../lib/appRoutes';

type LawFirmLegacyBatchModule = Extract<LegacyBatchModule, 'notarial' | 'legal'>;
type LegacyRecordsWorkspace = 'legacyUpload' | 'notarialBatches' | 'legalBatches';

type LegacyModuleConfig = {
    module: LawFirmLegacyBatchModule;
    eyebrow: string;
    title: string;
    description: string;
    searchPlaceholder: string;
    deleteTitle: string;
};

const BATCH_MODULES: Record<LawFirmLegacyBatchModule, LegacyModuleConfig> = {
    notarial: {
        module: 'notarial',
        eyebrow: 'Notarial Records Legacy Batches',
        title: 'Uploaded notarial legacy batches',
        description: 'Browse old notarial folder uploads without mixing them into legal file records.',
        searchPlaceholder: 'Search notarial batch, root folder, or uploader...',
        deleteTitle: 'Delete Incomplete Notarial Legacy Batch',
    },
    legal: {
        module: 'legal',
        eyebrow: 'Legal Records Legacy Batches',
        title: 'Uploaded legal legacy batches',
        description: 'Browse old legal file folder uploads without mixing them into newly generated legal files.',
        searchPlaceholder: 'Search legal batch, root folder, or uploader...',
        deleteTitle: 'Delete Incomplete Legal Legacy Batch',
    },
};

const WORKSPACE_COPY: Record<LegacyRecordsWorkspace, { title: string; description: string }> = {
    legacyUpload: {
        title: 'Legacy Folder Upload',
        description: 'Choose the department in Batch Details, then upload the old folder with preserved paths and filenames.',
    },
    notarialBatches: {
        title: 'Notarial Batches',
        description: 'Review old notarial legacy folder uploads only.',
    },
    legalBatches: {
        title: 'Legal Batches',
        description: 'Review old legal legacy folder uploads only.',
    },
};

const LAW_FIRM_DEPARTMENT_OPTIONS = [
    { label: 'Notarial', value: 'Notarial' },
    { label: 'Legal', value: 'Legal' },
];

const getWorkspaceFromPath = (pathname: string): LegacyRecordsWorkspace | null => {
    if (pathname === appRoutes.paralegalLegacyFolderUpload) {
        return 'legacyUpload';
    }

    if (pathname === appRoutes.paralegalLegacyNotarialBatches) {
        return 'notarialBatches';
    }

    if (pathname === appRoutes.paralegalLegacyLegalBatches) {
        return 'legalBatches';
    }

    return null;
};

const resolveLawFirmModuleFromMeta = (meta: BatchMeta): LegacyBatchModule =>
    meta.department === 'Legal' ? 'legal' : 'notarial';

const getBatchRouteForModule = (module?: LegacyBatchModule): string =>
    module === 'legal'
        ? appRoutes.paralegalLegacyLegalBatches
        : appRoutes.paralegalLegacyNotarialBatches;

export const LegacyRecordsPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const activeWorkspace = getWorkspaceFromPath(location.pathname);
    const [resumeBatchId, setResumeBatchId] = useState<string | null>(null);
    const isBatchWorkspace = activeWorkspace === 'notarialBatches' || activeWorkspace === 'legalBatches';
    const workspaceCopy = activeWorkspace ? WORKSPACE_COPY[activeWorkspace] : WORKSPACE_COPY.legacyUpload;
    const selectedBatchModule = activeWorkspace === 'legalBatches' ? BATCH_MODULES.legal : BATCH_MODULES.notarial;

    if (!activeWorkspace) {
        return <Navigate to={appRoutes.paralegalLegacyFolderUpload} replace />;
    }

    return (
        <div className="w-full space-y-6 pb-8">
            <header className="flex flex-col gap-1 border-b border-border/80 pb-5">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {workspaceCopy.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {workspaceCopy.description}
                </p>
            </header>

            <div hidden={activeWorkspace !== 'legacyUpload'}>
                <LegacyFolderUploadView
                    module="notarial"
                    resolveModuleFromMeta={resolveLawFirmModuleFromMeta}
                    departmentOptions={LAW_FIRM_DEPARTMENT_OPTIONS}
                    startButtonLabel="Start Legacy Ingestion"
                    resumeButtonLabel="Resume Legacy Ingestion"
                    onOpenBatches={(module) => {
                        setResumeBatchId(null);
                        navigate(getBatchRouteForModule(module));
                    }}
                    resumeBatchId={resumeBatchId}
                    onResumeCleared={() => setResumeBatchId(null)}
                />
            </div>

            {isBatchWorkspace && (
                <LegacyBatchesPage
                    module={selectedBatchModule.module}
                    eyebrow={selectedBatchModule.eyebrow}
                    title={selectedBatchModule.title}
                    description={selectedBatchModule.description}
                    searchPlaceholder={selectedBatchModule.searchPlaceholder}
                    deleteTitle={selectedBatchModule.deleteTitle}
                    onResumeBatch={(batchId) => {
                        setResumeBatchId(batchId);
                        navigate(appRoutes.paralegalLegacyFolderUpload);
                    }}
                />
            )}
        </div>
    );
};
