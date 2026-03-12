import { useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { Icon } from '../../../components/Icon';
import { Pagination } from '../../../components/Pagination';
import { UploadModal } from '../../../components/modals/UploadModal';
import { useExports } from '../../tracking/hooks/useExports';
import { useImports } from '../../tracking/hooks/useImports';
import type { LayoutContext } from '../../tracking/types';


type TransactionType = 'import' | 'export';
type TypeFilter = 'all' | TransactionType;

interface DocumentRow {
    id: number;
    ref: string;
    blNo: string;
    client: string;
    type: TransactionType;
    date: string;
    dateLabel: string;
    port: string;
    vessel: string;
    status: string;
    docCount: number;
}


const TYPE_CONFIG: Record<TransactionType, { label: string; color: string; bg: string }> = {
    import: { label: 'Import', color: '#0a84ff', bg: 'rgba(10,132,255,0.12)' },
    export: { label: 'Export', color: '#30d158', bg: 'rgba(48,209,88,0.12)'  },
};

const FILTER_LABELS: Record<TypeFilter, string> = {
    all:    'All Types',
    import: 'Import',
    export: 'Export',
};

const TABLE_GRID = '110px 140px 1.4fr 1fr 110px 110px';


function buildExportRef(id: number) {
    return `EXP-${String(id).padStart(4, '0')}`;
}

/** Convert ALL CAPS or mixed-case strings to Title Case */
function toTitleCase(str: string): string {
    if (!str || str === '—') return str;
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

/** Format ISO date string to human-readable (e.g. Feb 10, 2024) */
function formatDate(dateStr: string): string {
    if (!dateStr || dateStr === '—') return dateStr;
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
                    <div className="h-4 w-28 rounded bg-surface-secondary animate-pulse" />
                    <div className="h-4 w-36 rounded bg-surface-secondary animate-pulse" />
                    <div className="h-4 w-20 rounded bg-surface-secondary animate-pulse" />
                    <div className="h-6 w-20 rounded-full bg-surface-secondary animate-pulse" />
                    <div className="h-6 w-16 rounded-full bg-surface-secondary animate-pulse mx-auto" />
                </div>
            ))}
        </div>
    );
}


export const Documents = () => {
    const { dateTime } = useOutletContext<LayoutContext>();
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();
    const page    = parseInt(searchParams.get('page')     || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');

    const [searchQuery, setSearchQuery]   = useState('');
    const [typeFilter, setTypeFilter]     = useState<TypeFilter>('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const setPage    = (p: number)  => setSearchParams(prev => { prev.set('page', String(p)); return prev; });
    const setPerPage = (pp: number) => setSearchParams(prev => { prev.set('per_page', String(pp)); prev.set('page', '1'); return prev; });

    // Fetch all finalized transactions (completed + cancelled) — filter client-side
    const {
        data: importsData,
        isLoading: importsLoading,
        isError: importsError,
    } = useImports({ per_page: 500 });

    const {
        data: exportsData,
        isLoading: exportsLoading,
        isError: exportsError,
    } = useExports({ per_page: 500 });

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
        docCount:  t.documents_count,
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
        docCount:  t.documents_count,
    }));

    // Only finalized transactions: completed or cancelled
    const rows: DocumentRow[] = [...importRows, ...exportRows]
        .filter(r => r.status === 'completed' || r.status === 'cancelled');

    const importCount   = rows.filter(r => r.type === 'import').length;
    const exportCount   = rows.filter(r => r.type === 'export').length;
    const cancelledCount = rows.filter(r => r.status === 'cancelled').length;
    const totalDocs     = rows.reduce((s, r) => s + r.docCount, 0);
    const missingDocs   = rows.filter(r => r.docCount === 0).length;

    const stats = [
        {
            label: 'Completed Transactions',
            value: rows.length - cancelledCount,
            sub:   `${rows.length - cancelledCount} shipments cleared`,
            color: '#0a84ff',
            icon:  'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
        },
        {
            label: 'Import Cleared',
            value: importCount,
            sub:   'Inbound shipments',
            color: '#0a84ff',
            icon:  'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
        },
        {
            label: 'Export Shipped',
            value: exportCount,
            sub:   'Outbound shipments',
            color: '#30d158',
            icon:  'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
        },
        {
            label: 'Total Files',
            value: totalDocs,
            sub:   missingDocs > 0 ? `⚠ ${missingDocs} shipments missing docs` : 'All shipments have files',
            color: missingDocs > 0 ? '#ff9f0a' : '#30d158',
            icon:  'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        },
    ];

    // Client-side search + type filter on completed rows
    const filtered = rows.filter(r => {
        const matchType   = typeFilter === 'all' || r.type === typeFilter;
        const q           = searchQuery.toLowerCase();
        const matchSearch = !q
            || r.blNo.toLowerCase().includes(q)
            || r.ref.toLowerCase().includes(q)
            || r.client.toLowerCase().includes(q);
        return matchType && matchSearch;
    });

    // Client-side pagination over the filtered results
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const safePage   = Math.min(page, totalPages);
    const pageStart  = (safePage - 1) * perPage;
    const paginated  = filtered.slice(pageStart, pageStart + perPage);

    const handleTypeFilter = (cat: TypeFilter) => {
        setTypeFilter(cat);
        setIsFilterOpen(false);
        setPage(1);
    };

    const handleSearch = (q: string) => {
        setSearchQuery(q);
        setPage(1);
    };

    return (
        <div className="space-y-5 p-4">

            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-1 text-text-primary">Documents</h1>
                    <p className="text-sm text-text-secondary">Browse cleared shipments & manage files</p>
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
                    Failed to load completed transactions. Please refresh the page.
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
                <div className="p-3 border-b border-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-surface rounded-t-xl">

                    {/* Search */}
                    <div className="relative flex-1 max-w-sm">
                        <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by BL No. or client…"
                            value={searchQuery}
                            onChange={e => handleSearch(e.target.value)}
                            className="w-full pl-9 pr-3 h-9 rounded-lg border border-border-strong bg-input-bg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition-colors"
                        />
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-2">

                        {/* Type filter dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(o => !o)}
                                className="px-3 h-9 rounded-lg border border-border-strong bg-input-bg text-text-secondary text-xs font-semibold min-w-[120px] text-left flex items-center justify-between hover:text-text-primary transition-colors focus:outline-none"
                            >
                                {FILTER_LABELS[typeFilter]}
                                <Icon name="chevron-down" className="w-3.5 h-3.5 ml-2 text-text-muted" />
                            </button>
                            {isFilterOpen && (
                                <div className="absolute top-full right-0 mt-1 w-36 bg-surface border border-border-strong rounded-xl shadow-lg z-50 overflow-hidden">
                                    {(['all', 'import', 'export'] as const).map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => handleTypeFilter(cat)}
                                            className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors hover:bg-hover ${typeFilter === cat ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-text-primary'}`}
                                        >
                                            {FILTER_LABELS[cat]}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table Header */}
                <div className="grid gap-4 px-6 py-3 border-b border-border bg-surface-secondary" style={{ gridTemplateColumns: TABLE_GRID }}>
                    {['Type', 'BL No.', 'Client', 'Date', 'Status', 'Docs'].map((h, i) => (
                        <span key={h} className={`text-xs font-bold text-text-secondary uppercase tracking-wider ${i >= 4 ? 'text-center' : ''}`}>{h}</span>
                    ))}
                </div>

                {/* Rows */}
                {isLoading ? (
                    <TableSkeleton />
                ) : (
                    <>
                        <div>
                            {filtered.length === 0 ? (
                                <div className="py-16 flex flex-col items-center gap-3 text-text-muted">
                                    <Icon name="file-text" className="w-10 h-10 opacity-30" />
                                    <p className="text-sm font-semibold">
                                        {rows.length === 0
                                            ? 'No completed transactions yet'
                                            : 'No transactions match your filter'}
                                    </p>
                                    {rows.length === 0 && (
                                        <p className="text-xs text-center max-w-xs">
                                            Completed import and export transactions will appear here once all stages are done.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                paginated.map((row, i) => {
                                    const tc = TYPE_CONFIG[row.type];
                                    const isMissingDocs = row.docCount === 0;
                                    return (
                                        <div
                                            key={row.id}
                                            onClick={() => navigate(`/documents/${row.ref}`)}
                                            className={`relative grid gap-4 py-3 px-6 items-center cursor-pointer transition-all duration-150 hover:bg-hover border-b border-border/50 ${i % 2 !== 0 ? 'bg-surface-secondary/40' : ''}`}
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
                                                <p className="text-sm text-text-primary font-semibold truncate">{toTitleCase(row.client)}</p>
                                                {row.port !== '—' && (
                                                    <p className="text-xs text-text-muted truncate mt-0.5">
                                                        {row.vessel !== '—' ? `${row.vessel} · ` : ''}{row.port}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Date */}
                                            <div>
                                                <p className="text-sm text-text-secondary font-semibold">{formatDate(row.date)}</p>
                                                <p className="text-xs text-text-muted mt-0.5">{row.dateLabel} date</p>
                                            </div>

                                            {/* Status badge — dynamic based on status + type */}
                                            <div className="flex justify-center">
                                                {row.status === 'cancelled' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold" style={{ color: '#ff453a', backgroundColor: 'rgba(255,69,58,0.13)' }}>
                                                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#ff453a', boxShadow: '0 0 4px #ff453a' }} />
                                                        Cancelled
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold" style={{ color: '#30d158', backgroundColor: 'rgba(48,209,88,0.13)' }}>
                                                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#30d158', boxShadow: '0 0 4px #30d158' }} />
                                                        {row.type === 'import' ? 'Cleared' : 'Shipped'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Docs count badge */}
                                            <div className="flex justify-center">
                                                {isMissingDocs ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                                        </svg>
                                                        Missing
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        {row.docCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Pagination */}
                        {filtered.length > 0 && (
                            <Pagination
                                currentPage={safePage}
                                totalPages={totalPages}
                                perPage={perPage}
                                onPageChange={setPage}
                                onPerPageChange={setPerPage}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Upload modal — list-level fallback */}
            <UploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                title="Select a transaction first"
                onUpload={() => setIsUploadOpen(false)}
            />
        </div>
    );
};
