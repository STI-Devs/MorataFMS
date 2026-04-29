import api from '../../../lib/axios';
import type { EncoderDashboardResponse } from '../types/encoderDashboard.types';

export const encoderDashboardApi = {
    async fetchDashboard(): Promise<EncoderDashboardResponse> {
        const response = await api.get('/api/encoder/dashboard');
        return response.data;
    },
};
