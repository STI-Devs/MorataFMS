import api from '../../../lib/axios';
import type { ApiClient, ApiCountry, ApiLocationOfGoods } from '../types';

export const referenceApi = {
    getClients: async (type?: 'importer' | 'exporter'): Promise<ApiClient[]> => {
        const response = await api.get('/api/brokerage-clients', {
            params: type ? { type } : undefined,
        });
        return response.data.data;
    },

    getCountries: async (type?: 'import_origin' | 'export_destination'): Promise<ApiCountry[]> => {
        const response = await api.get('/api/countries', {
            params: type ? { type } : undefined,
        });
        return response.data.data;
    },

    getLocationsOfGoods: async (): Promise<ApiLocationOfGoods[]> => {
        const response = await api.get('/api/locations-of-goods');
        return response.data.data;
    },

    createClient: async (data: { name: string; type: 'importer' | 'exporter' | 'both' }): Promise<ApiClient> => {
        const response = await api.post('/api/brokerage-clients', data);
        return response.data.data;
    },
};
