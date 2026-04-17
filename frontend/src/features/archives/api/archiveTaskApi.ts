import api from '../../../lib/axios';
import type { ArchiveTaskQueueResponse } from '../types/archiveTask.types';

type UpdateArchiveStageApplicabilityPayload = {
    stage: string;
    not_applicable: boolean;
};

export const archiveTaskApi = {
    getOperationalQueue: async (): Promise<ArchiveTaskQueueResponse> => {
        const response = await api.get('/api/archives/operational');
        return response.data;
    },
    updateImportStageApplicability: async (
        id: number,
        payload: UpdateArchiveStageApplicabilityPayload,
    ) => {
        const response = await api.patch(`/api/archives/import/${id}/stage-applicability`, payload);
        return response.data;
    },
    updateExportStageApplicability: async (
        id: number,
        payload: UpdateArchiveStageApplicabilityPayload,
    ) => {
        const response = await api.patch(`/api/archives/export/${id}/stage-applicability`, payload);
        return response.data;
    },
};
