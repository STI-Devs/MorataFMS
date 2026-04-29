import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useEffectEvent } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../features/auth';
import { isEncoder } from '../features/auth/utils/access';
import { acquirePrivateChannel, releasePrivateChannel } from '../lib/realtime/echo';
import {
    getActiveTransactionInvalidationKeys,
    getTransactionChannelName,
    getTransactionSyncToastMessage,
    isTransactionSyncEnabled,
    shouldShowTransactionSyncToast,
    TRANSACTION_CHANGED_EVENT,
    TRANSACTION_REMARK_CHANGED_EVENT,
    type TransactionSyncEventName,
    type TransactionSyncPayload,
} from '../lib/realtime/transactionSync';
import type { TransactionType } from '../features/documents/types/document.types';

interface UseTransactionSyncSubscriptionOptions {
    type: TransactionType | null;
    id: number | null;
    reference?: string | null;
    enabled?: boolean;
    showToast?: boolean;
}

export function useTransactionSyncSubscription({
    type,
    id,
    reference,
    enabled = true,
    showToast = true,
}: UseTransactionSyncSubscriptionOptions): void {
    const queryClient = useQueryClient();
    const { isAuthenticated, isLoading, user } = useAuth();

    const handleTransactionSync = useEffectEvent(
        (payload: TransactionSyncPayload, eventName: TransactionSyncEventName) => {
            const queryKeys = getActiveTransactionInvalidationKeys(payload, eventName, reference);

            for (const queryKey of queryKeys) {
                void queryClient.invalidateQueries({ queryKey });
            }

            if (showToast && shouldShowTransactionSyncToast(payload, user?.id)) {
                toast.info(getTransactionSyncToastMessage(payload, eventName));
            }
        },
    );

    useEffect(() => {
        if (
            !enabled ||
            isLoading ||
            !isTransactionSyncEnabled() ||
            !isAuthenticated ||
            !user ||
            !type ||
            id === null ||
            !['admin', 'encoder'].includes(user.role)
        ) {
            return;
        }

        const channelName = getTransactionChannelName(type, id);
        const channel = acquirePrivateChannel(channelName);

        if (!channel) {
            return;
        }

        let released = false;

        const releaseChannel = () => {
            if (released) {
                return;
            }

            released = true;
            channel.stopListening(`.${TRANSACTION_CHANGED_EVENT}`, handleTransactionChanged);
            channel.stopListening(`.${TRANSACTION_REMARK_CHANGED_EVENT}`, handleRemarkChanged);
            releasePrivateChannel(channelName);
        };

        const handleEvent = (payload: TransactionSyncPayload, eventName: TransactionSyncEventName) => {
            handleTransactionSync(payload, eventName);

            if (
                isEncoder(user) &&
                payload.event_type === 'reassigned' &&
                payload.assigned_user_id !== user.id
            ) {
                releaseChannel();
            }
        };

        const handleTransactionChanged = (payload: TransactionSyncPayload) => {
            handleEvent(payload, TRANSACTION_CHANGED_EVENT);
        };

        const handleRemarkChanged = (payload: TransactionSyncPayload) => {
            handleEvent(payload, TRANSACTION_REMARK_CHANGED_EVENT);
        };

        channel.listen(`.${TRANSACTION_CHANGED_EVENT}`, handleTransactionChanged);
        channel.listen(`.${TRANSACTION_REMARK_CHANGED_EVENT}`, handleRemarkChanged);

        return releaseChannel;
    }, [enabled, id, isAuthenticated, isLoading, type, user]);
}
