import api from '../../../lib/axios';
import type {
    CreateLocationOfGoodsData,
    LocationOfGoods,
    UpdateLocationOfGoodsData,
} from '../types/locationOfGoods.types';

export const locationOfGoodsApi = {
    async getLocationsOfGoods(): Promise<{ data: LocationOfGoods[] }> {
        const response = await api.get('/api/locations-of-goods', {
            params: { include_inactive: 1 },
        });

        return response.data;
    },

    async createLocationOfGoods(data: CreateLocationOfGoodsData): Promise<{ data: LocationOfGoods }> {
        const response = await api.post('/api/locations-of-goods', data);

        return response.data;
    },

    async updateLocationOfGoods(id: number, data: UpdateLocationOfGoodsData): Promise<{ data: LocationOfGoods }> {
        const response = await api.put(`/api/locations-of-goods/${id}`, data);

        return response.data;
    },

    async toggleActiveLocationOfGoods(id: number): Promise<{ data: LocationOfGoods }> {
        const response = await api.post(`/api/locations-of-goods/${id}/toggle-active`);

        return response.data;
    },
};
