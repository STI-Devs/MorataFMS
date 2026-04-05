import axios, { AxiosHeaders } from 'axios';
import { getAuthToken } from '../features/auth/utils/tokenStorage';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const headers = AxiosHeaders.from(config.headers);
    const token = getAuthToken();

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    } else {
        headers.delete('Authorization');
    }

    config.headers = headers;

    return config;
});

// Global 401 interceptor: redirect to login on expired bearer token.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const message: string = error.response?.data?.message ?? '';
        const isSessionExpired =
            status === 401 && message.toLowerCase().includes('unauthenticated');

        if (isSessionExpired) {
            const url = error.config?.url || '';
            const isAuthRoute = url.includes('/auth/');

            if (!isAuthRoute) {
                window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            }
        }

        return Promise.reject(error);
    }
);

export default api;
