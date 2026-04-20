import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CurrentDateTime } from '../../../components/CurrentDateTime';
import { Icon } from '../../../components/Icon';
import { Pagination } from '../../../components/Pagination';
import { useDebounce } from '../../../hooks/useDebounce';
import { trackingKeys } from '../../tracking/utils/queryKeys';
import { transactionApi } from '../api/transactionApi';
import { useAllTransactions } from '../hooks/useTransactions';
import type { OversightTransaction } from '../types/transaction.types';
import { RemarkModal } from './RemarkModal';
import { StatusOverrideModal } from './StatusOverrideModal';
import { TransactionDetailDrawer } from './TransactionDetailDrawer';
import { useMemo, useEffect } from 'react';
import * as React from 'react';
import type { VesselGroup } from '../../tracking/types';
import { VesselGroupHeader } from '../../tracking/components/VesselGroupHeader';

type TypeFilter = 'all' | 'import' | 'export';
type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';

const COMPLETED_STATUS = 'completed';
const CANCELLED_STATUS = 'cancelled';

function normalizeStatus(status: string): string {
    return status.trim().toLowerCase().replace(/\s+/g, '_');
}

function formatCompactDate(dateString: string | null | undefined): string {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function getTransactionPrimaryRef(transaction: OversightTransaction): string {
    return transaction.reference_no || transaction.bl_no || `#${transaction.id}`;
}

function getTransactionSecondaryRef(transaction: OversightTransaction): string | null {
    if (transaction.reference_no && transaction.bl_no && transaction.bl_no !== transaction.reference_no) {
        return transaction.bl_no;
    }

    if (!transaction.reference_no && transaction.bl_no) {
        return null;
    }

    return transaction.vessel || null;
}

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

function isDelayedDate(dateString: string | null | undefined): boolean {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !Number.isNaN(date.getTime()) && date < new Date();
}

function buildOversightGroups(transactions: OversightTransaction[]): VesselGroup<OversightTransaction>[] {
    const grouped = new Map<string, OversightTransaction[]>();

    for (const t of transactions) {
        const vesselName = (t.vessel ?? 'Unknown Vessel').trim() || 'Unknown Vessel';
        const key = `${t.type}:${vesselName}`;
        const existing = grouped.get(key);
        if (existing) {
            existing.push(t);
        } else {
            grouped.set(key, [t]);
        }
    }

    const groups: VesselGroup<OversightTransaction>[] = [];

    for (const [groupKey, txns] of grouped.entries()) {
        const vesselName = txns[0]?.vessel?.trim() || 'Unknown Vessel';
        const groupType = txns[0]?.type ?? 'import';
        const eta = txns[0]?.date ?? null;
        const blocked = txns.filter(t => t.open_remarks_count > 0);
        const completed = txns.filter(t => normalizeStatus(t.status) === COMPLETED_STATUS);
        const in_progress = txns.filter(t => {
            const s = normalizeStatus(t.status);
            return s !== COMPLETED_STATUS && s !== CANCELLED_STATUS && s !== 'pending';
        });

        groups.push({
            vesselKey: groupKey,
            vesselName: vesselName || 'Unknown Vessel',
            voyage: null,
            eta,
            type: groupType,
            transactions: txns,
            stats: {
                total: txns.length,
                in_progress: in_progress.length,
                blocked: blocked.length,
                completed: completed.length,
            },
            isDelayed: isDelayedDate(eta) && completed.length < txns.length,
        });
    }

    return groups.sort((a, b) => {
        if (!a.eta) return 1;
        if (!b.eta) return -1;
        return new Date(a.eta).getTime() - new Date(b.eta).getTime();
    });
}


export const TransactionOversight = () => {
    const qc = useQueryClient();

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [statusTarget, setStatusTarget] = useState<OversightTransaction | null>(null);
    const [remarkTarget, setRemarkTarget] = useState<OversightTransaction | null>(null);
    const [detailTarget, setDetailTarget] = useState<OversightTransaction | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<OversightTransaction | null>(null);
    const [deletingTargetKey, setDeletingTargetKey] = useState<string | null>(null);

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

    const transactions = useMemo<OversightTransaction[]>(() => data?.data ?? [], [data?.data]);
    const meta = data?.meta;
    const visibleBlocked = transactions.filter((transaction) => transaction.open_remarks_count > 0).length;

    const groups = useMemo(() => buildOversightGroups(transactions), [transactions]);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set(groups.map((group) => group.vesselKey)));

    const seenGroupsRef = React.useRef<Set<string>>(new Set(groups.map(g => g.vesselKey)));

    useEffect(() => {
        setExpandedGroups(prev => {
            let hasNew = false;
            const next = new Set(prev);
            for (const g of groups) {
                if (!seenGroupsRef.current.has(g.vesselKey)) {
                    seenGroupsRef.current.add(g.vesselKey);
                    next.add(g.vesselKey);
                    hasNew = true;
                }
            }
            return hasNew ? next : prev;
        });
    }, [groups]);

    const toggleGroup = (key: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const invalidateTransactionCaches = (type?: 'import' | 'export') => {
        qc.invalidateQueries({ queryKey: ['admin', 'transactions'] });
        qc.invalidateQueries({ queryKey: ['transaction-detail'] });

        if (type === 'import') {
            qc.invalidateQueries({ queryKey: trackingKeys.imports.all });
            qc.invalidateQueries({ queryKey: trackingKeys.imports.stats });
            return;
        }

        if (type === 'export') {
            qc.invalidateQueries({ queryKey: trackingKeys.exports.all });
            qc.invalidateQueries({ queryKey: trackingKeys.exports.stats });
        }
    };

    const handleStatusSuccess = (_transactionId: number, type: 'import' | 'export') => {
        invalidateTransactionCaches(type);
    };

    const handleDelete = (transaction: OversightTransaction) => {
        setDeleteTarget(transaction);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const transaction = deleteTarget;
        setDeleteTarget(null);

        const rowKey = `${transaction.type}-${transaction.id}`;
        setDeletingTargetKey(rowKey);

        try {
            if (transaction.type === 'import') {
                await transactionApi.deleteImport(transaction.id);
            } else {
                await transactionApi.deleteExport(transaction.id);
            }

            invalidateTransactionCaches(transaction.type);
        } finally {
            setDeletingTargetKey(null);
        }
    };

    return (
        <div className="space-y-5 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Transaction Oversight</h1>
                        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
                            Monitor imports and exports by vessel while keeping transaction-level control over status, remarks, and encoder ownership.
                        </p>
                    </div>
                </div>
                <CurrentDateTime
                    className="text-right hidden sm:block shrink-0"
                    timeClassName="text-2xl font-bold tabular-nums text-text-primary leading-none"
                    dateClassName="text-xs font-semibold text-text-muted mt-1 uppercase tracking-widest leading-none"
                />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    {
                        label: 'Total Transactions',
                        value: stats.total,
                        detail: 'Across current oversight scope',
                        color: '#0a84ff',
                        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
                    },
                    {
                        label: 'Imports',
                        value: stats.imports,
                        detail: 'Import-side records',
                        color: '#30d158',
                        icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
                    },
                    {
                        label: 'Exports',
                        value: stats.exports,
                        detail: 'Export-side records',
                        color: '#ff9f0a',
                        icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
                    },
                    {
                        label: 'Needs Attention',
                        value: visibleBlocked,
                        detail: 'Visible rows with open remarks',
                        color: '#ff453a',
                        icon: 'M12 9v4m0 4h.01M10.29 3.86l-7.47 13A1 1 0 003.68 18h16.64a1 1 0 00.86-1.5l-7.47-13a1 1 0 00-1.72 0z',
                    },
                ].map((card) => (
                    <div key={card.label} className="rounded-2xl border border-border bg-gradient-to-br from-surface via-surface to-surface-secondary/55 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">{card.label}</p>
                                <p className="text-3xl font-semibold tabular-nums text-text-primary">{card.value}</p>
                                <p className="mt-2 text-xs text-text-muted">{card.detail}</p>
                            </div>
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/80 bg-surface shadow-sm" style={{ boxShadow: `inset 0 1px 0 ${card.color}22` }}>
                                <svg className="h-5 w-5" fill="none" stroke={card.color} viewBox="0 0 24 24" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                                </svg>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                <div className="border-b border-border bg-gradient-to-b from-surface-secondary/55 to-surface px-4 py-4">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                        <div className="relative max-w-xl flex-1">
                            <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                            <input
                                type="text"
                                placeholder="Search vessel, voyage, BL, entry, client, assignee..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setPage(1);
                                }}
                                className="h-11 w-full rounded-xl border border-border bg-surface pl-11 pr-4 text-sm text-text-primary shadow-sm transition-colors placeholder:text-text-muted focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        <div className="flex flex-1 flex-wrap items-center gap-3 xl:justify-end">
                            <div className="flex h-11 shrink-0 items-center rounded-xl border border-border bg-surface p-1 shadow-sm">
                                {(['all', 'import', 'export'] as TypeFilter[]).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => {
                                            setTypeFilter(t);
                                            setPage(1);
                                        }}
                                        className={`rounded-lg px-4 py-2 text-xs font-bold capitalize transition-colors ${
                                            typeFilter === t
                                                ? 'bg-text-primary text-surface shadow-sm'
                                                : 'text-text-secondary hover:text-text-primary'
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
                                className="h-11 shrink-0 cursor-pointer rounded-xl border border-border bg-surface px-3 text-sm text-text-primary shadow-sm transition-colors focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                </div>

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
                    <div className="w-full">
                        <div>
                            {groups.map((group) => (
                                <div key={group.vesselKey} className="border-b border-border last:border-0 bg-surface">
                                    <VesselGroupHeader
                                        group={group}
                                        isExpanded={expandedGroups.has(group.vesselKey)}
                                        onToggle={() => toggleGroup(group.vesselKey)}
                                    />

                                    {expandedGroups.has(group.vesselKey) && (
                                        <div>
                                            <div className="hidden border-b border-border bg-surface-secondary/35 px-4 py-2 lg:grid lg:grid-cols-[88px_1.5fr_1.2fr_110px_96px_88px_96px_88px] lg:gap-x-3">
                                                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted">Type</span>
                                                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted">Primary Identifier</span>
                                                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted">Client / Vessel</span>
                                                <span className="text-center text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted">Status</span>
                                                <span className="text-center text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted">Encoder</span>
                                                <span className="text-center text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted">Remarks</span>
                                                <span className="text-right text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted">Created</span>
                                                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted" />
                                            </div>
                                            {group.transactions.map((t, idx) => {
                                    const normalizedStatus = normalizeStatus(t.status);
                                    const isCompleted = normalizedStatus === COMPLETED_STATUS;
                                    const isCancelled = normalizedStatus === CANCELLED_STATUS;
                                    const canManageActiveTransaction = !isCompleted && !isCancelled;
                                    const sc = STATUS_CFG[normalizedStatus] ?? STATUS_CFG.pending;
                                    const tc = TYPE_CFG[t.type] ?? TYPE_CFG.import;
                                    const rowKey = `${t.type}-${t.id}`;
                                    const primaryRef = getTransactionPrimaryRef(t);
                                    const secondaryRef = getTransactionSecondaryRef(t);
                                    return (
                                        <div
                                            key={rowKey}
                                            onClick={() => setDetailTarget(t)}
                                            className={`relative grid cursor-pointer gap-x-3 gap-y-3 border-b border-border/40 p-4 text-xs transition-colors last:border-0 hover:bg-hover/60 lg:grid-cols-[88px_1.5fr_1.2fr_110px_96px_88px_96px_88px] lg:items-center lg:gap-y-0 lg:px-4 lg:py-3 ${
                                                idx % 2 !== 0 ? 'bg-surface-secondary/15' : ''
                                            } ${t.open_remarks_count > 0 ? 'border-l-4 border-red-500 bg-red-50/20 dark:bg-red-950/10' : 'border-l-4 border-transparent'}`}
                                            role="row"
                                        >
                                            <div className="flex items-center justify-between lg:block">
                                                <span
                                                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"
                                                    style={{ color: tc.color, backgroundColor: tc.bg }}
                                                >
                                                    {t.type}
                                                </span>
                                                <div className="lg:hidden">
                                                    <span
                                                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize whitespace-nowrap"
                                                        style={{ color: sc.color, backgroundColor: sc.bg }}
                                                    >
                                                        {t.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="min-w-0">
                                                <span className="mb-1 block text-[10px] font-bold uppercase text-text-muted lg:hidden">Reference</span>
                                                <p className="truncate text-sm font-semibold text-text-primary lg:text-xs">{primaryRef}</p>
                                                {secondaryRef && (
                                                    <p className="mt-0.5 truncate text-[11px] text-text-muted">{secondaryRef}</p>
                                                )}
                                            </div>

                                            <div className="min-w-0">
                                                <span className="mb-1 block text-[10px] font-bold uppercase text-text-muted lg:hidden">Client</span>
                                                <p className="truncate text-sm font-medium text-text-secondary lg:text-xs">{t.client || '—'}</p>
                                                {t.vessel && (
                                                    <p className="mt-0.5 truncate text-[11px] text-text-muted">{t.vessel}</p>
                                                )}
                                            </div>

                                            <div className="hidden lg:flex justify-center">
                                                <span
                                                    className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold capitalize whitespace-nowrap"
                                                    style={{ color: sc.color, backgroundColor: sc.bg }}
                                                >
                                                    {t.status.replace('_', ' ')}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 border-t border-border/50 pt-2 lg:justify-center lg:border-t-0 lg:pt-0">
                                                <div className="min-w-0">
                                                    <span className="mb-1 block text-[10px] font-bold uppercase text-text-muted lg:hidden">Encoder</span>
                                                    <p className="truncate text-xs text-text-secondary lg:text-[11px]">
                                                        {t.assigned_to || <span className="italic text-text-muted">Unassigned</span>}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="hidden lg:flex justify-center">
                                                {t.open_remarks_count > 0 ? (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setRemarkTarget(t); }}
                                                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors"
                                                        style={{ color: '#ff453a', backgroundColor: 'rgba(255,69,58,0.12)' }}
                                                    >
                                                        <Icon name="flag" className="w-3 h-3" />
                                                        {t.open_remarks_count}
                                                    </button>
                                                ) : (
                                                    <span className="text-text-muted text-[10px]">—</span>
                                                )}
                                            </div>

                                            <div className="hidden truncate text-right text-[10px] text-text-muted lg:block">
                                                {formatCompactDate(t.date ?? t.created_at)}
                                            </div>

                                            <div className="col-span-full flex items-center justify-between gap-2 border-t border-border/50 pt-2 lg:col-span-1 lg:justify-end lg:border-t-0 lg:pt-0" onClick={e => e.stopPropagation()}>
                                                <div className="lg:hidden">
                                                    {t.open_remarks_count > 0 && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setRemarkTarget(t); }}
                                                            className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-300"
                                                            title={`${t.open_remarks_count} open remark(s)`}
                                                        >
                                                            <Icon name="flag" className="w-3 h-3" />
                                                            {t.open_remarks_count} remark{t.open_remarks_count > 1 ? 's' : ''}
                                                        </button>
                                                    )}
                                                </div>
                                                {canManageActiveTransaction && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setStatusTarget(t); }}
                                                        className="rounded-lg border border-border bg-surface p-2 text-orange-500 shadow-sm hover:bg-orange-50 dark:hover:bg-orange-900/30 lg:border-transparent lg:bg-transparent lg:p-1.5 lg:shadow-none"
                                                        title="Override Status"
                                                    >
                                                        <Icon name="alert-circle" className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {isCancelled && (
                                                    <>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setStatusTarget(t); }}
                                                            className="rounded-lg border border-border bg-surface p-2 text-emerald-500 shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30 lg:border-transparent lg:bg-transparent lg:p-1.5 lg:shadow-none"
                                                            title="Restore Transaction"
                                                        >
                                                            <Icon name="check-circle" className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(t); }}
                                                            disabled={deletingTargetKey === rowKey}
                                                            className="rounded-lg border border-border bg-surface p-2 text-red-500 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50 lg:border-transparent lg:bg-transparent lg:p-1.5 lg:shadow-none"
                                                            title="Delete Cancelled Transaction"
                                                        >
                                                            <Icon name="trash" className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setRemarkTarget(t); }}
                                                    className="hidden lg:block rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                                                    title="Flag / Remarks"
                                                >
                                                    <Icon name="flag" className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {meta && meta.last_page > 1 ? (
                            <div className="mt-auto border-t border-border p-2">
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
                            </div>
                        ) : (
                            <div className="mt-auto border-t border-border px-5 py-3 text-xs text-text-muted">
                                Showing {transactions.length} of {stats.total} transactions
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
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

            {/* Delete confirmation modal */}
            {deleteTarget && (() => {
                const label = deleteTarget.reference_no || deleteTarget.bl_no || `#${deleteTarget.id}`;
                return (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                        onClick={() => setDeleteTarget(null)}
                    >
                        <div
                            className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Icon + title */}
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(255,69,58,0.15)' }}>
                                    <Icon name="trash" className="w-5 h-5" style={{ color: '#ff453a' }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-text-primary">Delete Cancelled Transaction</p>
                                    <p className="text-xs text-text-muted mt-1 leading-relaxed">
                                        You are about to permanently delete the cancelled{' '}
                                        <span className="font-semibold capitalize">{deleteTarget.type}</span>{' '}transaction{' '}
                                        <span className="font-semibold text-text-primary">{label}</span>.
                                        This action cannot be undone.
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setDeleteTarget(null)}
                                    className="px-4 py-2 text-sm font-semibold rounded-lg border border-border text-text-secondary hover:bg-hover transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => void confirmDelete()}
                                    className="px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors"
                                    style={{ backgroundColor: '#ff453a' }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};
