import api from '../../../lib/axios';
import type { AuthResponse, LoginCredentials, User } from '../types/auth.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const authApi = {
    // Get CSRF cookie (required before login)
    async getCsrfCookie(): Promise<void> {
        await api.get(`${API_URL}/sanctum/csrf-cookie`);
    },

    // Login user
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        // Get CSRF cookie first
        await this.getCsrfCookie();

        const response = await api.post<AuthResponse>(
            `/api/auth/login`,
            credentials
        );
        return response.data;
    },

    // Logout user
    async logout(): Promise<void> {
        await api.post(`/api/auth/logout`);
    },

    // Get current user
    async getCurrentUser(): Promise<User> {
        const response = await api.get<User>(`/api/user`);
        return response.data;
    },
};
