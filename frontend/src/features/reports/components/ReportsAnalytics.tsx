import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '../../tracking/types';
import { useClientReport, useMonthlyReport, useTurnaroundReport } from '../hooks/useReports';
import type { ClientReportResponse, MonthlyReportResponse, TurnaroundReportResponse } from '../types/report.types';

const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

// --- Custom Chart Components ---

const FlowDonut = ({ imports, exports }: { imports: number; exports: number }) => {
    const total = imports + exports || 1;
    const r = 38;
    const circ = 2 * Math.PI * r;
    const gap = 4;
    const impPct = Math.max(imports / total, 0);
    const expPct = Math.max(exports / total, 0);
    const impDash = impPct * circ - gap;
    const expDash = expPct * circ - gap;
    return (
        <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r={r} stroke="currentColor" strokeWidth="16" fill="transparent" className="text-gray-100 dark:text-white/5" />
                <circle cx="50" cy="50" r={r} stroke="#38bdf8" strokeWidth="16" fill="transparent"
                    strokeDasharray={`${impDash} ${circ}`} strokeLinecap="round" />
                <circle cx="50" cy="50" r={r} stroke="#a78bfa" strokeWidth="16" fill="transparent"
                    strokeDasharray={`${expDash} ${circ}`} strokeDashoffset={-(impPct * circ)} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{total}</span>
                <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">total</span>
            </div>
        </div>
    );
};

const MiniBarChart = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="space-y-2.5 w-full">
            {data.map((d, i) => (
                <div key={i} className="space-y-1">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]" title={d.label}>{d.label}</span>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200 ml-2">{d.value}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

const MonthlyBars = ({ data }: { data: { month: number; imports: number; exports: number; total: number }[] }) => {
    const max = Math.max(...data.map(d => d.total), 1);
    return (
        <div className="flex items-end gap-1.5 h-48 w-full">
            {data.map((d, i) => {
                const impH = (d.imports / max) * 100;
                const expH = (d.exports / max) * 100;
                return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div className="w-full flex flex-col items-center gap-px h-44">
                            <div className="w-full flex flex-col justify-end h-full gap-0.5">
                                <div className="w-full rounded-t-sm transition-all duration-500"
                                    style={{ height: `${impH}%`, backgroundColor: '#38bdf8', opacity: 0.75 }} title={`Imports: ${d.imports}`} />
                                <div className="w-full"
                                    style={{ height: `${expH}%`, backgroundColor: '#a78bfa', opacity: 0.75 }} title={`Exports: ${d.exports}`} />
                            </div>
                        </div>
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">{MONTH_SHORT[d.month - 1]}</span>
                    </div>
                );
            })}
        </div>
    );
};

// KPI Stat card
const StatCard = ({ label, value, unit, icon, accent }: { label: string; value: string | number; unit?: string; icon: React.ReactNode; accent: string }) => (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/8 rounded-2xl p-5 flex items-center gap-4 shadow-xs">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent}18`, color: accent }}>
            {icon}
        </div>
        <div className="min-w-0">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-none tabular-nums">
                {value}<span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
            </p>
        </div>
    </div>
);

export const ReportsAnalytics = () => {
    const { dateTime } = useOutletContext<LayoutContext>();

    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(0);

    const { data: monthly, isLoading: loadingMonthly } = useMonthlyReport(year);
    const { data: clients, isLoading: loadingClients } = useClientReport(year, month || undefined);
    const { data: turnaround, isLoading: loadingTurnaround } = useTurnaroundReport(year, month || undefined);

    const isLoading = loadingMonthly || loadingClients || loadingTurnaround;

    const sortedClients = [...(clients?.clients ?? [])].sort((a, b) => b.total - a.total).slice(0, 5);
    const impVol = monthly?.total_imports || 0;
    const expVol = monthly?.total_exports || 0;
    const totalVol = monthly?.total || 0;
    const monthlyData = monthly?.months || [];

    const completedCount = (turnaround?.imports.completed_count || 0) + (turnaround?.exports.completed_count || 0);
    const completionRatio = totalVol > 0 ? Math.round((completedCount / totalVol) * 100) : 0;

    return (
        <div className="w-full px-1 py-2 space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                        Reports &amp; Analytics
                    </h1>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                        {year}{month ? ` · ${MONTH_FULL[month - 1]}` : ' · Full Year'} · {dateTime.date}
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <select
                        value={year}
                        onChange={e => setYear(Number(e.target.value))}
                        className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-xs"
                    >
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select
                        value={month}
                        onChange={e => setMonth(Number(e.target.value))}
                        className="px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-xs"
                    >
                        <option value={0}>All Months</option>
                        {MONTH_FULL.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                    </select>
                    <button
                        onClick={() => downloadCSV(monthly, clients, turnaround, year, month)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="py-24 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                        <p className="text-sm text-gray-400">Loading report data…</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* KPI Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <StatCard
                            label="Total Transactions"
                            value={totalVol}
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                            accent="#38bdf8"
                        />
                        <StatCard
                            label="Active Clients"
                            value={clients?.clients.length || 0}
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                            accent="#a78bfa"
                        />
                        <StatCard
                            label="Avg Import Speed"
                            value={turnaround?.imports.avg_days ?? '—'}
                            unit={turnaround?.imports.avg_days ? 'days' : ''}
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            accent="#34d399"
                        />
                        <StatCard
                            label="Avg Export Speed"
                            value={turnaround?.exports.avg_days ?? '—'}
                            unit={turnaround?.exports.avg_days ? 'days' : ''}
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                            accent="#fb923c"
                        />
                    </div>

                    {/* Main Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Monthly Volume Chart */}
                        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/8 rounded-2xl p-6 shadow-xs flex flex-col">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Monthly Volume</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">Imports &amp; exports per month</p>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#38bdf8' }} />Imports</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#a78bfa' }} />Exports</span>
                                </div>
                            </div>

                            {monthlyData.length > 0 ? (
                                <MonthlyBars data={monthlyData} />
                            ) : (
                                <div className="h-24 flex items-center justify-center text-sm text-gray-400">No data for this period</div>
                            )}

                            {/* Summary row below bars */}
                            <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100 dark:border-white/5">
                                <div className="text-center">
                                    <p className="text-xs text-gray-400 mb-0.5">Imports</p>
                                    <p className="text-base font-bold" style={{ color: '#38bdf8' }}>{impVol}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-400 mb-0.5">Exports</p>
                                    <p className="text-base font-bold" style={{ color: '#a78bfa' }}>{expVol}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-400 mb-0.5">Total</p>
                                    <p className="text-base font-bold text-gray-800 dark:text-gray-100">{totalVol}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-400 mb-0.5">Import %</p>
                                    <p className="text-base font-bold text-gray-800 dark:text-gray-100">
                                        {totalVol ? Math.round((impVol / totalVol) * 100) : 0}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Transaction Flow */}
                        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/8 rounded-2xl p-6 shadow-xs flex flex-col">
                            <div className="mb-6">
                                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Transaction Flow</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Import vs. export distribution</p>
                            </div>

                            <div className="flex-1 flex items-center gap-6">
                                {/* Donut — centered */}
                                <div className="flex items-center justify-center flex-shrink-0">
                                    <FlowDonut imports={impVol} exports={expVol} />
                                </div>

                                {/* Horizontal bars */}
                                <div className="flex-1 flex flex-col justify-around gap-4">
                                    {/* Imports */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#38bdf8' }} />Imports
                                            </span>
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{impVol} <span className="text-gray-400 font-normal">txs</span></span>
                                        </div>
                                        <div className="h-5 bg-gray-100 dark:bg-white/5 rounded-full">
                                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${totalVol ? (impVol / totalVol) * 100 : 0}%`, backgroundColor: '#38bdf8' }} />
                                        </div>
                                    </div>
                                    {/* Exports */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#a78bfa' }} />Exports
                                            </span>
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{expVol} <span className="text-gray-400 font-normal">txs</span></span>
                                        </div>
                                        <div className="h-5 bg-gray-100 dark:bg-white/5 rounded-full">
                                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${totalVol ? (expVol / totalVol) * 100 : 0}%`, backgroundColor: '#a78bfa' }} />
                                        </div>
                                    </div>
                                    {/* Completed */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#34d399' }} />Completed
                                            </span>
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{completionRatio}%</span>
                                        </div>
                                        <div className="h-5 bg-gray-100 dark:bg-white/5 rounded-full">
                                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${completionRatio}%`, backgroundColor: '#34d399' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Clients + Turnaround */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Client Distribution */}
                        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/8 rounded-2xl p-6 shadow-xs">
                            <div className="mb-5">
                                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Client Distribution</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Top clients by transaction volume</p>
                            </div>

                            {sortedClients.length > 0 ? (
                                <MiniBarChart
                                    data={sortedClients.map((c, i) => ({
                                        label: c.client_name,
                                        value: c.total,
                                        color: ['#38bdf8', '#a78bfa', '#34d399', '#fb923c', '#f472b6'][i] || '#94a3b8',
                                    }))}
                                />
                            ) : (
                                <div className="py-8 flex items-center justify-center text-sm text-gray-400">No client data for this period</div>
                            )}

                            {sortedClients.length > 0 && (
                                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/5">
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>Most active client</span>
                                        <span className="font-medium truncate max-w-[180px]" style={{ color: '#38bdf8' }} title={sortedClients[0]?.client_name}>
                                            {sortedClients[0]?.client_name || '—'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Turnaround Times */}
                        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/8 rounded-2xl p-6 shadow-xs">
                            <div className="mb-5">
                                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Turnaround Performance</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Average processing speed by type</p>
                            </div>

                            <div className="space-y-5">
                                {/* Import Turnaround */}
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#38bdf820' }}>
                                        <svg className="w-5 h-5" style={{ color: '#38bdf8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Imports</span>
                                            <span className="text-xs font-bold text-gray-800 dark:text-gray-100">
                                                {turnaround?.imports.avg_days ?? '—'} days avg
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full">
                                            <div className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${Math.min(((turnaround?.imports.avg_days || 0) / 20) * 100, 100)}%`, backgroundColor: '#38bdf8' }} />
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            <span className="text-[10px] text-gray-400">{turnaround?.imports.completed_count ?? 0} completed</span>
                                            <span className="text-[10px] text-gray-400">{turnaround?.imports.min_days ?? '—'}–{turnaround?.imports.max_days ?? '—'} days range</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100 dark:bg-white/5" />

                                {/* Export Turnaround */}
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#fb923c20' }}>
                                        <svg className="w-5 h-5" style={{ color: '#fb923c' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Exports</span>
                                            <span className="text-xs font-bold text-gray-800 dark:text-gray-100">
                                                {turnaround?.exports.avg_days ?? '—'} days avg
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full">
                                            <div className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${Math.min(((turnaround?.exports.avg_days || 0) / 20) * 100, 100)}%`, backgroundColor: '#fb923c' }} />
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            <span className="text-[10px] text-gray-400">{turnaround?.exports.completed_count ?? 0} completed</span>
                                            <span className="text-[10px] text-gray-400">{turnaround?.exports.min_days ?? '—'}–{turnaround?.exports.max_days ?? '—'} days range</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100 dark:bg-white/5" />

                                {/* Completion ratio summary */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Completion Rate</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">{completedCount} of {totalVol} transactions completed</p>
                                    </div>
                                    <div className="text-2xl font-bold tabular-nums" style={{ color: '#34d399' }}>
                                        {completionRatio}<span className="text-sm font-normal text-gray-400">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
