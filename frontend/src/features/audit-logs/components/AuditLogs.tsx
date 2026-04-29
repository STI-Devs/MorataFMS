import { CurrentDateTime } from '../../../components/CurrentDateTime';
import { useAuditLogsWorkspace } from '../hooks/useAuditLogsWorkspace';
import { EVENT_CFG } from '../utils/auditLog.utils';
import { AuditLogTableRow } from './AuditLogTableRow';

const inputCls =
    'px-3 py-2.5 rounded-lg border border-border-strong bg-input-bg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition-colors';

export const AuditLogs = () => {
    const {
        search,
        actionFilter,
        actorFilter,
        dateFrom,
        dateTo,
        page,
        expandedId,
        logs,
        meta,
        isLoading,
        isError,
        refetch,
        toggleExpanded,
        handleSearch,
        handleAction,
        handleActor,
        handleDateFrom,
        handleDateTo,
        goToPreviousPage,
        goToNextPage,
    } = useAuditLogsWorkspace();

    return (
        <div className="space-y-5 p-4">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-1 text-text-primary">Audit Logs</h1>
                    <p className="text-sm text-text-secondary">Record of all create, update, and delete events in the system</p>
                </div>
                <CurrentDateTime
                    className="text-right hidden sm:block shrink-0"
                    timeClassName="text-2xl font-bold tabular-nums text-text-primary"
                    dateClassName="text-sm text-text-secondary"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Events', value: meta.total, color: '#0a84ff', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
                    { label: 'Created', value: String(logs.filter((l) => l.event === 'created').length) + (page > 1 ? '+' : ''), color: '#30d158', icon: 'M12 4v16m8-8H4' },
                    { label: 'Updated', value: String(logs.filter((l) => l.event === 'updated').length) + (page > 1 ? '+' : ''), color: '#ff9f0a', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
                    { label: 'Deleted', value: String(logs.filter((l) => l.event === 'deleted').length) + (page > 1 ? '+' : ''), color: '#ff453a', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
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
                            onChange={(e) => handleSearch(e.target.value)}
                            className={`${inputCls} min-w-[150px] !h-8 !py-0 !text-xs`}
                        />
                        <select
                            value={actorFilter}
                            onChange={(e) => handleActor(e.target.value as 'human' | 'system' | 'all')}
                            className={`${inputCls} !h-8 !py-0 !text-xs`}
                        >
                            <option value="human">User Actions</option>
                            <option value="system">System Events</option>
                            <option value="all">All Activity</option>
                        </select>
                        <select
                            value={actionFilter}
                            onChange={(e) => handleAction(e.target.value)}
                            className={`${inputCls} !h-8 !py-0 !text-xs`}
                        >
                            <option value="">All Events</option>
                            {Object.entries(EVENT_CFG).map(([key, cfg]) => (
                                <option key={key} value={key}>{cfg.label}</option>
                            ))}
                        </select>
                        <input type="date" value={dateFrom} onChange={(e) => handleDateFrom(e.target.value)} className={`${inputCls} !h-8 !py-0 !text-xs`} />
                        <input type="date" value={dateTo} onChange={(e) => handleDateTo(e.target.value)} className={`${inputCls} !h-8 !py-0 !text-xs`} />
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
                            onClick={() => void refetch()}
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
                                    {['Timestamp', 'User', 'Event', 'Record', 'Changes', 'IP', ''].map((h) => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted last:w-8">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, idx) => (
                                    <AuditLogTableRow
                                        key={log.id}
                                        log={log}
                                        idx={idx}
                                        isOpen={expandedId === log.id}
                                        onToggle={() => toggleExpanded(log.id)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {meta.last_page > 1 && (
                    <div className="px-5 py-4 border-t border-border flex justify-between items-center">
                        <button
                            onClick={goToPreviousPage}
                            disabled={page === 1}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border border-border-strong bg-input-bg text-text-secondary hover:text-text-primary transition-colors disabled:opacity-40"
                        >
                            ← Previous
                        </button>
                        <span className="text-sm text-text-secondary">Page {meta.current_page} of {meta.last_page}</span>
                        <button
                            onClick={goToNextPage}
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
