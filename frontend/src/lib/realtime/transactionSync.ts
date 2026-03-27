import type { QueryKey } from '@tanstack/react-query';
import type { TransactionType } from '../../features/documents/types/document.types';
import type { DocumentableType } from '../../features/tracking/types';
import { trackingKeys } from '../../features/tracking/utils/queryKeys';

export const TRANSACTION_CHANGED_EVENT = 'transaction.changed';
export const TRANSACTION_REMARK_CHANGED_EVENT = 'transaction.remark.changed';

export type TransactionSyncEventName =
    | typeof TRANSACTION_CHANGED_EVENT
    | typeof TRANSACTION_REMARK_CHANGED_EVENT;

export interface TransactionSyncPayload {
    event_type: string;
    transaction_type: TransactionType;
    transaction_id: number;
    reference: string | null;
    status: string;
    is_archive: boolean;
    assigned_user_id: number | null;
    actor_id: number | null;
    occurred_at: string;
}

const STAT_RELEVANT_EVENT_TYPES = new Set([
    'created',
    'cancelled',
    'status_changed',
    'archive_created',
]);

const ARCHIVE_RELEVANT_EVENT_TYPES = new Set(['archived', 'archive_created']);

export function getUserTransactionChannelName(userId: number): string {
    return `transactions.user.${userId}`;
}

export function getTransactionChannelName(type: TransactionType, id: number): string {
    return `transactions.${type}.${id}`;
}

export function isFinalizedStatus(status: string): boolean {
    const normalizedStatus = status.toLowerCase();

    return normalizedStatus === 'completed' || normalizedStatus === 'cancelled';
}

export function getDocumentableType(type: TransactionType): DocumentableType {
    return type === 'import' ? 'App\\Models\\ImportTransaction' : 'App\\Models\\ExportTransaction';
}

export function getListInvalidationKeys(
    payload: TransactionSyncPayload,
    eventName: TransactionSyncEventName,
): QueryKey[] {
    const queryKeys: QueryKey[] = [
        payload.transaction_type === 'import' ? trackingKeys.imports.all : trackingKeys.exports.all,
        ['admin', 'transactions'],
    ];

    if (eventName === TRANSACTION_REMARK_CHANGED_EVENT) {
        queryKeys.push(['remarks', payload.transaction_type, payload.transaction_id]);
        queryKeys.push(['admin-document-review']);

        return queryKeys;
    }

    if (STAT_RELEVANT_EVENT_TYPES.has(payload.event_type)) {
        queryKeys.push(
            payload.transaction_type === 'import'
                ? trackingKeys.imports.stats
                : trackingKeys.exports.stats,
        );
    }

    if (payload.is_archive || isFinalizedStatus(payload.status)) {
        queryKeys.push(trackingKeys.documents.transactions());
        queryKeys.push(['admin-document-review']);
    }

    if (payload.is_archive || ARCHIVE_RELEVANT_EVENT_TYPES.has(payload.event_type)) {
        queryKeys.push(['archives']);
        queryKeys.push(['my-archives']);
    }

    return queryKeys;
}

export function getActiveTransactionInvalidationKeys(
    payload: TransactionSyncPayload,
    eventName: TransactionSyncEventName,
    reference?: string | null,
): QueryKey[] {
    const queryKeys: QueryKey[] = [
        trackingKeys.documents.list(
            getDocumentableType(payload.transaction_type),
            payload.transaction_id,
        ),
        ['documents', payload.transaction_type, payload.transaction_id],
        ['admin-document-review', 'detail', payload.transaction_type, payload.transaction_id],
    ];

    if (reference) {
        queryKeys.push(trackingKeys.detail(reference, 'tracking'));
        queryKeys.push(trackingKeys.detail(reference, 'record'));
    }

    if (eventName === TRANSACTION_REMARK_CHANGED_EVENT) {
        queryKeys.push(['remarks', payload.transaction_type, payload.transaction_id]);
    }

    return queryKeys;
}

export function shouldShowTransactionSyncToast(
    payload: TransactionSyncPayload,
    currentUserId: number | null | undefined,
): boolean {
    return currentUserId !== null && currentUserId !== undefined && payload.actor_id !== currentUserId;
}

export function getTransactionSyncToastMessage(
    payload: TransactionSyncPayload,
    eventName: TransactionSyncEventName,
): string {
    if (eventName === TRANSACTION_REMARK_CHANGED_EVENT) {
        if (payload.event_type === 'remark_resolved') {
            return 'A remark was resolved on this transaction.';
        }

        return 'A new remark was added to this transaction.';
    }

    switch (payload.event_type) {
        case 'reassigned':
            return 'This transaction was reassigned.';
        case 'status_changed':
            return `Transaction status changed to ${payload.status}.`;
        case 'cancelled':
            return 'This transaction was cancelled.';
        case 'document_uploaded':
            return 'A document was uploaded to this transaction.';
        case 'document_deleted':
            return 'A document was removed from this transaction.';
        case 'archived':
        case 'archive_created':
            return 'This transaction was archived.';
        case 'created':
            return 'A transaction was created.';
        case 'updated':
            return 'This transaction was updated.';
        default:
            return 'This transaction was updated by another user.';
    }
}
