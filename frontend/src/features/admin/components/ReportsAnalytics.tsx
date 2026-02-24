import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '../../tracking/types';
import { useClientReport, useMonthlyReport, useTurnaroundReport } from '../hooks/useReports';
import type { ClientReportResponse, ClientReportRow, MonthlyDataPoint, MonthlyReportResponse, TurnaroundReportResponse } from '../types/report.types';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────
const BarChart = ({ data }: { data: MonthlyDataPoint[] }) => {
    const W = 700, H = 220, PAD = { top: 16, right: 16, bottom: 36, left: 40 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;
    const maxVal = Math.max(...data.map(d => d.total), 1);
    const barGroupW = chartW / 12;
    const barW = barGroupW * 0.3;
    const yTicks = 4;
    const tickStep = Math.ceil(maxVal / yTicks);

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 220 }}>
            {Array.from({ length: yTicks + 1 }, (_, i) => {
                const val = i * tickStep;
                const y = PAD.top + chartH - (val / (tickStep * yTicks)) * chartH;
                return (
                    <g key={i}>
                        <line x1={PAD.left} x2={PAD.left + chartW} y1={y} y2={y}
                            stroke="var(--color-border-strong)" strokeWidth="1" />
                        <text x={PAD.left - 6} y={y + 4} textAnchor="end"
                            fontSize="10" fill="var(--color-text-muted)">{val}</text>
                    </g>
                );
            })}
            {data.map((d, i) => {
                const groupX = PAD.left + i * barGroupW;
                const cx = groupX + barGroupW / 2;
                const importH = (d.imports / (tickStep * yTicks)) * chartH;
                const exportH = (d.exports / (tickStep * yTicks)) * chartH;
                return (
                    <g key={i}>
                        <rect x={cx - barW - 1} y={PAD.top + chartH - importH} width={barW} height={importH} rx="3" fill="#0a84ff" opacity="0.85" />
                        <rect x={cx + 1} y={PAD.top + chartH - exportH} width={barW} height={exportH} rx="3" fill="#ff9f0a" opacity="0.85" />
                        <text x={cx} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--color-text-muted)">{MONTH_NAMES[i]}</text>
                    </g>
                );
            })}
            <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={PAD.top + chartH}
                stroke="var(--color-border-strong)" strokeWidth="1" />
        </svg>
    );
};

// ─── CSV Export ───────────────────────────────────────────────────────────────
const downloadCSV = (
    monthly: MonthlyReportResponse | undefined,
    clients: ClientReportResponse | undefined,
    turnaround: TurnaroundReportResponse | undefined,
    year: number,
    month: number
) => {
    const lines: string[] = [];
    lines.push(`Reports & Analytics — ${year}${month ? ' / ' + MONTH_FULL[month - 1] : ''}`);
    lines.push('');
    lines.push('Monthly Volume');
    lines.push('Month,Imports,Exports,Total');
    monthly?.months.forEach(m => {
        lines.push(`${MONTH_FULL[m.month - 1]},${m.imports},${m.exports},${m.total}`);
    });
    lines.push(`TOTAL,${monthly?.total_imports ?? 0},${monthly?.total_exports ?? 0},${monthly?.total ?? 0}`);
    lines.push('');
    lines.push('Transactions per Client');
    lines.push('Client,Type,Imports,Exports,Total');
    clients?.clients.forEach(c => {
        lines.push(`"${c.client_name}",${c.client_type},${c.imports},${c.exports},${c.total}`);
    });
    lines.push('');
    lines.push('Turnaround Times (completed transactions)');
    lines.push('Type,Completed,Avg Days,Min Days,Max Days');
    lines.push(`Imports,${turnaround?.imports.completed_count ?? 0},${turnaround?.imports.avg_days ?? 'N/A'},${turnaround?.imports.min_days ?? 'N/A'},${turnaround?.imports.max_days ?? 'N/A'}`);
    lines.push(`Exports,${turnaround?.exports.completed_count ?? 0},${turnaround?.exports.avg_days ?? 'N/A'},${turnaround?.exports.min_days ?? 'N/A'},${turnaround?.exports.max_days ?? 'N/A'}`);

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `morata-report-${year}${month ? '-' + String(month).padStart(2, '0') : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const ReportsAnalytics = () => {
    const { dateTime } = useOutletContext<LayoutContext>();

    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(0);
    const [sortKey, setSortKey] = useState<keyof ClientReportRow>('total');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    // TanStack Query — only refetches when year/month actually change, not on every clock tick
    const { data: monthly, isLoading: loadingMonthly, refetch: refetchMonthly } = useMonthlyReport(year);
    const { data: clients, isLoading: loadingClients, refetch: refetchClients } = useClientReport(year, month || undefined);
    const { data: turnaround, isLoading: loadingTurnaround, refetch: refetchTurnaround } = useTurnaroundReport(year, month || undefined);

    const isLoading = loadingMonthly || loadingClients || loadingTurnaround;

    const handleRefresh = () => {
        refetchMonthly();
        refetchClients();
        refetchTurnaround();
    };

    const sortedClients = [...(clients?.clients ?? [])].sort((a, b) => {
        const va = a[sortKey] as number;
        const vb = b[sortKey] as number;
        return sortDir === 'desc' ? vb - va : va - vb;
    });

    const handleSort = (key: keyof ClientReportRow) => {
        if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    const SortIcon = ({ col }: { col: keyof ClientReportRow }) => (
        <span className="ml-1 opacity-50">{sortKey === col ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}</span>
    );

    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const selectCls = 'px-4 py-2.5 rounded-lg border border-border-strong bg-input-bg text-text-primary text-sm font-medium focus:outline-none focus:border-blue-500/50 transition-colors';

    return (
        <>
            <style>{`
                @media print {
                    body > * { display: none !important; }
                    #reports-print-area { display: block !important; }
                    #reports-print-area { position: fixed; top: 0; left: 0; width: 100%; }
                }
                @media screen {
                    #reports-print-area { display: contents; }
                }
            `}</style>

            <div id="reports-print-area" className="space-y-5 p-4">
                {/* Header */}
                <div className="flex justify-between items-end print:mb-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-1 text-text-primary">Reports & Analytics</h1>
                        <p className="text-sm text-text-secondary">Monthly reports, revenue per client, turnaround times</p>
                    </div>
                    <div className="text-right hidden sm:block print:hidden">
                        <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                        <p className="text-sm text-text-secondary">{dateTime.date}</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap gap-3 items-center print:hidden">
                    <select value={year} onChange={e => setYear(Number(e.target.value))} className={selectCls}>
                        {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={month} onChange={e => setMonth(Number(e.target.value))} className={selectCls}>
                        <option value={0}>All Months</option>
                        {MONTH_FULL.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                    </select>
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2.5 rounded-lg border border-border-strong bg-input-bg text-text-secondary text-sm font-semibold flex items-center gap-2 hover:text-text-primary transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                    <div className="flex-1" />
                    <button
                        onClick={() => downloadCSV(monthly, clients, turnaround, year, month)}
                        className="px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                        style={{ backgroundColor: '#30d158', color: '#fff' }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export CSV
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 bg-text-primary text-surface hover:opacity-90 transition-opacity"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Export PDF
                    </button>
                </div>

                {isLoading ? (
                    <div className="py-20 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#0a84ff' }} />
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { label: 'Total Transactions', value: monthly?.total ?? 0, sub: `${year}${month ? ' / ' + MONTH_FULL[month - 1] : ''}`, color: '#0a84ff', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                                { label: 'Total Imports', value: monthly?.total_imports ?? 0, sub: 'this period', color: '#30d158', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
                                { label: 'Total Exports', value: monthly?.total_exports ?? 0, sub: 'this period', color: '#ff9f0a', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
                                { label: 'Active Clients', value: clients?.clients.length ?? 0, sub: 'with transactions', color: '#bf5af2', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
                            ].map(({ label, value, sub, color, icon }) => (
                                <div key={label} className="bg-surface-tint rounded-lg p-4 border border-border-tint">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-3xl font-bold tabular-nums text-text-primary">{value}</p>
                                            <p className="text-xs mt-1 font-medium text-text-secondary">{label}</p>
                                            <p className="text-[10px] mt-0.5 text-text-muted">{sub}</p>
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

                        {/* Monthly Volume Chart */}
                        <div className="bg-surface rounded-lg border border-border p-5">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-sm font-bold text-text-primary">Monthly Volume — {year}</h2>
                                <div className="flex gap-4 text-xs font-semibold">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#0a84ff' }} />
                                        <span className="text-text-secondary">Imports</span>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#ff9f0a' }} />
                                        <span className="text-text-secondary">Exports</span>
                                    </span>
                                </div>
                            </div>
                            {monthly && <BarChart data={monthly.months} />}
                        </div>

                        {/* Bottom panels */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Transactions per Client */}
                            <div className="bg-surface rounded-lg border border-border overflow-hidden">
                                <div className="px-5 py-4 border-b border-border flex justify-between items-center">
                                    <h2 className="text-sm font-bold text-text-primary">Transactions per Client</h2>
                                    <span className="text-xs font-semibold px-2 py-1 rounded-md bg-surface-tint border border-border-tint text-text-secondary">
                                        {sortedClients.length} clients
                                    </span>
                                </div>
                                {sortedClients.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <p className="text-sm text-text-muted">No client data for this period</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Client</th>
                                                    {(['imports', 'exports', 'total'] as const).map(k => (
                                                        <th key={k}
                                                            onClick={() => handleSort(k)}
                                                            className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider cursor-pointer select-none text-text-muted hover:text-text-primary transition-colors">
                                                            {k} <SortIcon col={k} />
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedClients.map((c, idx) => (
                                                    <tr key={c.client_id} className={`border-b border-border/50 transition-colors hover:bg-hover ${idx % 2 !== 0 ? 'bg-surface-secondary/40' : ''}`}>
                                                        <td className="px-5 py-3">
                                                            <p className="font-medium text-text-primary">{c.client_name}</p>
                                                            <p className="text-xs capitalize text-text-muted">{c.client_type}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-right tabular-nums font-semibold" style={{ color: '#0a84ff' }}>{c.imports}</td>
                                                        <td className="px-4 py-3 text-right tabular-nums font-semibold" style={{ color: '#ff9f0a' }}>{c.exports}</td>
                                                        <td className="px-4 py-3 text-right tabular-nums font-bold text-text-primary">{c.total}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Turnaround Times */}
                            <div className="bg-surface rounded-lg border border-border overflow-hidden">
                                <div className="px-5 py-4 border-b border-border">
                                    <h2 className="text-sm font-bold text-text-primary">Turnaround Times</h2>
                                    <p className="text-xs mt-0.5 text-text-muted">Completed transactions only — days from creation to completion</p>
                                </div>
                                <div className="p-5 space-y-5">
                                    {(['imports', 'exports'] as const).map(type => {
                                        const stats = turnaround?.[type];
                                        const color = type === 'imports' ? '#0a84ff' : '#ff9f0a';
                                        return (
                                            <div key={type}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                                                    <h3 className="text-sm font-bold capitalize text-text-primary">{type}</h3>
                                                    <span className="text-xs px-2 py-0.5 rounded-md bg-surface-tint border border-border-tint text-text-secondary">
                                                        {stats?.completed_count ?? 0} completed
                                                    </span>
                                                </div>
                                                {(stats?.completed_count ?? 0) === 0 ? (
                                                    <p className="text-sm italic text-text-muted">No completed transactions in this period</p>
                                                ) : (
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {[
                                                            { label: 'Avg', value: stats?.avg_days },
                                                            { label: 'Min', value: stats?.min_days },
                                                            { label: 'Max', value: stats?.max_days },
                                                        ].map(({ label, value }) => (
                                                            <div key={label} className="rounded-lg p-3 text-center bg-surface-tint border border-border-tint">
                                                                <p className="text-xl font-bold text-text-primary">
                                                                    {value !== null && value !== undefined ? value : '—'}
                                                                </p>
                                                                <p className="text-xs mt-0.5 text-text-muted">{label} days</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};
