import { ArchiveWorkspace } from '../workspace/ArchiveWorkspace';
import { useArchives } from '../../hooks/useArchives';
import { computeGlobalCompleteness, countIncompleteBLs } from '../../utils/archive.utils';
import { archiveKeys } from '../../utils/archiveQueryKeys';

export const ArchivesPage = () => {
    const { data: archiveData = [], isLoading, isError } = useArchives();

    const globalPct = computeGlobalCompleteness(archiveData);
    const incompleteBLs = countIncompleteBLs(archiveData);
    const totalBLs = new Set(archiveData.flatMap(y => y.documents.map(d => `${d.bl_no}|${d.type}|${y.year}`))).size;
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

    const healthLabel = totalBLs === 0
        ? 'No archived BLs yet'
        : globalPct === 100
            ? 'All BLs complete'
            : `${incompleteBLs.toLocaleString()} BL${incompleteBLs === 1 ? '' : 's'} need documents`;

    return (
        <ArchiveWorkspace
            archiveData={archiveData}
            isLoading={isLoading}
            isError={isError}
            queryKey={archiveKeys.all}
            pageDescription="Search preserved import and export records, review document gaps, and upload archived BL files."
            controlTitle="Brokerage records workspace"
            healthLabel={healthLabel}
            healthTone={incompleteBLs > 0 ? 'danger' : 'good'}
            metrics={[
                { label: 'Completion', value: `${isLoading ? 0 : globalPct}%`, tone: incompleteBLs > 0 ? 'text-red-500' : 'text-emerald-500' },
                { label: 'BL Records', value: totalBLs.toLocaleString(), tone: 'text-text-primary' },
                { label: 'Incomplete', value: incompleteBLs.toLocaleString(), tone: incompleteBLs > 0 ? 'text-red-500' : 'text-emerald-500' },
                { label: 'Storage', value: formatBytes(totalStorageBytes), tone: 'text-text-primary' },
            ]}
            searchPlaceholder="Search BL number, client, or vessel..."
            documentViewTitle="All BL Records"
            showAuditButton
        />
    );
};
