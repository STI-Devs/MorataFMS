import api from '../../../lib/axios';
import type { Client, CreateClientData, UpdateClientData, ClientTransactionHistory } from '../types/client.types';

export const clientApi = {
    // Get all clients
    async getClients(): Promise<{ data: Client[] }> {
        const response = await api.get('/api/clients');
        return response.data;
    },

    // Get single client
    async getClient(id: number): Promise<{ data: Client }> {
        const response = await api.get(`/api/clients/${id}`);
        return response.data;
    },

    // Create a new client
    async createClient(data: CreateClientData): Promise<{ data: Client }> {
        const response = await api.post('/api/clients', data);
        return response.data;
    },

    // Update a client
    async updateClient(id: number, data: UpdateClientData): Promise<{ data: Client }> {
        const response = await api.put(`/api/clients/${id}`, data);
        return response.data;
    },

    // Toggle active status
    async toggleActiveClient(id: number): Promise<{ data: Client }> {
        const response = await api.post(`/api/clients/${id}/toggle-active`);
        return response.data;
    },

    // Get client transaction history
    async getClientTransactions(id: number): Promise<ClientTransactionHistory> {
        const response = await api.get(`/api/clients/${id}/transactions`);
        return response.data;
    },
};
