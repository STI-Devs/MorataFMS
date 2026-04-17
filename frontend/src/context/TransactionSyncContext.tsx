import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect, useEffectEvent, useRef } from 'react';
import { useAuth } from '../features/auth';
import { acquirePrivateChannel, disconnectEcho, releasePrivateChannel } from '../lib/realtime/echo';
import {
    getListInvalidationKeys,
    isTransactionSyncEnabled,
    getUserTransactionChannelName,
    TRANSACTION_CHANGED_EVENT,
    TRANSACTION_REMARK_CHANGED_EVENT,
    type TransactionSyncEventName,
    type TransactionSyncPayload,
} from '../lib/realtime/transactionSync';

const LIST_INVALIDATION_BATCH_WINDOW = 250;

export function TransactionSyncProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const { isAuthenticated, isLoading, user } = useAuth();
    const pendingInvalidationsRef = useRef(new Map<string, readonly unknown[]>());
    const invalidationTimerRef = useRef<number | null>(null);

    const flushPendingInvalidations = useEffectEvent(() => {
        const pendingInvalidations = Array.from(pendingInvalidationsRef.current.values());

        pendingInvalidationsRef.current.clear();
        invalidationTimerRef.current = null;

        for (const queryKey of pendingInvalidations) {
            void queryClient.invalidateQueries({ queryKey });
        }
    });

    const scheduleListInvalidations = useEffectEvent((queryKeys: readonly (readonly unknown[])[]) => {
        for (const queryKey of queryKeys) {
            pendingInvalidationsRef.current.set(JSON.stringify(queryKey), queryKey);
        }

        if (invalidationTimerRef.current !== null) {
            return;
        }

        invalidationTimerRef.current = window.setTimeout(() => {
            flushPendingInvalidations();
        }, LIST_INVALIDATION_BATCH_WINDOW);
    });

    const handleTransactionSync = useEffectEvent(
        (payload: TransactionSyncPayload, eventName: TransactionSyncEventName) => {
            const queryKeys = getListInvalidationKeys(payload, eventName);
            scheduleListInvalidations(queryKeys);
        },
    );

    useEffect(() => () => {
        if (invalidationTimerRef.current !== null) {
            window.clearTimeout(invalidationTimerRef.current);
        }

        pendingInvalidationsRef.current.clear();
        invalidationTimerRef.current = null;
    }, []);

    useEffect(() => {
        if (isLoading) {
            return;
        }

        if (!isTransactionSyncEnabled()) {
            disconnectEcho();

            return;
        }

        if (!isAuthenticated || !user || !['admin', 'encoder', 'processor', 'accounting'].includes(user.role)) {
            disconnectEcho();

            return;
        }

        const channelName = getUserTransactionChannelName(user.id);
        const channel = acquirePrivateChannel(channelName);

        if (!channel) {
            return;
        }

        const handleTransactionChanged = (payload: TransactionSyncPayload) => {
            handleTransactionSync(payload, TRANSACTION_CHANGED_EVENT);
        };

        const handleRemarkChanged = (payload: TransactionSyncPayload) => {
            handleTransactionSync(payload, TRANSACTION_REMARK_CHANGED_EVENT);
        };

        channel.listen(`.${TRANSACTION_CHANGED_EVENT}`, handleTransactionChanged);
        channel.listen(`.${TRANSACTION_REMARK_CHANGED_EVENT}`, handleRemarkChanged);

        return () => {
            channel.stopListening(`.${TRANSACTION_CHANGED_EVENT}`, handleTransactionChanged);
            channel.stopListening(`.${TRANSACTION_REMARK_CHANGED_EVENT}`, handleRemarkChanged);
            releasePrivateChannel(channelName);
        };
    }, [isAuthenticated, isLoading, user]);

    return <>{children}</>;
}
