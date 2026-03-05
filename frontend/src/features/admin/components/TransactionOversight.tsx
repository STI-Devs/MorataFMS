import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Icon } from '../../../components/Icon';
import type { LayoutContext } from '../../tracking/types';
import { useAllTransactions } from '../hooks/useTransactions';
import type { OversightTransaction } from '../types/transaction.types';
import { ReassignModal } from './ReassignModal';
import { StatusOverrideModal } from './StatusOverrideModal';

// ─── Types ────────────────────────────────────────────────────────────────────

type TypeFilter   = 'all' | 'import' | 'export';
type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';

// ─── Colour maps ──────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { color: string; bg: string }> = {
    completed:   { color: '#30d158', bg: 'rgba(48,209,88,0.13)'   },
    in_progress: { color: '#64d2ff', bg: 'rgba(100,210,255,0.13)' },
    cancelled:   { color: '#ff453a', bg: 'rgba(255,69,58,0.13)'   },
    pending:     { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)'  },
};

const TYPE_CFG: Record<string, { color: string; bg: string }> = {
    import: { color: '#0a84ff', bg: 'rgba(10,132,255,0.13)' },
    export: { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const TransactionOversight = () => {
    const { dateTime } = useOutletContext<LayoutContext>();
    const qc = useQueryClient();

    const [searchTerm,    setSearchTerm]    = useState('');
    const [typeFilter,    setTypeFilter]    = useState<TypeFilter>('all');
    const [statusFilter,  setStatusFilter]  = useState<StatusFilter>('all');
    const [reassignTarget, setReassignTarget] = useState<OversightTransaction | null>(null);
    const [statusTarget,   setStatusTarget]   = useState<OversightTransaction | null>(null);

    const { data, isLoading, isError, refetch } = useAllTransactions();

    const transactions: OversightTransaction[] = data?.data ?? [];
    const stats = {
        total:   data?.total          ?? 0,
        imports: data?.imports_count  ?? 0,
        exports: data?.exports_count  ?? 0,
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter((t) => {
            const matchesType   = typeFilter   === 'all' || t.type   === typeFilter;
            const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
            const search = searchTerm.toLowerCase();
            const matchesSearch =
                !search ||
                t.reference_no?.toLowerCase().includes(search) ||
                t.bl_no?.toLowerCase().includes(search)        ||
                t.client?.toLowerCase().includes(search)       ||
                t.assigned_to?.toLowerCase().includes(search);
            return matchesType && matchesStatus && matchesSearch;
        });
    }, [transactions, typeFilter, statusFilter, searchTerm]);

    // Invalidate cache after modal success to get fresh data
    const handleReassignSuccess = () => qc.invalidateQueries({ queryKey: ['admin', 'transactions'] });
    const handleStatusSuccess   = () => qc.invalidateQueries({ queryKey: ['admin', 'transactions'] });

    return (
        <div className="space-y-5 p-4">

            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-1 text-text-primary">Transaction Oversight</h1>
                    <p className="text-sm text-text-secondary">All imports &amp; exports — reassign encoders, override statuses</p>
                </div>
                <div className="text-right hidden sm:block shrink-0">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-secondary">{dateTime.date}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Total Active', value: stats.total,   color: '#30d158', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
                    { label: 'Imports',      value: stats.imports, color: '#0a84ff', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
                    { label: 'Exports',      value: stats.exports, color: '#ff9f0a', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0' },
                ].map((card) => (
                    <div key={card.label} className="bg-surface rounded-lg p-4 border border-border flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-secondary mb-1">{card.label}</p>
                            <p className="text-3xl font-bold tabular-nums text-text-primary">{card.value}</p>
                        </div>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${card.color}20` }}>
                            <svg className="w-5 h-5" fill="none" stroke={card.color} viewBox="0 0 24 24" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table card */}
            <div className="bg-surface rounded-xl border border-border overflow-hidden">

                {/* Toolbar */}
                <div className="p-3 border-b border-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-surface-subtle">

                    {/* Search */}
                    <div className="relative flex-1 max-w-sm">
                        <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by ref, BL, client, encoder..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 h-9 rounded-lg border border-border bg-surface text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>

                    <div className="flex gap-2 sm:w-auto overflow-x-auto">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                            className="h-9 rounded-md border border-border bg-surface text-text-primary text-sm px-3 focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer shrink-0"
                        >
                            <option value="all">All Types</option>
                            <option value="import">Imports</option>
                            <option value="export">Exports</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                            className="h-9 rounded-md border border-border bg-surface text-text-primary text-sm px-3 focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer shrink-0"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Body */}
                {isLoading ? (
                    <div className="p-16 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-[3px] border-border animate-spin" style={{ borderTopColor: '#0a84ff' }} />
                    </div>
                ) : isError ? (
                    <div className="p-16 text-center">
                        <p className="text-sm text-red-500 font-medium">Failed to load transactions. Please try again.</p>
                        <button onClick={() => refetch()} className="mt-3 text-xs text-blue-500 hover:underline">Retry</button>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-text-muted text-sm">
                            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                                ? 'No transactions match your filters.'
                                : 'No transactions found.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    {['Type', 'Ref No / BL', 'Client', 'Status', 'Encoder', 'Created', 'Actions'].map((h) => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((t, idx) => {
                                    const sc = STATUS_CFG[t.status] ?? STATUS_CFG.pending;
                                    const tc = TYPE_CFG[t.type]     ?? TYPE_CFG.import;
                                    return (
                                        <tr
                                            key={`${t.type}-${t.id}`}
                                            className={`border-b border-border transition-colors hover:bg-hover ${idx % 2 !== 0 ? 'bg-surface-secondary/40' : ''}`}
                                        >
                                            {/* Type */}
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold capitalize"
                                                    style={{ color: tc.color, backgroundColor: tc.bg }}>
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tc.color }} />
                                                    {t.type}
                                                </span>
                                            </td>
                                            {/* Ref / BL */}
                                            <td className="px-5 py-3.5">
                                                <p className="text-sm font-semibold text-text-primary">{t.reference_no || '—'}</p>
                                                {t.bl_no && <p className="text-xs text-text-muted mt-0.5">BL: {t.bl_no}</p>}
                                            </td>
                                            {/* Client */}
                                            <td className="px-5 py-3.5 text-sm text-text-secondary">{t.client || '—'}</td>
                                            {/* Status */}
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold capitalize"
                                                    style={{ color: sc.color, backgroundColor: sc.bg }}>
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.color }} />
                                                    {t.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            {/* Encoder */}
                                            <td className="px-5 py-3.5 text-sm text-text-secondary">
                                                {t.assigned_to || <span className="text-text-muted italic">Unassigned</span>}
                                            </td>
                                            {/* Created */}
                                            <td className="px-5 py-3.5 text-sm text-text-secondary">
                                                {t.date ? new Date(t.date).toLocaleDateString() : '—'}
                                            </td>
                                            {/* Actions */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => setReassignTarget(t)}
                                                        className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                                        title="Reassign Encoder"
                                                    >
                                                        <Icon name="user" className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setStatusTarget(t)}
                                                        className="p-1.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-md transition-colors"
                                                        title="Override Status"
                                                    >
                                                        <Icon name="alert-circle" className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="px-5 py-3 border-t border-border text-xs text-text-muted">
                            Showing {filteredTransactions.length} of {stats.total} transactions
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <ReassignModal
                isOpen={!!reassignTarget}
                onClose={() => setReassignTarget(null)}
                transaction={reassignTarget}
                onSuccess={handleReassignSuccess}
            />
            <StatusOverrideModal
                isOpen={!!statusTarget}
                onClose={() => setStatusTarget(null)}
                transaction={statusTarget}
                onSuccess={handleStatusSuccess}
            />
        </div>
    );
};
