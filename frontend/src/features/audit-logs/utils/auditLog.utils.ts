export type EventConfig = { label: string; color: string; bg: string };

export const EVENT_CFG: Record<string, EventConfig> = {
    created: { label: 'Created', color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 13%, transparent)' },
    updated: { label: 'Updated', color: 'var(--info)', bg: 'color-mix(in srgb, var(--info) 13%, transparent)' },
    deleted: { label: 'Deleted', color: 'var(--danger)', bg: 'color-mix(in srgb, var(--danger) 13%, transparent)' },
    restored: { label: 'Restored', color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 13%, transparent)' },
    status_changed: { label: 'Status Changed', color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 13%, transparent)' },
    encoder_reassigned: { label: 'Encoder Reassigned', color: 'var(--violet)', bg: 'color-mix(in srgb, var(--violet) 13%, transparent)' },
    login: { label: 'Login', color: 'var(--sky)', bg: 'color-mix(in srgb, var(--sky) 13%, transparent)' },
    logout: { label: 'Logout', color: 'var(--muted-foreground)', bg: 'color-mix(in srgb, var(--muted-foreground) 13%, transparent)' },
};

export const SELECTIVE_COLOR_TONES: Record<string, string> = {
    green: 'var(--success)',
    // No distinct yellow token exists; closest semantic is warning (orange).
    yellow: 'var(--warning)',
    orange: 'var(--warning)',
    red: 'var(--danger)',
};

export function getEventCfg(event: string): EventConfig {
    return EVENT_CFG[event] ?? { label: event.replace(/_/g, ' '), color: 'var(--muted-foreground)', bg: 'color-mix(in srgb, var(--muted-foreground) 13%, transparent)' };
}

export function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatKey(key: string): string {
    if (key === 'remarkble_id' || key === 'remarkble') return 'Transaction';
    if (key === 'documentable_id') return 'Transaction';
    return key
        .replace(/_id$/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
}

export function formatValue(val: unknown): string {
    if (val === null || val === undefined) return '(none)';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (val === '') return '(empty)';
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
        return formatDate(val);
    }
    return String(val);
}

export function countMeaningfulFieldKeys(values: Record<string, unknown> | null | undefined): number {
    if (!values) return 0;
    return Object.keys(values).filter((k) => !k.endsWith('_type')).length;
}
