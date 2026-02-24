import api from '../../../lib/axios';
import type { User, CreateUserData, UpdateUserData } from '../types/user.types';

export const userApi = {
    // Get all users
    async getUsers(): Promise<{ data: User[] }> {
        const response = await api.get('/api/users');
        return response.data;
    },

    // Get single user
    async getUser(id: number): Promise<{ data: User }> {
        const response = await api.get(`/api/users/${id}`);
        return response.data;
    },

    // Create a new user
    async createUser(data: CreateUserData): Promise<{ data: User }> {
        const response = await api.post('/api/users', data);
        return response.data;
    },

    // Update a user
    async updateUser(id: number, data: UpdateUserData): Promise<{ data: User }> {
        const response = await api.put(`/api/users/${id}`, data);
        return response.data;
    },

    // Deactivate a user
    async deactivateUser(id: number): Promise<{ data: User }> {
        const response = await api.post(`/api/users/${id}/deactivate`);
        return response.data;
    },

    // Activate a user
    async activateUser(id: number): Promise<{ data: User }> {
        const response = await api.post(`/api/users/${id}/activate`);
        return response.data;
    },
};
