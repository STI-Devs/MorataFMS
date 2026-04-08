import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
    withCredentials: true,
    withXSRFToken: true,
});

// Global 401/419 interceptor: redirect to login on expired or invalid sessions.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const message: string = error.response?.data?.message ?? '';
        const isSessionExpired =
            (status === 401 && message.toLowerCase().includes('unauthenticated'))
            || status === 419;

        if (isSessionExpired) {
            const url = error.config?.url || '';
            const isAuthRoute = url.includes('/auth/') || url.includes('/sanctum/');

            if (!isAuthRoute) {
                window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            }
        }

        return Promise.reject(error);
    }
);

export default api;
