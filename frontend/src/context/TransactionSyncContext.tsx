import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useEffect, useEffectEvent } from 'react';
import { useAuth } from '../features/auth';
import { acquirePrivateChannel, disconnectEcho, releasePrivateChannel } from '../lib/realtime/echo';
import {
    getListInvalidationKeys,
    getUserTransactionChannelName,
    TRANSACTION_CHANGED_EVENT,
    TRANSACTION_REMARK_CHANGED_EVENT,
    type TransactionSyncEventName,
    type TransactionSyncPayload,
} from '../lib/realtime/transactionSync';

export function TransactionSyncProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const { isAuthenticated, isLoading, user } = useAuth();

    const handleTransactionSync = useEffectEvent(
        (payload: TransactionSyncPayload, eventName: TransactionSyncEventName) => {
            const queryKeys = getListInvalidationKeys(payload, eventName);

            for (const queryKey of queryKeys) {
                void queryClient.invalidateQueries({ queryKey });
            }
        },
    );

    useEffect(() => {
        if (isLoading) {
            return;
        }

        if (!isAuthenticated || !user || !['admin', 'encoder'].includes(user.role)) {
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
