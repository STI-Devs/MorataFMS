import { afterEach, describe, expect, it, vi } from 'vitest';
import api from './axios';

const originalAdapter = api.defaults.adapter;

afterEach(() => {
    api.defaults.adapter = originalAdapter;
});

describe('api axios client', () => {
    it('enables credentialed cookie auth for Sanctum SPA requests', () => {
        expect(api.defaults.withCredentials).toBe(true);
        expect(api.defaults.withXSRFToken).toBe(true);
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

    it('dispatches auth:unauthorized for csrf mismatch responses outside auth routes', async () => {
        const listener = vi.fn();
        const adapter = vi.fn(async (config) => Promise.reject({
            response: {
                status: 419,
                data: {
                    message: 'CSRF token mismatch.',
                },
            },
            config,
        }));

        window.addEventListener('auth:unauthorized', listener as EventListener);
        api.defaults.adapter = adapter;

        await expect(api.get('/api/user')).rejects.toMatchObject({
            response: {
                status: 419,
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

    it('does not dispatch auth:unauthorized for sanctum csrf bootstrap failures', async () => {
        const listener = vi.fn();
        const adapter = vi.fn(async (config) => Promise.reject({
            response: {
                status: 419,
                data: {
                    message: 'CSRF token mismatch.',
                },
            },
            config,
        }));

        window.addEventListener('auth:unauthorized', listener as EventListener);
        api.defaults.adapter = adapter;

        await expect(api.get('/sanctum/csrf-cookie')).rejects.toMatchObject({
            response: {
                status: 419,
            },
        });

        expect(listener).not.toHaveBeenCalled();

        window.removeEventListener('auth:unauthorized', listener as EventListener);
    });
});
