import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { appRoutes } from '../../../../lib/appRoutes';
import { useAuth } from '../../../auth/hooks/useAuth';
import { useMyArchives } from '../../hooks/useMyArchives';
import { computeGlobalCompleteness, countIncompleteBLs } from '../../utils/archive.utils';
import { archiveKeys } from '../../utils/archiveQueryKeys';
import { ArchiveWorkspace } from '../workspace/ArchiveWorkspace';
import { LegacyBatchesPage } from './LegacyBatchesPage';
import { LegacyFolderUploadView } from '../legacy-upload/LegacyFolderUploadView';

type EncoderArchiveSection = 'archive' | 'legacyUpload' | 'legacyBatches';

const getEncoderArchiveSectionFromPath = (pathname: string): EncoderArchiveSection | null => {
    if (pathname === appRoutes.encoderRecordsArchive) {
        return 'archive';
    }

    if (pathname === appRoutes.encoderLegacyFolderUpload) {
        return 'legacyUpload';
    }

    if (pathname === appRoutes.encoderLegacyBatches) {
        return 'legacyBatches';
    }

    return null;
};

export const EncoderArchivePage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: archiveData = [], isLoading, isError } = useMyArchives();
    const activeSection = getEncoderArchiveSectionFromPath(location.pathname);
    const [resumeBatchId, setResumeBatchId] = useState<string | null>(null);
    const [isLegacyBatchesMounted, setIsLegacyBatchesMounted] = useState(activeSection === 'legacyBatches');
    const shouldMountLegacyBatches = isLegacyBatchesMounted || activeSection === 'legacyBatches';

    const globalPct = computeGlobalCompleteness(archiveData);
    const incompleteBLs = countIncompleteBLs(archiveData);
    const totalMyUploads = archiveData.reduce(
        (sum, year) => sum + year.documents.filter(doc => doc.uploader?.id === user?.id).length,
        0,
    );
    const uniqueBLs = new Set(archiveData.flatMap(year => year.documents.map(doc => `${doc.bl_no}|${doc.type}|${year.year}`))).size;
    const currentDate = new Date();
    const firstUploadByBl = archiveData.reduce((carry, year) => {
        year.documents.forEach((doc) => {
            if (doc.uploader?.id !== user?.id) {
                return;
            }

            const key = `${doc.bl_no}|${doc.type}|${year.year}`;
            const uploadedDate = new Date(doc.uploaded_at);

            if (Number.isNaN(uploadedDate.getTime())) {
                return;
            }

            const existingDate = carry.get(key);

            if (!existingDate || uploadedDate < existingDate) {
                carry.set(key, uploadedDate);
            }
        });

        return carry;
    }, new Map<string, Date>());
    const thisMonthBLsAdded = Array.from(firstUploadByBl.values()).filter((uploadedDate) =>
        uploadedDate.getMonth() === currentDate.getMonth() && uploadedDate.getFullYear() === currentDate.getFullYear(),
    ).length;
    const totalStorageBytes = archiveData.reduce(
        (sum, year) => sum + year.documents.reduce((docsSum, doc) => docsSum + (doc.size_bytes ?? 0), 0),
        0,
    );

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
    };

    const archiveHealthLabel = uniqueBLs === 0
        ? 'No archived BLs yet'
        : globalPct === 100
            ? 'All BLs complete'
            : incompleteBLs === 1
                ? '1 BL needs documents'
                : `${incompleteBLs.toLocaleString()} BLs need documents`;

    if (!activeSection) {
        return <Navigate to={appRoutes.encoderRecordsArchive} replace />;
    }

    return (
        <div className="w-full pb-12">
            <div hidden={activeSection !== 'legacyUpload'}>
                <LegacyFolderUploadView
                    onOpenBatches={() => {
                        setResumeBatchId(null);
                        setIsLegacyBatchesMounted(true);
                        navigate(appRoutes.encoderLegacyBatches);
                    }}
                    resumeBatchId={resumeBatchId}
                    onResumeCleared={() => setResumeBatchId(null)}
                />
            </div>

            {shouldMountLegacyBatches && (
                <div hidden={activeSection !== 'legacyBatches'}>
                    <LegacyBatchesPage
                        onResumeBatch={(batchId) => {
                            setResumeBatchId(batchId);
                            navigate(appRoutes.encoderLegacyFolderUpload);
                        }}
                    />
                </div>
            )}

            {activeSection === 'archive' && (
                <ArchiveWorkspace
                    archiveData={archiveData}
                    isLoading={isLoading}
                    isError={isError}
                    queryKey={archiveKeys.mine(user?.id ?? null)}
                    pageDescription="Search your uploaded import and export records, review document gaps, and add archived BL files."
                    controlTitle="My archive workspace"
                    healthLabel={archiveHealthLabel}
                    healthTone={incompleteBLs > 0 ? 'danger' : 'good'}
                    metrics={[
                        { label: 'BL Records', value: uniqueBLs.toLocaleString(), tone: 'text-text-primary' },
                        { label: 'Incomplete BLs', value: incompleteBLs.toLocaleString(), tone: incompleteBLs > 0 ? 'text-red-500' : 'text-emerald-600' },
                        { label: 'Files Uploaded', value: totalMyUploads.toLocaleString(), tone: 'text-teal-500' },
                        { label: 'BLs Added This Month', value: thisMonthBLsAdded.toLocaleString(), tone: 'text-orange-500' },
                        { label: 'Storage Used', value: formatBytes(totalStorageBytes), tone: 'text-text-primary' },
                    ]}
                    searchPlaceholder="Search BL number, client, or vessel..."
                    documentViewTitle="My BL Records"
                    showAuditButton={false}
                    canDeleteDocument={(doc, userId) => doc.uploader?.id === userId}
                    canReplaceDocument={(doc, userId) => doc.uploader?.id === userId}
                />
            )}
        </div>
    );
};
