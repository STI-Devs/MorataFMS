import api from '../../../lib/axios';
import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from '../types/auth.types';



export const authApi = {
    // Get CSRF cookie (required before login/register)
    async getCsrfCookie(): Promise<void> {
        await api.get('/sanctum/csrf-cookie');
    },

    // Login user
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        await this.getCsrfCookie();

        const response = await api.post<AuthResponse>(
            `/api/auth/login`,
            credentials
        );
        return response.data;
    },

    // Register user
    async register(credentials: RegisterCredentials): Promise<AuthResponse> {
        await this.getCsrfCookie();

        const response = await api.post<AuthResponse>(
            `/api/auth/register`,
            credentials
        );
        return response.data;
    },

    // Logout user
    async logout(): Promise<void> {
        await api.post(`/api/auth/logout`);
    },

    // Get current user — backend returns { data: User }
    async getCurrentUser(): Promise<{ data: User }> {
        const response = await api.get<{ data: User }>(`/api/user`);
        return response.data;
    },
};
