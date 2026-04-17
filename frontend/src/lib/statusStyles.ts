/**
 * Shared status → color/background mapping used across all transaction views.
 *
 * Canonical display labels:
 *   Workflow UI: real backend stage statuses plus a few legacy aliases still
 *   used elsewhere in the app.
 */

export interface StatusStyle {
    color: string;
    bg: string;
}

const STATUS_MAP: Record<string, StatusStyle> = {
    // Shared workflow labels
    Completed: { color: '#30d158', bg: 'rgba(48,209,88,0.13)' },
    Cleared: { color: '#30d158', bg: 'rgba(48,209,88,0.13)' },
    Pending: { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' },
    Delayed: { color: '#ff453a', bg: 'rgba(255,69,58,0.13)' },
    'Vessel Arrived': { color: '#0a84ff', bg: 'rgba(10,132,255,0.13)' },
    'In Transit': { color: '#0a84ff', bg: 'rgba(10,132,255,0.13)' },
    'In Progress': { color: '#0a84ff', bg: 'rgba(10,132,255,0.13)' },
    Departure: { color: '#bf5af2', bg: 'rgba(191,90,242,0.13)' },
    Shipped: { color: '#30d158', bg: 'rgba(48,209,88,0.13)' },
    Processing: { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' },

    // Cancelled (shared)
    Cancelled: { color: '#ff453a', bg: 'rgba(255,69,58,0.13)' },

    // Raw backend values (admin / TransactionOversight / legacy payloads)
    completed: { color: '#30d158', bg: 'rgba(48,209,88,0.13)' },
    in_progress: { color: '#0a84ff', bg: 'rgba(10,132,255,0.13)' },
    cancelled: { color: '#ff453a', bg: 'rgba(255,69,58,0.13)' },
    pending: { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' },
};

const FALLBACK: StatusStyle = { color: '#0a84ff', bg: 'rgba(10,132,255,0.13)' };

export function getStatusStyle(status: string): StatusStyle {
    return STATUS_MAP[status] ?? FALLBACK;
}
