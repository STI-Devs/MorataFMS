import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '../../tracking/types';
import { useAuditLogs } from '../hooks/useAuditLogs';
import type { AuditLogFilters } from '../types/auditLog.types';


const EVENT_CFG: Record<string, { label: string; color: string; bg: string }> = {
    created: { label: 'Created', color: '#30d158', bg: 'rgba(48,209,88,0.13)' },
    updated: { label: 'Updated', color: '#0a84ff', bg: 'rgba(10,132,255,0.13)' },
    deleted: { label: 'Deleted', color: '#ff453a', bg: 'rgba(255,69,58,0.13)' },
    restored: { label: 'Restored', color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' },
    status_changed: { label: 'Status Changed', color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' },
    encoder_reassigned: { label: 'Encoder Reassigned', color: '#bf5af2', bg: 'rgba(191,90,242,0.13)' },
    login: { label: 'Login', color: '#64d2ff', bg: 'rgba(100,210,255,0.13)' },
    logout: { label: 'Logout', color: '#8e8e93', bg: 'rgba(142,142,147,0.13)' },
};

const getEventCfg = (event: string) =>
    EVENT_CFG[event] ?? { label: event.replace(/_/g, ' '), color: '#8e8e93', bg: 'rgba(142,142,147,0.13)' };

const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });

const formatKey = (key: string) => {
    if (key === 'remarkble_id' || key === 'remarkble') return 'Transaction';
    if (key === 'documentable_id') return 'Transaction';
    return key
        .replace(/_id$/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
};

const formatValue = (val: any) => {
    if (val === null || val === undefined) return '(none)';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (val === '') return '(empty)';
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
        return formatDate(val);
    }
    return String(val);
};

export const AuditLogs = () => {
    const { dateTime } = useOutletContext<LayoutContext>();

    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [actorFilter, setActorFilter] = useState<'human' | 'system' | 'all'>('human');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const filters: AuditLogFilters = {
        search: search || undefined,
        action: actionFilter || undefined,
        actor: actorFilter,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
        per_page: 25,
    };

    const { data, isLoading, isError } = useAuditLogs(filters);

    const logs = data?.data ?? [];
    const meta = data?.meta ?? { current_page: 1, last_page: 1, per_page: 25, total: 0 };

    const handleSearch = (val: string) => { setSearch(val); setPage(1); setExpandedId(null); };
    const handleAction = (val: string) => { setActionFilter(val); setPage(1); setExpandedId(null); };
    const handleActor = (val: 'human' | 'system' | 'all') => { setActorFilter(val); setPage(1); setExpandedId(null); };
    const handleDateFrom = (val: string) => { setDateFrom(val); setPage(1); setExpandedId(null); };
    const handleDateTo = (val: string) => { setDateTo(val); setPage(1); setExpandedId(null); };

    const inputCls = 'px-3 py-2.5 rounded-lg border border-border-strong bg-input-bg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition-colors';

    return (
        <div className="space-y-5 p-4">

            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-1 text-text-primary">Audit Logs</h1>
                    <p className="text-sm text-text-secondary">Record of all create, update, and delete events in the system</p>
                </div>
                <div className="text-right hidden sm:block shrink-0">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-secondary">{dateTime.date}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Events', value: meta.total, color: '#0a84ff', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
                    { label: 'Created', value: String(logs.filter(l => l.event === 'created').length) + (page > 1 ? '+' : ''), color: '#30d158', icon: 'M12 4v16m8-8H4' },
                    { label: 'Updated', value: String(logs.filter(l => l.event === 'updated').length) + (page > 1 ? '+' : ''), color: '#ff9f0a', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
                    { label: 'Deleted', value: String(logs.filter(l => l.event === 'deleted').length) + (page > 1 ? '+' : ''), color: '#ff453a', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
                ].map(({ label, value, color, icon }) => (
                    <div key={label} className="bg-surface rounded-xl p-4 border border-border">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-3xl font-bold tabular-nums text-text-primary">{value}</p>
                                <p className="text-xs mt-1 text-text-secondary">{label}</p>
                            </div>
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20` }}>
                                <svg className="w-4.5 h-4.5" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                                </svg>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table card */}
            <div className="bg-surface rounded-xl border border-border overflow-hidden">
                {/* Toolbar */}
                <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-sm font-bold text-text-primary">Event Log</h2>
                        <span className="text-xs font-semibold px-2 py-1 rounded-md bg-surface border border-border text-text-secondary">
                            {meta.total} total · Page {meta.current_page} of {meta.last_page}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                        <input
                            type="text"
                            placeholder="Search by user..."
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                            className={`${inputCls} min-w-[150px] !h-8 !py-0 !text-xs`}
                        />
                        <select
                            value={actorFilter}
                            onChange={e => handleActor(e.target.value as 'human' | 'system' | 'all')}
                            className={`${inputCls} !h-8 !py-0 !text-xs`}
                        >
                            <option value="human">User Actions</option>
                            <option value="system">System Events</option>
                            <option value="all">All Activity</option>
                        </select>
                        <select
                            value={actionFilter}
                            onChange={e => handleAction(e.target.value)}
                            className={`${inputCls} !h-8 !py-0 !text-xs`}
                        >
                            <option value="">All Events</option>
                            {Object.entries(EVENT_CFG).map(([key, cfg]) => (
                                <option key={key} value={key}>{cfg.label}</option>
                            ))}
                        </select>
                        <input type="date" value={dateFrom} onChange={e => handleDateFrom(e.target.value)} className={`${inputCls} !h-8 !py-0 !text-xs`} />
                        <input type="date" value={dateTo} onChange={e => handleDateTo(e.target.value)} className={`${inputCls} !h-8 !py-0 !text-xs`} />
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-16 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-[3px] border-border animate-spin" style={{ borderTopColor: '#0a84ff' }} />
                    </div>
                ) : isError ? (
                    <div className="p-16 text-center">
                        <p className="text-sm text-red-500 font-medium mb-2">Failed to load audit logs.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-xs font-semibold text-text-secondary underline hover:text-text-primary"
                        >
                            Try again
                        </button>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="py-16 text-center">
                        <p className="text-sm font-semibold text-text-secondary mb-1">No events found</p>
                        <p className="text-xs text-text-muted">
                            {search || actionFilter || dateFrom || dateTo
                                ? 'Try adjusting your filters.'
                                : 'Events will appear here as actions are performed in the system.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    {['Timestamp', 'User', 'Event', 'Record', 'Changes', 'IP', ''].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted last:w-8">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, idx) => {
                                    const cfg = getEventCfg(log.event);
                                    const isOpen = expandedId === log.id;
                                    const isDelete = log.event === 'deleted';

                                    // Determine what data to show in the detail panel
                                    const hasNew = log.new_values && Object.keys(log.new_values).length > 0;
                                    const hasOldOnly = isDelete && log.old_values && Object.keys(log.old_values).length > 0;
                                    const changesData = hasNew ? log.new_values : hasOldOnly ? log.old_values : null;
                                    // Exclude internal _type companion keys from the count (they're resolved into the _id field)
                                    const changeCount = changesData
                                        ? Object.keys(changesData).filter(k => !k.endsWith('_type')).length
                                        : 0;

                                    const zebraRow = idx % 2 !== 0 ? 'bg-surface-secondary/30' : '';

                                    return (
                                        <>
                                            {/* ── Compact summary row ── */}
                                            <tr
                                                key={log.id}
                                                onClick={() => setExpandedId(isOpen ? null : log.id)}
                                                className={`border-b border-border/50 transition-colors ${zebraRow} ${changeCount > 0 ? 'cursor-pointer hover:bg-hover' : ''} ${isOpen ? '!bg-hover' : ''}`}
                                            >
                                                {/* Timestamp */}
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <p className="text-xs tabular-nums text-text-secondary">{formatDate(log.created_at)}</p>
                                                </td>

                                                {/* User */}
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    {log.user ? (
                                                        <p className="font-medium text-text-primary text-sm">{log.user.name}</p>
                                                    ) : (
                                                        <span className="text-text-muted italic text-xs">System</span>
                                                    )}
                                                </td>

                                                {/* Event badge */}
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <span
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold capitalize"
                                                        style={{ color: cfg.color, backgroundColor: cfg.bg }}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                                                        {cfg.label}
                                                    </span>
                                                </td>

                                                {/* Record — type badge only; label visible in expanded panel */}
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    {log.auditable_type ? (
                                                        <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-surface-tint border border-border-tint text-text-secondary capitalize">
                                                            {log.auditable_type}
                                                        </span>
                                                    ) : (
                                                        <span className="text-text-muted">—</span>
                                                    )}
                                                </td>

                                                {/* Changes summary pill */}
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    {isDelete && changeCount > 0 ? (
                                                        <span
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                                                            style={{
                                                                color: '#ff453a',
                                                                backgroundColor: 'rgba(255,69,58,0.10)',
                                                                borderColor: 'rgba(255,69,58,0.25)',
                                                            }}
                                                        >
                                                            Snapshot
                                                        </span>
                                                    ) : !isDelete && changeCount > 0 ? (
                                                        <span
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                                                            style={{
                                                                color: '#0a84ff',
                                                                backgroundColor: 'rgba(10,132,255,0.10)',
                                                                borderColor: 'rgba(10,132,255,0.25)',
                                                            }}
                                                        >
                                                            {changeCount} field{changeCount !== 1 ? 's' : ''}
                                                        </span>
                                                    ) : (
                                                        <span className="text-text-muted text-xs">—</span>
                                                    )}
                                                </td>

                                                {/* IP */}
                                                <td className="px-5 py-3.5 whitespace-nowrap text-xs tabular-nums text-text-muted">
                                                    {log.ip_address ?? '—'}
                                                </td>

                                                {/* Expand chevron */}
                                                <td className="pr-4 py-3.5 whitespace-nowrap text-right">
                                                    {changeCount > 0 && (
                                                        <svg
                                                            className="w-4 h-4 text-text-muted transition-transform duration-200 inline"
                                                            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                                            fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    )}
                                                </td>
                                            </tr>

                                            {/* ── Expanded detail panel (always rendered, animated via grid-rows) ── */}
                                            {changesData && (
                                                <tr key={`${log.id}-detail`}>
                                                    <td
                                                        colSpan={7}
                                                        className="p-0 border-0"
                                                        style={{ padding: 0 }}
                                                    >
                                                        {/* Grid-rows trick: 0fr → 1fr gives smooth height animation without knowing height */}
                                                        <div
                                                            style={{
                                                                display: 'grid',
                                                                gridTemplateRows: isOpen ? '1fr' : '0fr',
                                                                transition: 'grid-template-rows 380ms cubic-bezier(0.4, 0, 0.2, 1)',
                                                            }}
                                                        >
                                                            <div style={{ overflow: 'hidden' }}>
                                                                <div
                                                                    className="bg-surface/50 overflow-hidden"
                                                                    style={{
                                                                        borderTop: '1px solid var(--color-border-strong, rgba(255,255,255,0.06))',
                                                                        borderBottom: '1px solid var(--color-border-strong, rgba(255,255,255,0.06))',
                                                                        opacity: isOpen ? 1 : 0,
                                                                        transform: isOpen ? 'translateY(0)' : 'translateY(-6px)',
                                                                        transition: 'opacity 300ms ease, transform 300ms ease',
                                                                        transitionDelay: isOpen ? '60ms' : '0ms',
                                                                    }}
                                                                >

                                                                    {/* Panel header */}
                                                                    <div
                                                                        style={{
                                                                            padding: '16px 24px 12px',
                                                                            borderBottom: '1px solid var(--color-border-strong, rgba(255,255,255,0.06))',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px',
                                                                        }}
                                                                    >
                                                                        <span
                                                                            style={{
                                                                                width: '6px',
                                                                                height: '6px',
                                                                                borderRadius: '50%',
                                                                                backgroundColor: cfg.color,
                                                                                boxShadow: `0 0 6px ${cfg.color}`,
                                                                                flexShrink: 0,
                                                                            }}
                                                                        />
                                                                        <p style={{ fontSize: '11px', fontWeight: 700, color: cfg.color, letterSpacing: '0.02em' }}>
                                                                            {isDelete
                                                                                ? `Record Snapshot${log.auditable_label ? ` · ${log.auditable_label}` : ''}`
                                                                                : `${cfg.label} — ${changeCount} field${changeCount !== 1 ? 's' : ''}${log.auditable_label ? ` · ${log.auditable_label}` : ''}`
                                                                            }
                                                                        </p>
                                                                    </div>

                                                                    {/* Field list */}
                                                                    <div
                                                                        style={{
                                                                            padding: '20px 24px 24px',
                                                                            display: 'grid',
                                                                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                                                            gap: '24px 16px',
                                                                        }}
                                                                    >
                                                                        {hasNew
                                                                            ? Object.entries(log.new_values!).filter(([k]) => !k.endsWith('_type')).map(([key, newVal], fi) => {
                                                                                const oldVal = log.old_values?.[key];
                                                                                const hasOldVal = oldVal !== undefined && oldVal !== null;
                                                                                const SC_COLORS: Record<string, string> = { green: '#30d158', yellow: '#ffd60a', orange: '#ff9f0a', red: '#ff453a' };
                                                                                const isColorField = key === 'selective_color';
                                                                                const scColor = isColorField ? SC_COLORS[String(newVal).toLowerCase()] : undefined;
                                                                                return (
                                                                                    <div
                                                                                        key={key}
                                                                                        style={{
                                                                                            padding: '4px 8px',
                                                                                            minWidth: 0,
                                                                                            textAlign: 'left',
                                                                                            opacity: isOpen ? 1 : 0,
                                                                                            transform: isOpen ? 'translateY(0)' : 'translateY(4px)',
                                                                                            transition: `opacity 280ms ease ${80 + fi * 30}ms, transform 280ms ease ${80 + fi * 30}ms`,
                                                                                        }}
                                                                                    >
                                                                                        <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted, #6b7280)', marginBottom: '5px' }}>
                                                                                            {formatKey(key)}
                                                                                        </p>
                                                                                        {hasOldVal && (
                                                                                            <p
                                                                                                style={{
                                                                                                    fontSize: '10px',
                                                                                                    fontFamily: 'monospace',
                                                                                                    textDecoration: 'line-through',
                                                                                                    color: 'var(--color-text-muted, #6b7280)',
                                                                                                    opacity: 0.55,
                                                                                                    marginBottom: '2px',
                                                                                                    overflow: 'hidden',
                                                                                                    textOverflow: 'ellipsis',
                                                                                                    whiteSpace: 'nowrap',
                                                                                                }}
                                                                                                title={formatValue(oldVal)}
                                                                                            >
                                                                                                {formatValue(oldVal)}
                                                                                            </p>
                                                                                        )}
                                                                                        {isColorField && scColor ? (
                                                                                            <span style={{
                                                                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                                                                padding: '2px 8px', borderRadius: '999px',
                                                                                                background: `${scColor}22`,
                                                                                                border: `1px solid ${scColor}55`,
                                                                                                fontSize: '11px', fontWeight: 700, fontFamily: 'monospace',
                                                                                                color: scColor,
                                                                                            }}>
                                                                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: scColor, flexShrink: 0 }} />
                                                                                                {formatValue(newVal)}
                                                                                            </span>
                                                                                        ) : (
                                                                                            <p
                                                                                                style={{
                                                                                                    fontSize: '11px',
                                                                                                    fontFamily: 'monospace',
                                                                                                    fontWeight: 600,
                                                                                                    color: hasOldVal ? cfg.color : 'var(--color-text-primary, #f0f0f0)',
                                                                                                    overflow: 'hidden',
                                                                                                    textOverflow: 'ellipsis',
                                                                                                    whiteSpace: 'nowrap',
                                                                                                }}
                                                                                                title={formatValue(newVal)}
                                                                                            >
                                                                                                {formatValue(newVal)}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })
                                                                            : Object.entries(log.old_values!).filter(([k]) => !k.endsWith('_type')).map(([key, oldVal], fi) => {
                                                                                const SC_COLORS: Record<string, string> = { green: '#30d158', yellow: '#ffd60a', orange: '#ff9f0a', red: '#ff453a' };
                                                                                const isColorField = key === 'selective_color';
                                                                                const scColor = isColorField ? SC_COLORS[String(oldVal).toLowerCase()] : undefined;
                                                                                return (
                                                                                    <div
                                                                                        key={key}
                                                                                        style={{
                                                                                            padding: '4px 8px',
                                                                                            minWidth: 0,
                                                                                            textAlign: 'left',
                                                                                            opacity: isOpen ? 1 : 0,
                                                                                            transform: isOpen ? 'translateY(0)' : 'translateY(4px)',
                                                                                            transition: `opacity 280ms ease ${80 + fi * 30}ms, transform 280ms ease ${80 + fi * 30}ms`,
                                                                                        }}
                                                                                    >
                                                                                        <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted, #6b7280)', marginBottom: '5px' }}>
                                                                                            {formatKey(key)}
                                                                                        </p>
                                                                                        {isColorField && scColor ? (
                                                                                            <span style={{
                                                                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                                                                padding: '2px 8px', borderRadius: '999px',
                                                                                                background: `${scColor}22`,
                                                                                                border: `1px solid ${scColor}55`,
                                                                                                fontSize: '11px', fontWeight: 700, fontFamily: 'monospace',
                                                                                                color: scColor,
                                                                                            }}>
                                                                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: scColor, flexShrink: 0 }} />
                                                                                                {formatValue(oldVal)}
                                                                                            </span>
                                                                                        ) : (
                                                                                            <p
                                                                                                style={{
                                                                                                    fontSize: '11px',
                                                                                                    fontFamily: 'monospace',
                                                                                                    color: 'var(--color-text-secondary, #9ca3af)',
                                                                                                    overflow: 'hidden',
                                                                                                    textOverflow: 'ellipsis',
                                                                                                    whiteSpace: 'nowrap',
                                                                                                }}
                                                                                                title={formatValue(oldVal)}
                                                                                            >
                                                                                                {formatValue(oldVal)}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {meta.last_page > 1 && (
                    <div className="px-5 py-4 border-t border-border flex justify-between items-center">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border border-border-strong bg-input-bg text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40"
                        >
                            ← Previous
                        </button>
                        <span className="text-sm text-text-secondary">Page {meta.current_page} of {meta.last_page}</span>
                        <button
                            onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                            disabled={page === meta.last_page}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border border-border-strong bg-input-bg text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
