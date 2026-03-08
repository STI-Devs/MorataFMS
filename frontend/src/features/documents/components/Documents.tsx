import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Icon } from '../../../components/Icon';
import { UploadModal } from '../../../components/modals/UploadModal';
import { useExports } from '../../tracking/hooks/useExports';
import { useImports } from '../../tracking/hooks/useImports';
import type { LayoutContext } from '../../tracking/types';


type TransactionType = 'import' | 'export' | 'legacy';
type TypeFilter = 'all' | TransactionType;

interface DocumentRow {
    id: number;
    ref: string;       // kept for navigation
    blNo: string;
    client: string;
    type: TransactionType;
    date: string;
    dateLabel: string; // 'Arrival' | 'Export'
    port: string;      // destination country (exports) or '—'
    vessel: string;    // vessel name (exports) or '—'
    status: string;
    docCount: number;
}


const TYPE_CONFIG: Record<TransactionType, { label: string; color: string; bg: string }> = {
    import:  { label: 'Import',  color: '#0a84ff', bg: 'rgba(10,132,255,0.12)' },
    export:  { label: 'Export',  color: '#30d158', bg: 'rgba(48,209,88,0.12)'  },
    legacy:  { label: 'Legacy',  color: '#ff9f0a', bg: 'rgba(255,159,10,0.12)' },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
    Cleared:      { color: '#30d158', bg: 'rgba(48,209,88,0.13)'    },
    Shipped:      { color: '#30d158', bg: 'rgba(48,209,88,0.13)'    },
    'In Transit': { color: '#64d2ff', bg: 'rgba(100,210,255,0.13)'  },
    Pending:      { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)'   },
    Processing:   { color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)'   },
    Cancelled:    { color: '#ff453a', bg: 'rgba(255,69,58,0.13)'    },
};

const FILTER_LABELS: Record<TypeFilter, string> = {
    all:    'All Types',
    import: 'Import',
    export: 'Export',
    legacy: 'Legacy',
};

const TABLE_GRID = '110px 130px 1.4fr 1fr 110px 90px';


function buildExportRef(id: number) {
    return `EXP-${String(id).padStart(4, '0')}`;
}


function StatIcon({ d, color }: { d: string; color: string }) {
    return (
        <svg className="w-4 h-4" fill="none" stroke={color} viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d={d} />
        </svg>
    );
}


function TableSkeleton() {
    return (
        <div className="divide-y divide-border/50">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="grid gap-4 py-3.5 px-6 items-center" style={{ gridTemplateColumns: TABLE_GRID }}>
                    <div className="h-6 w-16 rounded-full bg-surface-secondary animate-pulse" />
                    <div className="h-4 w-24 rounded bg-surface-secondary animate-pulse" />
                    <div className="h-4 w-36 rounded bg-surface-secondary animate-pulse" />
                    <div className="h-4 w-20 rounded bg-surface-secondary animate-pulse" />
                    <div className="h-6 w-20 rounded-full bg-surface-secondary animate-pulse" />
                    <div className="h-4 w-6 rounded bg-surface-secondary animate-pulse mx-auto" />
                </div>
            ))}
        </div>
    );
}


export const Documents = () => {
    const { dateTime, user } = useOutletContext<LayoutContext>();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'supervisor';

    const [searchQuery, setSearchQuery]   = useState('');
    const [typeFilter, setTypeFilter]     = useState<TypeFilter>('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const {
        data: importsData,
        isLoading: importsLoading,
        isError: importsError,
    } = useImports({ per_page: 100 });

    const {
        data: exportsData,
        isLoading: exportsLoading,
        isError: exportsError,
    } = useExports({ per_page: 100 });

    const isLoading = importsLoading || exportsLoading;
    const isError   = importsError   || exportsError;

    const importRows: DocumentRow[] = (importsData?.data ?? []).map(t => ({
        id:        t.id,
        ref:       t.customs_ref_no,
        blNo:      t.bl_no || '—',
        client:    t.importer?.name ?? '—',
        type:      'import',
        date:      t.arrival_date,
        dateLabel: 'Arrival',
        port:      '—',
        vessel:    '—',
        status:    t.status,
        docCount:  0,
    }));

    const exportRows: DocumentRow[] = (exportsData?.data ?? []).map(t => ({
        id:        t.id,
        ref:       buildExportRef(t.id),
        blNo:      t.bl_no || '—',
        client:    t.shipper?.name ?? '—',
        type:      'export',
        date:      t.created_at.slice(0, 10),
        dateLabel: 'Export',
        port:      t.destination_country?.name ?? '—',
        vessel:    t.vessel || '—',
        status:    t.status,
        docCount:  0,
    }));

    const rows: DocumentRow[] = [...importRows, ...exportRows];

    const importCount = importRows.length;
    const exportCount = exportRows.length;
    const legacyCount = rows.filter(r => r.type === 'legacy').length;
    const totalDocs   = rows.reduce((s, r) => s + r.docCount, 0);

    const stats = [
        { label: 'Total Transactions', value: rows.length,   sub: `${totalDocs} documents`,     color: '#0a84ff', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
        { label: 'Import',            value: importCount,    sub: 'Inbound shipments',           color: '#0a84ff', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
        { label: 'Export',            value: exportCount,    sub: 'Outbound shipments',          color: '#30d158', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
        { label: 'Legacy',            value: legacyCount,    sub: 'Archived records',            color: '#ff9f0a', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8' },
    ];

    const filtered = rows.filter(r => {
        const matchType   = typeFilter === 'all' || r.type === typeFilter;
        const q           = searchQuery.toLowerCase();
        const matchSearch = !q
            || r.blNo.toLowerCase().includes(q)
            || r.ref.toLowerCase().includes(q)
            || r.client.toLowerCase().includes(q);
        return matchType && matchSearch;
    });

    return (
        <div className="space-y-5 p-4">

            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-1 text-text-primary">Documents</h1>
                    <p className="text-sm text-text-secondary">Browse transaction documents by shipment</p>
                </div>
                <div className="text-right hidden sm:block shrink-0">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-secondary">{dateTime.date}</p>
                </div>
            </div>

            {/* Error banner */}
            {isError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Failed to load transactions. Please refresh the page.
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map(stat => (
                    <div key={stat.label} className="bg-surface rounded-xl p-4 border border-border shadow-sm">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-3xl font-bold tabular-nums text-text-primary">
                                    {isLoading ? (
                                        <span className="inline-block h-8 w-10 rounded bg-surface-secondary animate-pulse" />
                                    ) : stat.value}
                                </p>
                                <p className="text-xs mt-1 font-semibold text-text-secondary">{stat.label}</p>
                                <p className="text-xs mt-0.5 text-text-muted">{stat.sub}</p>
                            </div>
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${stat.color}20` }}>
                                <StatIcon d={stat.icon} color={stat.color} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Transaction List Card */}
            <div className="bg-surface rounded-xl border border-border overflow-visible shadow-sm">

                {/* Toolbar */}
                <div className="p-3 border-b border-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-surface">

                    {/* Search */}
                    <div className="relative flex-1 max-w-sm">
                        <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by BL No. or client…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 h-9 rounded-lg border border-border-strong bg-input-bg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition-colors"
                        />
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-2">

                        {/* Type filter dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(o => !o)}
                                className="px-3 h-9 rounded-lg border border-border-strong bg-input-bg text-text-secondary text-xs font-semibold min-w-[140px] text-left flex items-center justify-between hover:text-text-primary transition-colors focus:outline-none"
                            >
                                {FILTER_LABELS[typeFilter]}
                                <Icon name="chevron-down" className="w-3.5 h-3.5 ml-2 text-text-muted" />
                            </button>
                            {isFilterOpen && (
                                <div className="absolute top-full right-0 mt-1 w-40 bg-surface border border-border-strong rounded-xl shadow-lg z-50 overflow-hidden">
                                    {(['all', 'import', 'export', 'legacy'] as const).map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => { setTypeFilter(cat); setIsFilterOpen(false); }}
                                            className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors hover:bg-hover ${typeFilter === cat ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-text-primary'}`}
                                        >
                                            {FILTER_LABELS[cat]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Upload button — supervisor+ only */}
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={() => setIsUploadOpen(true)}
                                className="flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-xs font-bold text-white transition-all shadow-sm hover:opacity-90 bg-gradient-to-r from-blue-600 to-indigo-600"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                </svg>
                                Upload Document
                            </button>
                        )}
                    </div>
                </div>

                {/* Table Header */}
                <div className="grid gap-4 px-6 py-3 border-b border-border bg-surface-secondary" style={{ gridTemplateColumns: TABLE_GRID }}>
                    {['Type', 'BL No.', 'Client', 'Date', 'Status', 'Docs'].map((h, i) => (
                        <span key={h} className={`text-xs font-bold text-text-secondary uppercase tracking-wider ${i === 5 ? 'text-center' : ''}`}>{h}</span>
                    ))}
                </div>

                {/* Rows */}
                {isLoading ? (
                    <TableSkeleton />
                ) : (
                    <div>
                        {filtered.length === 0 ? (
                            <div className="py-16 flex flex-col items-center gap-3 text-text-muted">
                                <Icon name="file-text" className="w-10 h-10 opacity-30" />
                                <p className="text-sm font-semibold">
                                    {rows.length === 0 ? 'No transactions found' : 'No transactions match your filter'}
                                </p>
                            </div>
                        ) : (
                            filtered.map((row, i) => {
                                const tc = TYPE_CONFIG[row.type];
                                const sc = STATUS_CONFIG[row.status] ?? { color: '#8e8e93', bg: 'rgba(142,142,147,0.13)' };
                                return (
                                    <div
                                        key={row.id}
                                        onClick={() => navigate(`/documents/${row.ref}`)}
                                        className={`grid gap-4 py-3 px-6 items-center cursor-pointer transition-all duration-150 hover:bg-hover border-b border-border/50 ${i % 2 !== 0 ? 'bg-surface-secondary/40' : ''}`}
                                        style={{ gridTemplateColumns: TABLE_GRID }}
                                    >
                                        {/* Type badge */}
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold w-fit" style={{ color: tc.color, backgroundColor: tc.bg }}>
                                            {tc.label}
                                        </span>

                                        {/* BL No. */}
                                        <p className="text-sm text-text-primary font-bold font-mono tracking-tight truncate">{row.blNo}</p>

                                        {/* Client + port/vessel sub-info */}
                                        <div className="min-w-0">
                                            <p className="text-sm text-text-primary font-semibold truncate">{row.client}</p>
                                            {row.port !== '—' && (
                                                <p className="text-xs text-text-muted truncate mt-0.5">
                                                    {row.vessel !== '—' ? `${row.vessel} · ` : ''}{row.port}
                                                </p>
                                            )}
                                        </div>

                                        {/* Date with label */}
                                        <div>
                                            <p className="text-sm text-text-secondary font-semibold">{row.date}</p>
                                            <p className="text-xs text-text-muted mt-0.5">{row.dateLabel} date</p>
                                        </div>

                                        {/* Status badge */}
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold w-fit" style={{ color: sc.color, backgroundColor: sc.bg }}>
                                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: sc.color, boxShadow: `0 0 4px ${sc.color}` }} />
                                            {row.status}
                                        </span>

                                        {/* Docs count */}
                                        <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-text-secondary">
                                            <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            {row.docCount}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Upload modal — list-level fallback (no transaction context) */}
            <UploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                title="Select a transaction first"
                onUpload={() => setIsUploadOpen(false)}
            />
        </div>
    );
};
