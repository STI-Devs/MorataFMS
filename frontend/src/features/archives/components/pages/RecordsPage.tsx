import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { appRoutes } from '../../../../lib/appRoutes';
import { ArchivesPage } from './ArchivesPage';
import { LegacyBatchesPage } from './LegacyBatchesPage';
import { LegacyFolderUploadView } from '../legacy-upload/LegacyFolderUploadView';

type RecordsWorkspace = 'archive' | 'legacyUpload' | 'legacyBatches';

const getWorkspaceFromPath = (pathname: string): RecordsWorkspace | null => {
    if (pathname === appRoutes.archiveTransactions) {
        return 'archive';
    }

    if (pathname === appRoutes.legacyFolderUpload) {
        return 'legacyUpload';
    }

    if (pathname === appRoutes.legacyBatches) {
        return 'legacyBatches';
    }

    return null;
};

export const RecordsPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const activeWorkspace = getWorkspaceFromPath(location.pathname);
    const [resumeBatchId, setResumeBatchId] = useState<string | null>(null);
    const [isLegacyBatchesMounted, setIsLegacyBatchesMounted] = useState(activeWorkspace === 'legacyBatches');
    const shouldMountLegacyBatches = isLegacyBatchesMounted || activeWorkspace === 'legacyBatches';

    if (location.pathname === appRoutes.archives || !activeWorkspace) {
        return <Navigate to={appRoutes.archiveTransactions} replace />;
    }

    return (
        <div className="w-full pb-12">
            <div hidden={activeWorkspace !== 'archive'}>
                <ArchivesPage />
            </div>

            <div hidden={activeWorkspace !== 'legacyUpload'}>
                <LegacyFolderUploadView
                    onOpenBatches={() => {
                        setResumeBatchId(null);
                        setIsLegacyBatchesMounted(true);
                        navigate(appRoutes.legacyBatches);
                    }}
                    resumeBatchId={resumeBatchId}
                    onResumeCleared={() => setResumeBatchId(null)}
                />
            </div>

            {shouldMountLegacyBatches && (
                <div hidden={activeWorkspace !== 'legacyBatches'}>
                    <LegacyBatchesPage
                        onResumeBatch={(batchId) => {
                            setResumeBatchId(batchId);
                            navigate(appRoutes.legacyFolderUpload);
                        }}
                    />
                </div>
            )}
        </div>
    );
};
