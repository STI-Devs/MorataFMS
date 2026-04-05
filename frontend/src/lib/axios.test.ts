import { AxiosHeaders } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearAuthToken, setAuthToken } from '../features/auth/utils/tokenStorage';
import api from './axios';

const originalAdapter = api.defaults.adapter;

afterEach(() => {
    clearAuthToken();
    api.defaults.adapter = originalAdapter;
});

describe('api axios client', () => {
    it('attaches the bearer token from sessionStorage to outgoing requests', async () => {
        setAuthToken('frontend-session-token');

        const adapter = vi.fn(async (config) => ({
            data: {},
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
        }));

        api.defaults.adapter = adapter;

        await api.get('/api/user');

        const requestConfig = adapter.mock.calls[0][0];
        const authorization = AxiosHeaders.from(requestConfig.headers).get('Authorization');

        expect(authorization).toBe('Bearer frontend-session-token');
    });

    it('dispatches auth:unauthorized for non-auth unauthenticated responses', async () => {
        const listener = vi.fn();
        const adapter = vi.fn(async (config) => Promise.reject({
            response: {
                status: 401,
                data: {
                    message: 'Unauthenticated.',
                },
            },
            config,
        }));

        window.addEventListener('auth:unauthorized', listener as EventListener);
        api.defaults.adapter = adapter;

        await expect(api.get('/api/user')).rejects.toMatchObject({
            response: {
                status: 401,
            },
        });

        expect(listener).toHaveBeenCalledTimes(1);

        window.removeEventListener('auth:unauthorized', listener as EventListener);
    });

    it('does not dispatch auth:unauthorized for auth endpoint failures', async () => {
        const listener = vi.fn();
        const adapter = vi.fn(async (config) => Promise.reject({
            response: {
                status: 401,
                data: {
                    message: 'Unauthenticated.',
                },
            },
            config,
        }));

        window.addEventListener('auth:unauthorized', listener as EventListener);
        api.defaults.adapter = adapter;

        await expect(api.post('/api/auth/logout')).rejects.toMatchObject({
            response: {
                status: 401,
            },
        });

        expect(listener).not.toHaveBeenCalled();

        window.removeEventListener('auth:unauthorized', listener as EventListener);
    });
});
