import type { OversightTransaction } from '../types/transaction.types';
import type { VesselGroup } from '../../tracking/types';

export type TypeFilter = 'all' | 'import' | 'export';
export type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';

export const COMPLETED_STATUS = 'completed';
export const CANCELLED_STATUS = 'cancelled';

export const STATUS_CFG: Record<string, { color: string; bg: string }> = {
    completed: { color: '#30d158', bg: 'rgba(48,209,88,0.13)' },
    in_progress: { color: '#0a84ff', bg: 'rgba(10,132,255,0.13)' },
    cancelled: { color: '#ff453a', bg: 'rgba(255,69,58,0.13)' },
    pending: { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' },
};

export const TYPE_CFG: Record<string, { color: string; bg: string }> = {
    import: { color: '#0a84ff', bg: 'rgba(10,132,255,0.13)' },
    export: { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' },
};

export function normalizeStatus(status: string): string {
    return status.trim().toLowerCase().replace(/\s+/g, '_');
}

export function formatCompactDate(dateString: string | null | undefined): string {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function getTransactionPrimaryRef(transaction: OversightTransaction): string {
    return transaction.reference_no || transaction.bl_no || `#${transaction.id}`;
}

export function getTransactionSecondaryRef(transaction: OversightTransaction): string | null {
    if (transaction.reference_no && transaction.bl_no && transaction.bl_no !== transaction.reference_no) {
        return transaction.bl_no;
    }

    if (!transaction.reference_no && transaction.bl_no) {
        return null;
    }

    return transaction.vessel || null;
}

export function isDelayedDate(dateString: string | null | undefined): boolean {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !Number.isNaN(date.getTime()) && date < new Date();
}

export function buildOversightGroups(transactions: OversightTransaction[]): VesselGroup<OversightTransaction>[] {
    const grouped = new Map<string, OversightTransaction[]>();

    for (const t of transactions) {
        const vesselName = (t.vessel ?? 'Unknown Vessel').trim() || 'Unknown Vessel';
        const key = `${t.type}:${vesselName}`;
        const existing = grouped.get(key);
        if (existing) {
            existing.push(t);
        } else {
            grouped.set(key, [t]);
        }
    }

    const groups: VesselGroup<OversightTransaction>[] = [];

    for (const [groupKey, txns] of grouped.entries()) {
        const vesselName = txns[0]?.vessel?.trim() || 'Unknown Vessel';
        const groupType = txns[0]?.type ?? 'import';
        const eta = txns[0]?.date ?? null;
        const blocked = txns.filter(t => t.open_remarks_count > 0);
        const completed = txns.filter(t => normalizeStatus(t.status) === COMPLETED_STATUS);
        const in_progress = txns.filter(t => {
            const s = normalizeStatus(t.status);
            return s !== COMPLETED_STATUS && s !== CANCELLED_STATUS && s !== 'pending';
        });

        groups.push({
            vesselKey: groupKey,
            vesselName: vesselName || 'Unknown Vessel',
            voyage: null,
            eta,
            type: groupType,
            transactions: txns,
            stats: {
                total: txns.length,
                in_progress: in_progress.length,
                blocked: blocked.length,
                completed: completed.length,
            },
            isDelayed: isDelayedDate(eta) && completed.length < txns.length,
        });
    }

    return groups.sort((a, b) => {
        if (!a.eta) return 1;
        if (!b.eta) return -1;
        return new Date(a.eta).getTime() - new Date(b.eta).getTime();
    });
}
