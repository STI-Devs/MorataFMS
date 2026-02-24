import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
    withCredentials: true,
    withXSRFToken: true
});

// Global 401 interceptor: redirect to login on session expiry
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const message: string = error.response?.data?.message ?? '';

        // 401 = Sanctum session expired/invalid ("Unauthenticated.")
        // 419 = CSRF token mismatch (Page Expired)
        // Guard: only act on genuine auth failures, not misused 401s from custom code
        const isSessionExpired =
            (status === 401 && message.toLowerCase().includes('unauthenticated')) ||
            status === 419;

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
