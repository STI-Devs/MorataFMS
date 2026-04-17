import api from '../../../lib/axios';
import type { Country, CreateCountryData, UpdateCountryData } from '../types/country.types';

export const countryApi = {
    async getCountries(): Promise<{ data: Country[] }> {
        const response = await api.get('/api/countries', {
            params: { include_inactive: 1 },
        });

        return response.data;
    },

    async createCountry(data: CreateCountryData): Promise<{ data: Country }> {
        const response = await api.post('/api/countries', data);

        return response.data;
    },

    async updateCountry(id: number, data: UpdateCountryData): Promise<{ data: Country }> {
        const response = await api.put(`/api/countries/${id}`, data);

        return response.data;
    },

    async toggleActiveCountry(id: number): Promise<{ data: Country }> {
        const response = await api.post(`/api/countries/${id}/toggle-active`);

        return response.data;
    },
};
