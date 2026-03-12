import api from '../../../lib/axios';
import type { AuthResponse, LoginCredentials, User } from '../types/auth.types';

export const authApi = {
    // Get CSRF cookie (required before login)
    async getCsrfCookie(): Promise<void> {
        await api.get('/sanctum/csrf-cookie');
    },

    // Login user
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        await this.getCsrfCookie();

        const response = await api.post<{ user: { data: User } }>(
            `/api/auth/login`,
            credentials
        );
        // UserResource wraps in { data: ... } — unwrap so AuthContext gets a plain User
        return { user: response.data.user.data ?? response.data.user as unknown as User };
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

    // Update profile (name and/or password)
    async updateProfile(payload: { name?: string; password?: string; password_confirmation?: string }): Promise<User> {
        // Typically returns UserResource — unwrap { data: User } if present
        const response = await api.put<{ data: User } | User>(`/api/user/profile`, payload);
        return (response.data as { data: User }).data ?? (response.data as User);
    },
};
