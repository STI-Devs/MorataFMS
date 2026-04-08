import api from '../../../lib/axios';
import type { AuthResponse, LoginCredentials, User } from '../types/auth.types';

export class InvalidCurrentUserPayloadError extends Error {
    public constructor(message = 'Invalid current user payload.') {
        super(message);
        this.name = 'InvalidCurrentUserPayloadError';
    }
}

function isUserPayload(value: unknown): value is User {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const candidate = value as Partial<User>;

    return (
        typeof candidate.id === 'number'
        && typeof candidate.email === 'string'
        && typeof candidate.role === 'string'
    );
}

function unwrapUserPayload(payload: unknown, error: Error): User {
    if (!isUserPayload(payload)) {
        throw error;
    }

    return payload;
}

export const authApi = {
    async getCsrfCookie(): Promise<void> {
        await api.get('/sanctum/csrf-cookie');
    },

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        await this.getCsrfCookie();

        const response = await api.post<{ user: { data: User } | User }>(
            `/api/auth/login`,
            credentials
        );

        return {
            user: unwrapUserPayload(
                (response.data.user as { data?: unknown }).data ?? response.data.user,
                new Error('Invalid login payload.'),
            ),
        };
    },

    async logout(): Promise<void> {
        await api.post(`/api/auth/logout`);
    },

    async getCurrentUser(): Promise<User> {
        const response = await api.get<{ data: User } | User>(`/api/user`);
        const payload = (response.data as { data?: unknown }).data ?? response.data;

        return unwrapUserPayload(payload, new InvalidCurrentUserPayloadError());
    },

    async updateProfile(payload: { name?: string; job_title?: string | null; password?: string; password_confirmation?: string }): Promise<User> {
        const response = await api.put<{ data: User } | User>(`/api/user/profile`, payload);
        return unwrapUserPayload(
            (response.data as { data?: unknown }).data ?? response.data,
            new Error('Invalid profile payload.'),
        );
    },
};
