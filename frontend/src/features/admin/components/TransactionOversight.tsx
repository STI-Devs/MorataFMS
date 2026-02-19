import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { transactionApi } from '../api/transactionApi';
import { ReassignModal } from './ReassignModal';
import { StatusOverrideModal } from './StatusOverrideModal';
import type { OversightTransaction } from '../types/transaction.types';

interface LayoutContext {
    user?: { name: string; role: string };
    dateTime: { time: string; date: string };
}

type TypeFilter = 'all' | 'import' | 'export';
type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';

const STATUS_CFG: Record<string, { color: string; bg: string }> = {
    completed: { color: '#30d158', bg: 'rgba(48,209,88,0.13)' },
    in_progress: { color: '#64d2ff', bg: 'rgba(100,210,255,0.13)' },
    cancelled: { color: '#ff453a', bg: 'rgba(255,69,58,0.13)' },
    pending: { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' },
};

const TYPE_CFG: Record<string, { color: string; bg: string }> = {
    import: { color: '#0a84ff', bg: 'rgba(10,132,255,0.13)' },
    export: { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' },
};

export const TransactionOversight = () => {
    const { dateTime } = useOutletContext<LayoutContext>();

    const [transactions, setTransactions] = useState<OversightTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [reassignTarget, setReassignTarget] = useState<OversightTransaction | null>(null);
    const [statusTarget, setStatusTarget] = useState<OversightTransaction | null>(null);
    const [stats, setStats] = useState({ total: 0, imports: 0, exports: 0 });

    useEffect(() => { loadTransactions(); }, []);

    const loadTransactions = async () => {
        try {
            setIsLoading(true);
            const res = await transactionApi.getAllTransactions();
            setTransactions(res.data);
            setStats({ total: res.total, imports: res.imports_count, exports: res.exports_count });
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load transactions.');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter((t) => {
            const matchesType = typeFilter === 'all' || t.type === typeFilter;
            const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
            const search = searchTerm.toLowerCase();
            const matchesSearch =
                !search ||
                t.reference_no?.toLowerCase().includes(search) ||
                t.bl_no?.toLowerCase().includes(search) ||
                t.client?.toLowerCase().includes(search) ||
                t.assigned_to?.toLowerCase().includes(search);
            return matchesType && matchesStatus && matchesSearch;
        });
    }, [transactions, typeFilter, statusFilter, searchTerm]);

    const handleReassignSuccess = (id: number, type: 'import' | 'export', assignedTo: string, assignedUserId: number) => {
        setTransactions((prev) =>
            prev.map((t) =>
                t.id === id && t.type === type ? { ...t, assigned_to: assignedTo, assigned_user_id: assignedUserId } : t
            )
        );
    };

    const handleStatusSuccess = (id: number, type: 'import' | 'export', newStatus: string) => {
        setTransactions((prev) =>
            prev.map((t) => (t.id === id && t.type === type ? { ...t, status: newStatus } : t))
        );
    };

    return (
        <div className="space-y-5 p-4">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-1 text-text-primary">Transaction Oversight</h1>
                    <p className="text-sm text-text-secondary">All imports & exports — reassign encoders, override statuses</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-secondary">{dateTime.date}</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Total Transactions', value: stats.total, color: '#0a84ff', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                    { label: 'Imports', value: stats.imports, color: '#30d158', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
                    { label: 'Exports', value: stats.exports, color: '#ff9f0a', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
                ].map((card) => (
                    <div key={card.label} className="bg-surface-tint rounded-lg p-4 border border-border-tint">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-3xl font-bold tabular-nums text-text-primary">{card.value}</p>
                                <p className="text-xs mt-1 text-text-secondary">{card.label}</p>
                            </div>
                            <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ backgroundColor: `${card.color}20` }}>
                                <svg className="w-4.5 h-4.5" fill="none" stroke={card.color} viewBox="0 0 24 24" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                                </svg>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {error && (
                <div className="p-4 rounded-lg text-sm" style={{ backgroundColor: 'rgba(255,69,58,0.1)', color: '#ff453a' }}>
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="bg-surface rounded-lg border border-border overflow-hidden">
                {/* Controls - integrated into the card */}
                <div className="p-3 border-b border-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-surface-subtle">
                    <div className="relative flex-1 max-w-sm">
                        <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 h-9 rounded-md border border-border-strong bg-input-bg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>

                    <div className="flex h-9 rounded-md border border-border-strong overflow-hidden shrink-0">
                        {(['all', 'import', 'export'] as TypeFilter[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTypeFilter(t)}
                                className={`px-3 py-1 text-xs font-bold capitalize transition-colors ${typeFilter === t
                                    ? 'bg-text-primary text-surface'
                                    : 'bg-input-bg text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                {t === 'all' ? 'All' : t === 'import' ? 'Imports' : 'Exports'}
                            </button>
                        ))}
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                        className="px-3 h-9 rounded-md border border-border-strong bg-input-bg text-text-primary text-xs focus:outline-none focus:border-blue-500/50 transition-colors shrink-0"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <button
                        onClick={loadTransactions}
                        className="px-3 h-9 rounded-md border border-border-strong bg-input-bg text-text-secondary text-xs font-semibold hover:text-text-primary transition-colors flex items-center gap-1.5 shrink-0"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
                {isLoading ? (
                    <div className="p-16 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#0a84ff' }} />
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
                                    {['Type', 'Ref / BL No', 'Client', 'Date', 'Status', 'Encoder', 'Actions'].map((h) => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((t, idx) => {
                                    const sc = STATUS_CFG[t.status] ?? STATUS_CFG.pending;
                                    const tc = TYPE_CFG[t.type] ?? TYPE_CFG.import;
                                    return (
                                        <tr
                                            key={`${t.type}-${t.id}`}
                                            className={`border-b border-border/50 transition-colors hover:bg-hover ${idx % 2 !== 0 ? 'bg-surface-secondary/40' : ''}`}
                                        >
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold capitalize"
                                                    style={{ color: tc.color, backgroundColor: tc.bg }}>
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tc.color }} />
                                                    {t.type}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="text-sm font-semibold text-text-primary">{t.reference_no || '—'}</p>
                                                {t.bl_no && <p className="text-xs text-text-muted mt-0.5">BL: {t.bl_no}</p>}
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-text-secondary">{t.client || '—'}</td>
                                            <td className="px-5 py-3.5 text-sm text-text-secondary">
                                                {t.date ? new Date(t.date).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold capitalize"
                                                    style={{ color: sc.color, backgroundColor: sc.bg }}>
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.color }} />
                                                    {t.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-text-secondary">
                                                {t.assigned_to || <span className="text-text-muted italic">Unassigned</span>}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setReassignTarget(t)}
                                                        className="px-3 py-1.5 rounded-md text-xs font-semibold bg-surface-elevated border border-border text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
                                                    >
                                                        Reassign
                                                    </button>
                                                    <button
                                                        onClick={() => setStatusTarget(t)}
                                                        className="px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                                                        style={{ backgroundColor: 'rgba(10,132,255,0.12)', color: '#0a84ff' }}
                                                    >
                                                        Override
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
