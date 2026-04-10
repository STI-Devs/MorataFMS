import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionSyncProvider } from './TransactionSyncContext';
import { trackingKeys } from '../features/tracking/utils/queryKeys';
import { renderWithProviders } from '../test/renderWithProviders';
import type { TransactionSyncPayload } from '../lib/realtime/transactionSync';

type Listener = (payload: TransactionSyncPayload) => void;

const mockUseAuth = vi.fn();
const mockDisconnectEcho = vi.fn();
const mockReleasePrivateChannel = vi.fn();
const channelRegistry = new Map<
    string,
    {
        listeners: Map<string, Set<Listener>>;
        channel: {
            listen: (event: string, callback: Listener) => unknown;
            stopListening: (event: string, callback?: Listener) => unknown;
        };
    }
>();

function getChannel(channelName: string) {
    const existing = channelRegistry.get(channelName);

    if (existing) {
        return existing;
    }

    const listeners = new Map<string, Set<Listener>>();
    const channel = {
        listen: vi.fn((event: string, callback: Listener) => {
            const callbacks = listeners.get(event) ?? new Set<Listener>();
            callbacks.add(callback);
            listeners.set(event, callbacks);

            return channel;
        }),
        stopListening: vi.fn((event: string, callback?: Listener) => {
            if (!callback) {
                listeners.delete(event);

                return channel;
            }

            listeners.get(event)?.delete(callback);

            return channel;
        }),
    };

    const record = { listeners, channel };
    channelRegistry.set(channelName, record);

    return record;
}

function emit(channelName: string, eventName: string, payload: TransactionSyncPayload): void {
    const callbacks = channelRegistry.get(channelName)?.listeners.get(eventName);

    callbacks?.forEach((callback) => callback(payload));
}

const mockAcquirePrivateChannel = vi.fn((channelName: string) => getChannel(channelName).channel);

vi.mock('../features/auth', () => ({
    useAuth: () => mockUseAuth(),
}));

vi.mock('../lib/realtime/echo', () => ({
    acquirePrivateChannel: (channelName: string) => mockAcquirePrivateChannel(channelName),
    releasePrivateChannel: (channelName: string) => mockReleasePrivateChannel(channelName),
    disconnectEcho: () => mockDisconnectEcho(),
}));

describe('TransactionSyncProvider', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubEnv('VITE_REVERB_APP_KEY', 'test-reverb-key');
        vi.stubEnv('VITE_TRANSACTION_SYNC_ENABLED', 'true');
        channelRegistry.clear();
        mockAcquirePrivateChannel.mockClear();
        mockDisconnectEcho.mockClear();
        mockReleasePrivateChannel.mockClear();
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
            user: {
                id: 9,
                role: 'admin',
            },
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it('invalidates transaction list keys for incoming remark events', async () => {
        const { queryClient } = renderWithProviders(
            <TransactionSyncProvider>
                <div>provider test</div>
            </TransactionSyncProvider>,
        );

        const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);

        emit('transactions.user.9', '.transaction.remark.changed', {
            event_type: 'remark_created',
            transaction_type: 'import',
            transaction_id: 42,
            reference: 'IMP-2026-001',
            status: 'Processing',
            is_archive: false,
            assigned_user_id: 17,
            actor_id: 5,
            occurred_at: '2026-03-26T02:30:00+08:00',
        });

        act(() => {
            vi.advanceTimersByTime(250);
        });

        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: trackingKeys.imports.all });
        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin', 'transactions'] });
        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['remarks', 'import', 42] });
        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-document-review'] });
    });

    it('invalidates archive and review keys for archive events', async () => {
        const { queryClient } = renderWithProviders(
            <TransactionSyncProvider>
                <div>provider test</div>
            </TransactionSyncProvider>,
        );

        const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);

        emit('transactions.user.9', '.transaction.changed', {
            event_type: 'archived',
            transaction_type: 'export',
            transaction_id: 73,
            reference: 'EXP-0073',
            status: 'Completed',
            is_archive: true,
            assigned_user_id: 18,
            actor_id: 4,
            occurred_at: '2026-03-26T02:32:00+08:00',
        });

        act(() => {
            vi.advanceTimersByTime(250);
        });

        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: trackingKeys.exports.all });
        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: trackingKeys.documents.transactions() });
        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin-document-review'] });
        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['archives'] });
        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['my-archives'] });
    });

    it('disconnects and avoids subscribing when transaction sync is disabled', () => {
        vi.stubEnv('VITE_TRANSACTION_SYNC_ENABLED', 'false');

        renderWithProviders(
            <TransactionSyncProvider>
                <div>provider test</div>
            </TransactionSyncProvider>,
        );

        expect(mockDisconnectEcho).toHaveBeenCalled();
        expect(mockAcquirePrivateChannel).not.toHaveBeenCalled();
    });

    it('coalesces duplicate list invalidations during a burst of transaction events', async () => {
        const { queryClient } = renderWithProviders(
            <TransactionSyncProvider>
                <div>provider test</div>
            </TransactionSyncProvider>,
        );

        const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);

        const payload = {
            event_type: 'updated',
            transaction_type: 'import',
            transaction_id: 42,
            reference: 'IMP-2026-001',
            status: 'Processing',
            is_archive: false,
            assigned_user_id: 17,
            actor_id: 5,
            occurred_at: '2026-03-26T02:30:00+08:00',
        } satisfies TransactionSyncPayload;

        emit('transactions.user.9', '.transaction.changed', payload);
        emit('transactions.user.9', '.transaction.changed', {
            ...payload,
            transaction_id: 43,
            reference: 'IMP-2026-002',
            occurred_at: '2026-03-26T02:30:01+08:00',
        });

        act(() => {
            vi.advanceTimersByTime(250);
        });

        expect(invalidateQueries).toHaveBeenCalledTimes(2);
        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: trackingKeys.imports.all });
        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin', 'transactions'] });
    });
});
