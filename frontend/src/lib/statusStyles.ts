export interface StatusStyle {
    color: string;
    bg: string;
}

const STATUS_MAP: Record<string, StatusStyle> = {
    // Shared workflow labels
    Completed: { color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 13%, transparent)' },
    Cleared: { color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 13%, transparent)' },
    Pending: { color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 13%, transparent)' },
    Delayed: { color: 'var(--danger)', bg: 'color-mix(in srgb, var(--danger) 13%, transparent)' },
    'Vessel Arrived': { color: 'var(--info)', bg: 'color-mix(in srgb, var(--info) 13%, transparent)' },
    'In Transit': { color: 'var(--info)', bg: 'color-mix(in srgb, var(--info) 13%, transparent)' },
    'In Progress': { color: 'var(--info)', bg: 'color-mix(in srgb, var(--info) 13%, transparent)' },
    Departure: { color: 'var(--violet)', bg: 'color-mix(in srgb, var(--violet) 13%, transparent)' },
    Shipped: { color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 13%, transparent)' },
    Processing: { color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 13%, transparent)' },

    // Cancelled (shared)
    Cancelled: { color: 'var(--danger)', bg: 'color-mix(in srgb, var(--danger) 13%, transparent)' },

    // Raw backend values (admin / TransactionOversight / legacy payloads)
    completed: { color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 13%, transparent)' },
    in_progress: { color: 'var(--info)', bg: 'color-mix(in srgb, var(--info) 13%, transparent)' },
    cancelled: { color: 'var(--danger)', bg: 'color-mix(in srgb, var(--danger) 13%, transparent)' },
    pending: { color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 13%, transparent)' },
};

const FALLBACK: StatusStyle = { color: 'var(--info)', bg: 'color-mix(in srgb, var(--info) 13%, transparent)' };

export function getStatusStyle(status: string): StatusStyle {
    return STATUS_MAP[status] ?? FALLBACK;
}
