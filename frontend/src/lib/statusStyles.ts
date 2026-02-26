/**
 * Shared status → color/background mapping used across all transaction views.
 *
 * Canonical display labels:
 *   Import:  pending → "Pending" | in_progress → "In Transit" | completed → "Cleared" | cancelled → "Delayed"
 *   Export:  pending → "Processing" | in_progress → "In Transit" | completed → "Shipped" | cancelled → "Delayed"
 *   Admin:   raw backend values (pending, in_progress, completed, cancelled)
 */

export interface StatusStyle {
    color: string;
    bg: string;
}

const STATUS_MAP: Record<string, StatusStyle> = {
    // Import display labels
    Cleared: { color: '#30d158', bg: 'rgba(48,209,88,0.13)' },
    Pending: { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' },
    Delayed: { color: '#ff453a', bg: 'rgba(255,69,58,0.13)' },
    'In Transit': { color: '#64d2ff', bg: 'rgba(100,210,255,0.13)' },

    // Export display labels
    Shipped: { color: '#30d158', bg: 'rgba(48,209,88,0.13)' },
    Processing: { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' },

    // Raw backend values (used in admin / TransactionOversight)
    completed: { color: '#30d158', bg: 'rgba(48,209,88,0.13)' },
    in_progress: { color: '#64d2ff', bg: 'rgba(100,210,255,0.13)' },
    cancelled: { color: '#ff453a', bg: 'rgba(255,69,58,0.13)' },
    pending: { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' },
};

/** Fallback for unknown statuses — same as "In Transit" colour */
const FALLBACK: StatusStyle = { color: '#64d2ff', bg: 'rgba(100,210,255,0.13)' };

export function getStatusStyle(status: string): StatusStyle {
    return STATUS_MAP[status] ?? FALLBACK;
}
