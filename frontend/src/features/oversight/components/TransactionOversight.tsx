import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Icon } from '../../../components/Icon';
import { Pagination } from '../../../components/Pagination';
import { useDebounce } from '../../../hooks/useDebounce';
import type { LayoutContext } from '../../tracking/types';
import { useAllTransactions } from '../hooks/useTransactions';
import type { OversightTransaction } from '../types/transaction.types';
import { ReassignModal } from './ReassignModal';
import { RemarkModal } from './RemarkModal';
import { StatusOverrideModal } from './StatusOverrideModal';
import { TransactionDetailDrawer } from './TransactionDetailDrawer';


type TypeFilter = 'all' | 'import' | 'export';
type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';


const STATUS_CFG: Record<string, { color: string; bg: string }> = {
    completed: { color: '#30d158', bg: 'rgba(48,209,88,0.13)' },
    in_progress: { color: '#0a84ff', bg: 'rgba(10,132,255,0.13)' },
    cancelled: { color: '#ff453a', bg: 'rgba(255,69,58,0.13)' },
    pending: { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' },
};

const TYPE_CFG: Record<string, { color: string; bg: string }> = {
    import: { color: '#0a84ff', bg: 'rgba(10,132,255,0.13)' },
    export: { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' },
};


export const TransactionOversight = () => {
    const { dateTime } = useOutletContext<LayoutContext>();
    const qc = useQueryClient();

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [reassignTarget, setReassignTarget] = useState<OversightTransaction | null>(null);
    const [statusTarget, setStatusTarget] = useState<OversightTransaction | null>(null);
    const [remarkTarget, setRemarkTarget] = useState<OversightTransaction | null>(null);
    const [detailTarget, setDetailTarget] = useState<OversightTransaction | null>(null);

    const { data, isLoading, isError, refetch } = useAllTransactions({
        page,
        per_page: perPage,
        search: debouncedSearch,
        status: statusFilter,
        type: typeFilter !== 'all' ? typeFilter : undefined,
    });

    const stats = {
        total: data?.total ?? 0,
        imports: data?.imports_count ?? 0,
        exports: data?.exports_count ?? 0,
    };

    const transactions: OversightTransaction[] = data?.data ?? [];
    const meta = data?.meta;

    // Invalidate cache after modal success to get fresh data
    const handleReassignSuccess = () => qc.invalidateQueries({ queryKey: ['admin', 'transactions'] });
    const handleStatusSuccess = () => qc.invalidateQueries({ queryKey: ['admin', 'transactions'] });

    return (
        <div className="space-y-5 p-4">

            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-1 text-text-primary">Transaction Oversight</h1>
                    <p className="text-sm text-text-secondary">All imports &amp; exports — reassign encoders, override statuses</p>
                </div>
                <div className="flex items-center gap-6 hidden sm:flex shrink-0">
                    <div className="text-right">
                        <p className="text-2xl font-bold tabular-nums text-text-primary leading-none">{dateTime.time}</p>
                        <p className="text-xs font-semibold text-text-muted mt-1 uppercase tracking-widest leading-none">{dateTime.date}</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Total Transactions', value: stats.total, color: '#0a84ff', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                    { label: 'Imports', value: stats.imports, color: '#30d158', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
                    { label: 'Exports', value: stats.exports, color: '#ff9f0a', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
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
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-9 pr-3 h-9 rounded-lg border border-border bg-surface text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>

                    {/* Type pill toggle */}
                    <div className="flex h-9 rounded-lg border border-border overflow-hidden shrink-0">
                        {(['all', 'import', 'export'] as TypeFilter[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => {
                                    setTypeFilter(t);
                                    setPage(1);
                                }}
                                className={`px-3 py-1 text-xs font-bold capitalize transition-colors ${typeFilter === t
                                    ? 'bg-text-primary text-surface'
                                    : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                {t === 'all' ? 'All' : t === 'import' ? 'Imports' : 'Exports'}
                            </button>
                        ))}
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value as StatusFilter);
                            setPage(1);
                        }}
                        className="h-9 rounded-md border border-border bg-surface text-text-primary text-sm px-3 focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer shrink-0"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
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
                ) : transactions.length === 0 ? (
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
                                    {['Type', 'Ref No / BL', 'Client', 'Status', 'Encoder', 'Created', 'Remarks', 'Actions'].map((h) => (
                                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((t, idx) => {
                                    const sc = STATUS_CFG[t.status] ?? STATUS_CFG.pending;
                                    const tc = TYPE_CFG[t.type] ?? TYPE_CFG.import;
                                    const rowKey = `${t.type}-${t.id}`;
                                    return (
                                        <>
                                            <tr
                                                key={rowKey}
                                                onClick={() => setDetailTarget(t)}
                                                className={`border-b border-border transition-colors hover:bg-hover cursor-pointer ${idx % 2 !== 0 ? 'bg-surface-secondary/40' : ''}`}
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
                                                    {t.reference_no && <p className="text-sm font-semibold text-text-primary">{t.reference_no}</p>}
                                                    {t.bl_no && <p className={`text-xs mt-0.5 ${t.reference_no ? 'text-text-muted' : 'text-sm font-semibold text-text-primary'}`}>{t.bl_no}</p>}
                                                    {!t.reference_no && !t.bl_no && <p className="text-sm font-semibold text-text-primary">—</p>}
                                                </td>
                                                {/* Client */}
                                                <td className="px-5 py-3.5 text-sm text-text-secondary">{t.client || '—'}</td>
                                                {/* Status */}
                                                <td className="px-5 py-3.5">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold capitalize whitespace-nowrap"
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
                                                {/* Remarks badge */}
                                                <td className="px-5 py-3.5">
                                                    {t.open_remarks_count > 0 ? (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setRemarkTarget(t); }}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition-colors"
                                                            style={{ color: '#ff453a', backgroundColor: 'rgba(255,69,58,0.12)' }}
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                            </svg>
                                                            {t.open_remarks_count}
                                                        </button>
                                                    ) : (
                                                        <span className="text-text-muted text-xs">—</span>
                                                    )}
                                                </td>
                                                {/* Actions */}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex gap-1.5">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setReassignTarget(t); }}
                                                            className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                                            title="Reassign Encoder"
                                                        >
                                                            <Icon name="user" className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setStatusTarget(t); }}
                                                            className="p-1.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-md transition-colors"
                                                            title="Override Status"
                                                        >
                                                            <Icon name="alert-circle" className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setRemarkTarget(t); }}
                                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                                            title="Flag / Remarks"
                                                        >
                                                            <Icon name="flag" className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        </>
                                    );
                                })}
                            </tbody>
                        </table>
                        {meta && meta.last_page > 1 ? (
                            <Pagination
                                currentPage={meta.current_page}
                                totalPages={meta.last_page}
                                perPage={meta.per_page}
                                onPageChange={setPage}
                                onPerPageChange={(value) => {
                                    setPerPage(value);
                                    setPage(1);
                                }}
                            />
                        ) : (
                            <div className="px-5 py-3 border-t border-border text-xs text-text-muted">
                                Showing {transactions.length} of {stats.total} transactions
                            </div>
                        )}
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

            <RemarkModal
                isOpen={!!remarkTarget}
                onClose={() => setRemarkTarget(null)}
                transactionType={remarkTarget?.type ?? 'import'}
                transactionId={remarkTarget?.id ?? null}
                transactionLabel={`${remarkTarget?.type === 'import' ? 'Import' : 'Export'} — ${remarkTarget?.bl_no || remarkTarget?.reference_no || `#${remarkTarget?.id}`}`}
            />

            {/* Transaction Detail Drawer */}
            <TransactionDetailDrawer
                transaction={detailTarget}
                onClose={() => setDetailTarget(null)}
            />
        </div>
    );
};
