import type { ApiDocument } from '../../../tracking/types';
import type {
    AdminReviewReadinessFilter,
    AdminReviewQueueItem,
    AdminReviewDocumentFile,
    TransactionType,
} from '../../types/document.types';

export const STATUS_TONES: Record<string, { text: string; bg: string }> = {
    completed: { text: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    cancelled: { text: 'text-red-600', bg: 'bg-red-500/10 border-red-500/20' },
};

export const TYPE_TONES: Record<string, { text: string; bg: string }> = {
    import: { text: 'text-blue-600', bg: 'bg-blue-500/10 border-blue-500/20' },
    export: { text: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/20' },
};

export const READINESS_TONES: Record<
    Exclude<AdminReviewReadinessFilter, 'all'>,
    { text: string; bg: string; label: string }
> = {
    ready: {
        text: 'text-emerald-600',
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        label: 'Ready for Records',
    },
    missing_docs: {
        text: 'text-amber-600',
        bg: 'bg-amber-500/10 border-amber-500/20',
        label: 'Missing Docs',
    },
    flagged: {
        text: 'text-red-600',
        bg: 'bg-red-500/10 border-red-500/20',
        label: 'Flagged',
    },
};

export type ReviewSelection = {
    id: number;
    type: TransactionType;
};

export const reviewKey = (transaction: Pick<AdminReviewQueueItem, 'id' | 'type'>) =>
    `${transaction.type}:${transaction.id}`;

export const matchesSelection = (
    selection: ReviewSelection | null,
    transaction: Pick<AdminReviewQueueItem, 'id' | 'type'>,
) => selection?.id === transaction.id && selection.type === transaction.type;

export const timeAgo = (dateString: string | null) => {
    if (!dateString) {
        return 'Unknown';
    }

    const diffMs = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) {
        return 'just now';
    }

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours}h ago`;
    }

    return `${Math.floor(hours / 24)}d ago`;
};

export const formatDateTime = (dateString: string | null) => {
    if (!dateString) {
        return 'Unknown';
    }

    return new Date(dateString).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};

export const extractErrorMessage = (error: unknown) => {
    if (error && typeof error === 'object' && 'response' in error) {
        const response = error as { response?: { data?: { message?: string } } };

        return response.response?.data?.message ?? 'Failed to archive transaction.';
    }

    return 'Failed to archive transaction.';
};

export const toPreviewDocument = (file: AdminReviewDocumentFile | null, typeKey: string): ApiDocument | null => {
    if (!file) {
        return null;
    }

    return {
        id: file.id,
        type: typeKey,
        filename: file.filename,
        size_bytes: 0,
        formatted_size: file.size,
        version: 1,
        download_url: `/api/documents/${file.id}/download`,
        uploaded_by: file.uploaded_by ? { id: 0, name: file.uploaded_by } : null,
        created_at: file.uploaded_at ?? '',
        updated_at: file.uploaded_at ?? '',
    };
};
