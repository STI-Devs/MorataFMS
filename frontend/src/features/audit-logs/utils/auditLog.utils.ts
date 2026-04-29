export type EventConfig = { label: string; color: string; bg: string };

export const EVENT_CFG: Record<string, EventConfig> = {
    created: { label: 'Created', color: '#30d158', bg: 'rgba(48,209,88,0.13)' },
    updated: { label: 'Updated', color: '#0a84ff', bg: 'rgba(10,132,255,0.13)' },
    deleted: { label: 'Deleted', color: '#ff453a', bg: 'rgba(255,69,58,0.13)' },
    restored: { label: 'Restored', color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' },
    status_changed: { label: 'Status Changed', color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' },
    encoder_reassigned: { label: 'Encoder Reassigned', color: '#bf5af2', bg: 'rgba(191,90,242,0.13)' },
    login: { label: 'Login', color: '#64d2ff', bg: 'rgba(100,210,255,0.13)' },
    logout: { label: 'Logout', color: '#8e8e93', bg: 'rgba(142,142,147,0.13)' },
};

export const SELECTIVE_COLOR_TONES: Record<string, string> = {
    green: '#30d158',
    yellow: '#ffd60a',
    orange: '#ff9f0a',
    red: '#ff453a',
};

export function getEventCfg(event: string): EventConfig {
    return EVENT_CFG[event] ?? { label: event.replace(/_/g, ' '), color: '#8e8e93', bg: 'rgba(142,142,147,0.13)' };
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
