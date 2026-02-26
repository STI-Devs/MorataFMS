import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ReassignModal } from './ReassignModal';
import { StatusOverrideModal } from './StatusOverrideModal';
import { useTransactions } from '../hooks/useTransactions';
import { Spinner } from '../../../components/Spinner';
import { getStatusStyle } from '../../../lib/statusStyles';
import { StatusBadge } from '../../../components/StatusBadge';
import { Icon } from '../../../components/Icon';
import type { OversightTransaction } from '../types/transaction.types';
import type { LayoutContext } from '../../tracking/types';

type TypeFilter = 'all' | 'import' | 'export';
type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';

const TYPE_CFG: Record<string, { color: string; bg: string }> = {
    import: { color: '#0a84ff', bg: 'rgba(10,132,255,0.13)' },
    export: { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' },
};

export const TransactionOversight = () => {
    const { dateTime } = useOutletContext<LayoutContext>();
    const queryClient = useQueryClient();

    const { data, isLoading } = useTransactions();

    const transactions = data?.data ?? [];
    const stats = {
        total: data?.total ?? 0,
        imports: data?.imports_count ?? 0,
        exports: data?.exports_count ?? 0,
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [reassignTarget, setReassignTarget] = useState<OversightTransaction | null>(null);
    const [statusTarget, setStatusTarget] = useState<OversightTransaction | null>(null);

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
        queryClient.setQueryData(['admin-transactions'], (old: typeof data) => {
            if (!old) return old;
            return {
                ...old,
                data: old.data.map(t =>
                    t.id === id && t.type === type ? { ...t, assigned_to: assignedTo, assigned_user_id: assignedUserId } : t
                ),
            };
        });
    };

    const handleStatusSuccess = (id: number, type: 'import' | 'export', newStatus: string) => {
        queryClient.setQueryData(['admin-transactions'], (old: typeof data) => {
            if (!old) return old;
            return {
                ...old,
                data: old.data.map(t =>
                    t.id === id && t.type === type ? { ...t, status: newStatus } : t
                ),
            };
        });
    };

    return (
        <div className="space-y-5 p-4">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-1 text-text-primary">Transaction Oversight</h1>
                    <p className="text-sm text-text-secondary">All imports &amp; exports — reassign encoders, override statuses</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-secondary">{dateTime.date}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                    { label: 'Total Active', value: stats.total, color: '#30d158' },
                    { label: 'Imports', value: stats.imports, color: '#0a84ff' },
                    { label: 'Exports', value: stats.exports, color: '#ff9f0a' },
                ].map(stat => (
                    <div key={stat.label} className="bg-surface-tint rounded-lg p-4 border border-border-tint flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-secondary mb-1">{stat.label}</p>
                            <p className="text-3xl font-bold tabular-nums text-text-primary">{stat.value}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-elevated shadow-sm border border-border-strong">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color, boxShadow: `0 0 8px ${stat.color}80` }} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-surface rounded-lg border border-border flex flex-col min-h-0" style={{ height: 'calc(100vh - 270px)' }}>
                <div className="shrink-0 p-3 border-b border-border flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface-subtle">
                    <div className="relative w-full sm:max-w-xs">
                        <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search by ref, BL, client, encoder..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 h-9 rounded-md border border-border-strong bg-input-bg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/50"
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                            className="h-9 rounded-md border border-border-strong bg-input-bg text-text-primary text-sm px-3 focus:outline-none cursor-pointer"
                        >
                            <option value="all">All Types</option>
                            <option value="import">Imports</option>
                            <option value="export">Exports</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                            className="h-9 rounded-md border border-border-strong bg-input-bg text-text-primary text-sm px-3 focus:outline-none cursor-pointer"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending/Processing</option>
                            <option value="in_progress">In Transit</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled/Delayed</option>
                        </select>
                    </div>
                </div>

                <div className="shrink-0 grid grid-cols-7 gap-4 px-6 py-2 border-b border-border bg-surface font-bold">
                    <span className="text-xs text-text-secondary uppercase tracking-wider">Type</span>
                    <span className="text-xs text-text-secondary uppercase tracking-wider">Ref No / BL</span>
                    <span className="text-xs text-text-secondary uppercase tracking-wider">Client</span>
                    <span className="text-xs text-text-secondary uppercase tracking-wider">Status</span>
                    <span className="text-xs text-text-secondary uppercase tracking-wider">Encoder</span>
                    <span className="text-xs text-text-secondary uppercase tracking-wider">Created</span>
                    <span className="text-xs text-text-secondary uppercase tracking-wider text-right">Actions</span>
                </div>

                <div className="flex-1 overflow-y-auto min-h-[200px]">
                    {isLoading ? (
                        <Spinner color="#9ca3af" />
                    ) : filteredTransactions.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center h-full text-text-muted">
                            <Icon name="search" className="w-12 h-12 mb-4 opacity-50" />
                            <p>No transactions match your filters.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {filteredTransactions.map(t => (
                                <div key={`${t.type}-${t.id}`} className="grid grid-cols-7 gap-4 px-6 py-3.5 items-center hover:bg-hover/50 transition-colors">
                                    <div>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-border" style={{ backgroundColor: TYPE_CFG[t.type].bg, color: TYPE_CFG[t.type].color }}>
                                            {t.type}
                                        </span>
                                    </div>
                                    <div className="min-w-0 pr-4">
                                        <p className="text-sm font-bold text-text-primary truncate">{t.reference_no}</p>
                                        <p className="text-xs text-text-muted truncate">{t.bl_no || '—'}</p>
                                    </div>
                                    <div className="min-w-0 pr-4">
                                        <p className="text-sm font-bold text-text-primary truncate">{t.client || '—'}</p>
                                        <p className="text-xs text-text-muted truncate">{t.vessel || t.destination || '—'}</p>
                                    </div>
                                    <div>
                                        {/* Use shared getStatusStyle mapping, but admin view has raw strings */}
                                        <StatusBadge
                                            status={t.status === 'completed' ? 'Completed' : t.status === 'in_progress' ? 'In Transit' : t.status === 'cancelled' ? 'Delayed' : 'Pending'}
                                        />
                                    </div>
                                    <div className="min-w-0 pr-4">
                                        <p className="text-sm font-bold text-text-primary truncate">{t.assigned_to || 'Unassigned'}</p>
                                    </div>
                                    <p className="text-sm text-text-secondary">{t.date}</p>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setReassignTarget(t)} className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-surface-elevated border border-border-strong hover:bg-hover transition-colors text-text-primary flex items-center gap-1.5" title="Reassign Encoder">
                                            <Icon name="user-plus" className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => setStatusTarget(t)} className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-surface-elevated border border-border-strong hover:bg-hover transition-colors text-text-primary flex items-center gap-1.5" title="Override Status">
                                            <Icon name="alert-triangle" className="w-3.5 h-3.5 text-orange-500" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {reassignTarget && (
                <ReassignModal
                    isOpen={true}
                    onClose={() => setReassignTarget(null)}
                    transaction={reassignTarget}
                    onSuccess={(assignedTo, assignedUserId) => {
                        handleReassignSuccess(reassignTarget.id, reassignTarget.type, assignedTo, assignedUserId);
                        setReassignTarget(null);
                    }}
                />
            )}

            {statusTarget && (
                <StatusOverrideModal
                    isOpen={true}
                    onClose={() => setStatusTarget(null)}
                    transaction={statusTarget}
                    onSuccess={(newStatus) => {
                        handleStatusSuccess(statusTarget.id, statusTarget.type, newStatus);
                        setStatusTarget(null);
                    }}
                />
            )}
        </div>
    );
};
