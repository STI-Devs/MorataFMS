import { useDeferredValue, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { trackingApi } from '../../tracking/api/trackingApi';
import { archiveTaskApi } from '../api/archiveTaskApi';
import { useArchiveOperationalQueue } from './useArchiveOperationalQueue';
import {
    EMPTY_ARCHIVE_TASK_RECORDS,
    SECTION_ORDER,
    documentableTypeFor,
    stageLabelFor,
} from '../utils/archiveTask.utils';
import { archiveTaskKeys } from '../utils/archiveTaskQueryKeys';
import type {
    ArchiveTaskQueueStatus,
    ArchiveTaskRecord,
    ArchiveTaskRole,
} from '../types/archiveTask.types';

export type ArchiveTaskTypeFilter = 'all' | 'import' | 'export';

export function useArchiveTaskWorkspace(role: ArchiveTaskRole) {
    const queryClient = useQueryClient();
    const { data, isLoading, isError } = useArchiveOperationalQueue(role);

    const [search, setSearch] = useState('');
    const [onlyMyAction, setOnlyMyAction] = useState(false);
    const [typeFilter, setTypeFilter] = useState<ArchiveTaskTypeFilter>(role === 'processor' ? 'import' : 'all');
    const [periodFilter, setPeriodFilter] = useState<'all' | string>('all');
    const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
    const [selectedUploadStage, setSelectedUploadStage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [applicabilityStageKey, setApplicabilityStageKey] = useState<string | null>(null);

    const deferredSearch = useDeferredValue(search);
    const allRecords = data?.data ?? EMPTY_ARCHIVE_TASK_RECORDS;

    const filteredRecords = useMemo(() => {
        const term = deferredSearch.trim().toLowerCase();

        return allRecords.filter((record) => {
            if (role === 'processor' && typeFilter !== record.type) {
                return false;
            }

            if (role === 'accounting' && typeFilter !== 'all' && typeFilter !== record.type) {
                return false;
            }

            if (periodFilter !== 'all' && record.archive_period.label !== periodFilter) {
                return false;
            }

            if (onlyMyAction && record.queue_status !== 'needs_my_upload') {
                return false;
            }

            if (!term) {
                return true;
            }

            return [
                record.reference,
                record.bl_no,
                record.client_name ?? '',
                record.vessel_name ?? '',
                record.origin_country ?? '',
                record.location_of_goods ?? '',
            ]
                .join(' ')
                .toLowerCase()
                .includes(term);
        });
    }, [allRecords, deferredSearch, onlyMyAction, periodFilter, role, typeFilter]);

    const selectedRecord = useMemo(
        () => filteredRecords.find((record) => record.id === selectedRecordId)
            ?? allRecords.find((record) => record.id === selectedRecordId)
            ?? null,
        [allRecords, filteredRecords, selectedRecordId],
    );

    const summary = useMemo(() => ({
        needs_my_upload: filteredRecords.filter((record) => record.queue_status === 'needs_my_upload').length,
        waiting_on_others: filteredRecords.filter((record) => record.queue_status === 'waiting_on_others').length,
        completed_by_me: filteredRecords.filter((record) => record.queue_status === 'completed_by_me').length,
        shared_records: filteredRecords.length,
    }), [filteredRecords]);

    const periodOptions = useMemo(
        () => Array.from(
            new Set(
                allRecords
                    .map((record) => record.archive_period.label)
                    .filter((period): period is string => typeof period === 'string' && period.length > 0),
            ),
        ).sort().reverse(),
        [allRecords],
    );

    const recordsBySection = useMemo(
        () => Object.fromEntries(
            SECTION_ORDER.map((status) => [
                status,
                filteredRecords.filter((record) => record.queue_status === status),
            ]),
        ) as Record<ArchiveTaskQueueStatus, ArchiveTaskRecord[]>,
        [filteredRecords],
    );

    const handleUpload = async (files: File[]) => {
        if (!selectedRecord || !selectedUploadStage) {
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            await trackingApi.uploadDocuments({
                files,
                type: selectedUploadStage,
                documentable_type: documentableTypeFor(selectedRecord),
                documentable_id: selectedRecord.id,
            });

            await queryClient.invalidateQueries({
                queryKey: archiveTaskKeys.operational(role),
            });
            setSelectedUploadStage(null);
            toast.success('Archive documents uploaded successfully.');
        } catch (error) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
                ?? (error instanceof Error ? error.message : 'Upload failed. Please try again.');

            setUploadError(message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleStageApplicabilityChange = async (
        record: ArchiveTaskRecord,
        stage: string,
        notApplicable: boolean,
    ) => {
        const nextStageKey = `${record.id}:${stage}`;
        setApplicabilityStageKey(nextStageKey);

        try {
            if (record.type === 'import') {
                await archiveTaskApi.updateImportStageApplicability(record.id, {
                    stage,
                    not_applicable: notApplicable,
                });
            } else {
                await archiveTaskApi.updateExportStageApplicability(record.id, {
                    stage,
                    not_applicable: notApplicable,
                });
            }

            await queryClient.invalidateQueries({
                queryKey: archiveTaskKeys.operational(role),
            });
            toast.success(
                notApplicable
                    ? `${stageLabelFor(record, stage)} marked as not applicable.`
                    : `${stageLabelFor(record, stage)} restored to required.`,
            );
        } catch (error) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message
                ?? (error instanceof Error ? error.message : 'Failed to update the archive stage.');

            toast.error(message);
        } finally {
            setApplicabilityStageKey(null);
        }
    };

    const closeUploadModal = () => {
        setSelectedUploadStage(null);
        setUploadError(null);
    };

    const closeDrawer = () => setSelectedRecordId(null);

    return {
        // query state
        isLoading,
        isError,
        // filter state
        search,
        setSearch,
        onlyMyAction,
        setOnlyMyAction,
        typeFilter,
        setTypeFilter,
        periodFilter,
        setPeriodFilter,
        // selection state
        selectedRecord,
        setSelectedRecordId,
        selectedUploadStage,
        setSelectedUploadStage,
        // upload state
        isUploading,
        uploadError,
        applicabilityStageKey,
        // derived
        filteredRecords,
        recordsBySection,
        summary,
        periodOptions,
        // handlers
        handleUpload,
        handleStageApplicabilityChange,
        closeUploadModal,
        closeDrawer,
    };
}
