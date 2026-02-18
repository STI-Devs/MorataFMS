import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { auditLogApi } from '../api/auditLogApi';
import type { AuditLogEntry, AuditLogMeta, AuditLogFilters } from '../types/auditLog.types';

interface LayoutContext {
    user?: { name: string; role: string };
    dateTime: { time: string; date: string };
}

const ACTION_CFG: Record<string, { label: string; color: string; bg: string }> = {
    login: { label: 'Login', color: '#30d158', bg: 'rgba(48,209,88,0.13)' },
    logout: { label: 'Logout', color: '#8e8e93', bg: 'rgba(142,142,147,0.13)' },
    status_changed: { label: 'Status Changed', color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' },
    encoder_reassigned: { label: 'Encoder Reassigned', color: '#bf5af2', bg: 'rgba(191,90,242,0.13)' },
};

const getActionCfg = (action: string) =>
    ACTION_CFG[action] ?? { label: action.replace(/_/g, ' '), color: '#8e8e93', bg: 'rgba(142,142,147,0.13)' };

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
};

export const AuditLogs = () => {
    const { dateTime } = useOutletContext<LayoutContext>();

    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [meta, setMeta] = useState<AuditLogMeta>({ current_page: 1, last_page: 1, per_page: 25, total: 0 });
    const [availableActions, setAvailableActions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);

    const loadLogs = useCallback(async (filters: AuditLogFilters) => {
        try {
            setIsLoading(true);
            setError('');
            const res = await auditLogApi.getLogs(filters);
            setLogs(res.data);
            setMeta(res.meta);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load audit logs.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadActions = useCallback(async () => {
        try {
            const res = await auditLogApi.getActions();
            setAvailableActions(res.data);
        } catch { /* non-critical */ }
    }, []);

    useEffect(() => { loadActions(); }, [loadActions]);

    useEffect(() => {
        loadLogs({
            search: search || undefined,
            action: actionFilter || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            page,
            per_page: 25,
        });
    }, [loadLogs, search, actionFilter, dateFrom, dateTo, page]);

    const handleSearch = (val: string) => { setSearch(val); setPage(1); };
    const handleAction = (val: string) => { setActionFilter(val); setPage(1); };
    const handleDateFrom = (val: string) => { setDateFrom(val); setPage(1); };
    const handleDateTo = (val: string) => { setDateTo(val); setPage(1); };

    const inputCls = 'px-3 py-2.5 rounded-lg border border-border-strong bg-input-bg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition-colors';

    return (
        <div className="space-y-5 p-4">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-1 text-text-primary">Audit Logs</h1>
                    <p className="text-sm text-text-secondary">Who encoded what, status changes, login history</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-secondary">{dateTime.date}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Events', value: meta.total, color: '#0a84ff', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
                    { label: 'Logins', value: logs.filter(l => l.action === 'login').length + (page > 1 ? '+' : ''), color: '#30d158', icon: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1' },
                    { label: 'Status Changes', value: logs.filter(l => l.action === 'status_changed').length + (page > 1 ? '+' : ''), color: '#ff9f0a', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
                    { label: 'Reassignments', value: logs.filter(l => l.action === 'encoder_reassigned').length + (page > 1 ? '+' : ''), color: '#bf5af2', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
                ].map(({ label, value, color, icon }) => (
                    <div key={label} className="bg-surface-tint rounded-lg p-4 border border-border-tint">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-3xl font-bold tabular-nums text-text-primary">{value}</p>
                                <p className="text-xs mt-1 text-text-secondary">{label}</p>
                            </div>
                            <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                                <svg className="w-4.5 h-4.5" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                                </svg>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="bg-surface rounded-lg border border-border p-4">
                <div className="flex flex-wrap gap-3 items-center">
                    <input
                        type="text"
                        placeholder="Search description or user…"
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        className={`${inputCls} flex-1 min-w-[200px]`}
                    />
                    <select value={actionFilter} onChange={e => handleAction(e.target.value)} className={inputCls}>
                        <option value="">All Actions</option>
                        {availableActions.map(a => (
                            <option key={a} value={a}>{getActionCfg(a).label}</option>
                        ))}
                    </select>
                    <input type="date" value={dateFrom} onChange={e => handleDateFrom(e.target.value)} className={inputCls} />
                    <input type="date" value={dateTo} onChange={e => handleDateTo(e.target.value)} className={inputCls} />
                    {(search || actionFilter || dateFrom || dateTo) && (
                        <button
                            onClick={() => { setSearch(''); setActionFilter(''); setDateFrom(''); setDateTo(''); setPage(1); }}
                            className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-border-strong bg-input-bg text-text-secondary hover:text-text-primary transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-lg text-sm" style={{ backgroundColor: 'rgba(255,69,58,0.1)', color: '#ff453a' }}>
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="bg-surface rounded-lg border border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex justify-between items-center">
                    <h2 className="text-sm font-bold text-text-primary">Event Log</h2>
                    <span className="text-xs font-semibold px-2 py-1 rounded-md bg-surface-tint border border-border-tint text-text-secondary">
                        {meta.total} total · Page {meta.current_page} of {meta.last_page}
                    </span>
                </div>

                {isLoading ? (
                    <div className="p-16 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#0a84ff' }} />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="py-16 text-center">
                        <p className="text-sm font-semibold text-text-secondary mb-1">No events found</p>
                        <p className="text-xs text-text-muted">
                            {search || actionFilter || dateFrom || dateTo ? 'Try adjusting your filters.' : 'Events will appear here as actions are performed.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    {['Timestamp', 'User', 'Action', 'Subject', 'Description', 'IP Address'].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, idx) => {
                                    const cfg = getActionCfg(log.action);
                                    return (
                                        <tr key={log.id} className={`border-b border-border/50 transition-colors hover:bg-hover ${idx % 2 !== 0 ? 'bg-surface-secondary/40' : ''}`}>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <p className="text-xs tabular-nums text-text-secondary">{formatDate(log.created_at)}</p>
                                            </td>
                                            <td className="px-5 py-3">
                                                {log.user ? (
                                                    <>
                                                        <p className="font-medium text-text-primary">{log.user.name}</p>
                                                        <p className="text-xs capitalize text-text-muted">{log.user.role}</p>
                                                    </>
                                                ) : (
                                                    <span className="text-text-muted">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold capitalize"
                                                    style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                {log.subject_type ? (
                                                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-surface-tint border border-border-tint text-text-secondary capitalize">
                                                        {log.subject_type} #{log.subject_id}
                                                    </span>
                                                ) : (
                                                    <span className="text-text-muted">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 max-w-xs text-text-secondary">
                                                <p className="truncate" title={log.description}>{log.description}</p>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap text-xs tabular-nums text-text-muted">
                                                {log.ip_address ?? '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

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
