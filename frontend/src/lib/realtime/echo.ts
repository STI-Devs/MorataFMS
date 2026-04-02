import type Echo from 'laravel-echo';
import LaravelEcho from 'laravel-echo';
import Pusher from 'pusher-js';
import api from '../axios';
import { isTransactionSyncEnabled } from './transactionSync';

declare global {
    interface Window {
        Pusher?: typeof Pusher;
    }
}

let echoInstance: Echo<'reverb'> | null = null;
let apiInterceptorId: number | null = null;
const channelReferences = new Map<string, number>();

function getConfiguredPort(rawPort: string | number | undefined, fallback: number): number {
    const parsedPort = Number(rawPort);

    return Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : fallback;
}

function createEchoInstance(): Echo<'reverb'> {
    window.Pusher = Pusher;

    const instance = new LaravelEcho({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
        wsPort: getConfiguredPort(import.meta.env.VITE_REVERB_PORT, 80),
        wssPort: getConfiguredPort(import.meta.env.VITE_REVERB_PORT, 443),
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
        authorizer: (channel) => ({
            authorize: (socketId, callback) => {
                api.post('/api/broadcasting/auth', {
                    socket_id: socketId,
                    channel_name: channel.name,
                })
                    .then((response) => {
                        callback(null, response.data);
                    })
                    .catch((error: unknown) => {
                        callback(
                            error instanceof Error ? error : new Error('Broadcast authentication failed.'),
                            null,
                        );
                    });
            },
        }),
        withoutInterceptors: true,
    });

    apiInterceptorId = api.interceptors.request.use((config) => {
        const socketId = instance.socketId();

        if (socketId) {
            config.headers['X-Socket-Id'] = socketId;
        }

        return config;
    });

    return instance;
}

export function getEcho(): Echo<'reverb'> | null {
    if (typeof window === 'undefined' || !isTransactionSyncEnabled()) {
        return null;
    }

    if (!echoInstance) {
        echoInstance = createEchoInstance();
    }

    return echoInstance;
}

export function acquirePrivateChannel(channelName: string) {
    const echo = getEcho();

    if (!echo) {
        return null;
    }

    channelReferences.set(channelName, (channelReferences.get(channelName) ?? 0) + 1);

    return echo.private(channelName);
}

export function releasePrivateChannel(channelName: string): void {
    if (!echoInstance) {
        return;
    }

    const remainingReferences = (channelReferences.get(channelName) ?? 0) - 1;

    if (remainingReferences > 0) {
        channelReferences.set(channelName, remainingReferences);

        return;
    }

    channelReferences.delete(channelName);
    echoInstance.leave(channelName);
}

export function disconnectEcho(): void {
    if (!echoInstance) {
        return;
    }

    echoInstance.leaveAllChannels();
    echoInstance.disconnect();
    echoInstance = null;
    channelReferences.clear();

    if (apiInterceptorId !== null) {
        api.interceptors.request.eject(apiInterceptorId);
        apiInterceptorId = null;
    }
}
