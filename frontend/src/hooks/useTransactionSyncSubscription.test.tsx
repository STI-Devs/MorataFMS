import { waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { trackingKeys } from '../features/tracking/utils/queryKeys';
import type { TransactionSyncPayload } from '../lib/realtime/transactionSync';
import { renderWithProviders } from '../test/renderWithProviders';
import { useTransactionSyncSubscription } from './useTransactionSyncSubscription';

type Listener = (payload: TransactionSyncPayload) => void;

const mockUseAuth = vi.fn();
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
}));

vi.mock('sonner', () => ({
    toast: {
        info: vi.fn(),
    },
}));

function SubscriptionProbe() {
    useTransactionSyncSubscription({
        type: 'import',
        id: 42,
        reference: 'IMP-2026-001',
    });

    return <div>subscription test</div>;
}

describe('useTransactionSyncSubscription', () => {
    beforeEach(() => {
        vi.stubEnv('VITE_REVERB_APP_KEY', 'test-reverb-key');
        vi.stubEnv('VITE_TRANSACTION_SYNC_ENABLED', 'true');
        channelRegistry.clear();
        mockAcquirePrivateChannel.mockClear();
        mockReleasePrivateChannel.mockClear();
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
            user: {
                id: 7,
                role: 'encoder',
            },
        });
        vi.mocked(toast.info).mockClear();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it('invalidates active transaction detail keys and shows a remark-specific toast for cross-user updates', async () => {
        const { queryClient } = renderWithProviders(<SubscriptionProbe />);
        const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);

        emit('transactions.import.42', '.transaction.remark.changed', {
            event_type: 'remark_created',
            transaction_type: 'import',
            transaction_id: 42,
            reference: 'IMP-2026-001',
            status: 'Processing',
            is_archive: false,
            assigned_user_id: 7,
            actor_id: 99,
            occurred_at: '2026-03-26T02:35:00+08:00',
        });

        await waitFor(() => {
            expect(invalidateQueries).toHaveBeenCalledWith({
                queryKey: trackingKeys.detail('IMP-2026-001', 'tracking'),
            });
        });

        expect(invalidateQueries).toHaveBeenCalledWith({
            queryKey: trackingKeys.detail('IMP-2026-001', 'record'),
        });
        expect(invalidateQueries).toHaveBeenCalledWith({
            queryKey: trackingKeys.documents.list('App\\Models\\ImportTransaction', 42),
        });
        expect(invalidateQueries).toHaveBeenCalledWith({
            queryKey: ['documents', 'import', 42],
        });
        expect(invalidateQueries).toHaveBeenCalledWith({
            queryKey: ['admin-document-review', 'detail', 'import', 42],
        });
        expect(invalidateQueries).toHaveBeenCalledWith({
            queryKey: ['remarks', 'import', 42],
        });
        expect(toast.info).toHaveBeenCalledWith('A new remark was added to this transaction.');
    });

    it('does not react to unrelated channels and shows a specific reassignment toast before unsubscribing', async () => {
        const { queryClient } = renderWithProviders(<SubscriptionProbe />);
        const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined);

        emit('transactions.import.999', '.transaction.changed', {
            event_type: 'updated',
            transaction_type: 'import',
            transaction_id: 999,
            reference: 'IMP-OTHER-999',
            status: 'Processing',
            is_archive: false,
            assigned_user_id: 88,
            actor_id: 44,
            occurred_at: '2026-03-26T02:36:00+08:00',
        });

        await waitFor(() => {
            expect(invalidateQueries).not.toHaveBeenCalled();
        });

        expect(toast.info).not.toHaveBeenCalled();

        emit('transactions.import.42', '.transaction.changed', {
            event_type: 'reassigned',
            transaction_type: 'import',
            transaction_id: 42,
            reference: 'IMP-2026-001',
            status: 'Processing',
            is_archive: false,
            assigned_user_id: 23,
            actor_id: 11,
            occurred_at: '2026-03-26T02:37:00+08:00',
        });

        await waitFor(() => {
            expect(mockReleasePrivateChannel).toHaveBeenCalledWith('transactions.import.42');
        });

        expect(toast.info).toHaveBeenCalledWith('This transaction was reassigned.');
    });

    it('does not subscribe when transaction sync is disabled', () => {
        vi.stubEnv('VITE_TRANSACTION_SYNC_ENABLED', 'false');

        renderWithProviders(<SubscriptionProbe />);

        expect(mockAcquirePrivateChannel).not.toHaveBeenCalled();
    });
});
