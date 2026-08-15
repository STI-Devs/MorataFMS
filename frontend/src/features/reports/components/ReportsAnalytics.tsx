import { useState } from 'react';
import {
    ArrowDownRight,
    ArrowUpRight,
    Award,
    Download,
    Layers,
    Users,
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { useCurrentDateTime } from '../../../hooks/useCurrentDateTime';
import { useClientReport, useMonthlyReport, useTurnaroundReport } from '../hooks/useReports';
import type { ClientReportResponse, MonthlyReportResponse, TurnaroundReportResponse } from '../types/report.types';

const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const REPORT_YEAR_START = 2026;

function buildReportYears(currentYear: number): number[] {
    return Array.from(
        { length: Math.max(currentYear - REPORT_YEAR_START + 1, 1) },
        (_, index) => currentYear - index,
    );
}

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
    const impPct = Math.max(imports / total, 0);
    const expPct = Math.max(exports / total, 0);
    const impDash = impPct * circ;
    const expDash = expPct * circ;

    return (
        <div className="relative size-36 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle
                    cx="50"
                    cy="50"
                    r={r}
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-muted/30"
                />
                {imports > 0 && (
                    <circle
                        cx="50"
                        cy="50"
                        r={r}
                        stroke="var(--primary)"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={`${impDash} ${circ}`}
                        className="transition-all duration-700"
                    />
                )}
                {exports > 0 && (
                    <circle
                        cx="50"
                        cy="50"
                        r={r}
                        stroke="var(--success)"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={`${expDash} ${circ}`}
                        strokeDashoffset={-impDash}
                        className="transition-all duration-700"
                    />
                )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold tabular-nums text-foreground">{total}</span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">TOTAL</span>
            </div>
        </div>
    );
};

const MiniBarChart = ({ data }: { data: { label: string; value: number; colorClass: string; rank: number }[] }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="space-y-3 w-full">
            {data.map((d) => (
                <div key={d.label} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                                #{d.rank}
                            </span>
                            <span className="text-foreground font-medium truncate max-w-[200px]" title={d.label}>
                                {d.label}
                            </span>
                        </div>
                        <span className="text-xs font-bold tabular-nums text-foreground ml-2">{d.value}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${d.colorClass}`}
                            style={{ width: `${(d.value / max) * 100}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

const MonthlyBars = ({
    data,
    selectedMonth,
}: {
    data: { month: number; imports: number; exports: number; total: number }[];
    selectedMonth: number;
}) => {
    const max = Math.max(...data.map(d => d.total), 1);
    const hasSelectedMonth = selectedMonth > 0;

    return (
        <div className="flex items-end gap-2 h-44 w-full pt-4">
            {data.map((d, i) => {
                const impH = (d.imports / max) * 100;
                const expH = (d.exports / max) * 100;
                const isSelected = selectedMonth === d.month;
                const segmentOpacity = !hasSelectedMonth || isSelected ? 1 : 0.35;

                return (
                    <div
                        key={i}
                        aria-current={isSelected ? 'true' : undefined}
                        className={`group/bar relative flex-1 flex flex-col items-center gap-1.5 transition-all duration-300 ${
                            hasSelectedMonth && !isSelected ? 'opacity-50' : 'opacity-100'
                        }`}
                    >
                        <div className="w-full flex flex-col justify-end items-center h-36">
                            <div
                                className={`w-full flex flex-col justify-end h-full gap-0.5 rounded-sm transition-all duration-300 ${
                                    isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''
                                }`}
                            >
                                <div
                                    className="w-full rounded-t-xs bg-primary transition-all duration-500 group-hover/bar:brightness-110"
                                    style={{ height: `${impH}%`, minHeight: d.imports > 0 ? '4px' : '0', opacity: segmentOpacity }}
                                    title={`Imports: ${d.imports}`}
                                />
                                <div
                                    className="w-full rounded-b-xs bg-success transition-all duration-500 group-hover/bar:brightness-110"
                                    style={{ height: `${expH}%`, minHeight: d.exports > 0 ? '4px' : '0', opacity: segmentOpacity }}
                                    title={`Exports: ${d.exports}`}
                                />
                            </div>
                        </div>
                        <span className={`text-[10px] font-semibold ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                            {MONTH_SHORT[d.month - 1]}
                        </span>

                        {/* Tooltip */}
                        <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-[10px] font-medium text-popover-foreground shadow-md group-hover/bar:block z-20">
                            <span className="text-primary font-semibold">{d.imports} Imp</span> /{' '}
                            <span className="text-success font-semibold">{d.exports} Exp</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

function reportVolumeForPeriod(monthly: MonthlyReportResponse | undefined, month: number): { imports: number; exports: number; total: number } {
    if (!monthly) {
        return { imports: 0, exports: 0, total: 0 };
    }

    if (month) {
        const selectedMonth = monthly.months.find((item) => item.month === month);

        return {
            imports: selectedMonth?.imports ?? 0,
            exports: selectedMonth?.exports ?? 0,
            total: selectedMonth?.total ?? 0,
        };
    }

    return {
        imports: monthly.total_imports,
        exports: monthly.total_exports,
        total: monthly.total,
    };
}

export const ReportsAnalytics = () => {
    const dateTime = useCurrentDateTime();

    const currentYear = new Date().getFullYear();
    const reportYears = buildReportYears(currentYear);
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(0);

    const { data: monthly, isLoading: loadingMonthly } = useMonthlyReport(year);
    const { data: clients, isLoading: loadingClients } = useClientReport(year, month || undefined);
    const { data: turnaround, isLoading: loadingTurnaround } = useTurnaroundReport(year, month || undefined);

    const isLoading = loadingMonthly || loadingClients || loadingTurnaround;

    const sortedClients = [...(clients?.clients ?? [])].sort((a, b) => b.total - a.total).slice(0, 5);
    const periodVolume = reportVolumeForPeriod(monthly, month);
    const impVol = periodVolume.imports;
    const expVol = periodVolume.exports;
    const totalVol = periodVolume.total;
    const monthlyData = monthly?.months || [];

    const completedCount = (turnaround?.imports.completed_count || 0) + (turnaround?.exports.completed_count || 0);
    const completionRatio = totalVol > 0 ? Math.round((completedCount / totalVol) * 100) : 0;

    const impPercent = totalVol > 0 ? Math.round((impVol / totalVol) * 100) : 0;
    const expPercent = totalVol > 0 ? Math.round((expVol / totalVol) * 100) : 0;

    const clientColors = [
        'bg-primary',
        'bg-emerald-500',
        'bg-amber-500',
        'bg-sky-500',
        'bg-indigo-500',
    ];

    return (
        <div className="w-full space-y-6 pb-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Reports &amp; Analytics
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {year}{month ? ` · ${MONTH_FULL[month - 1]}` : ' · Full Year'} · {dateTime.date}
                    </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <select
                        value={year}
                        onChange={e => setYear(Number(e.target.value))}
                        className="h-9 px-3 rounded-lg border border-border/80 bg-card text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs cursor-pointer"
                    >
                        {reportYears.map(selectedYear => (
                            <option key={selectedYear} value={selectedYear}>{selectedYear}</option>
                        ))}
                    </select>

                    <select
                        value={month}
                        onChange={e => setMonth(Number(e.target.value))}
                        className="h-9 px-3 rounded-lg border border-border/80 bg-card text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs cursor-pointer"
                    >
                        <option value={0}>All Months</option>
                        {MONTH_FULL.map((m, i) => (
                            <option key={i + 1} value={i + 1}>{m}</option>
                        ))}
                    </select>

                    <Button
                        onClick={() => downloadCSV(monthly, clients, turnaround, year, month)}
                        className="h-9 gap-2 text-xs font-semibold cursor-pointer shadow-xs"
                    >
                        <Download className="size-3.5" />
                        Export
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="rounded-xl border border-border/80 p-4 space-y-2 bg-card">
                                <Skeleton className="h-3.5 w-24" />
                                <div className="flex justify-between items-center">
                                    <Skeleton className="h-7 w-12" />
                                    <Skeleton className="h-5 w-14 rounded-md" />
                                </div>
                                <Skeleton className="h-3 w-full" />
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-border/80 p-6 space-y-4 bg-card h-72">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-full w-full" />
                        </div>
                        <div className="rounded-xl border border-border/80 p-6 space-y-4 bg-card h-72">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-full w-full" />
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Section 1: KPI Stat Cards */}
                    <section className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        {/* 1.1 Total Transactions */}
                        <Card className="cursor-pointer hover:border-border transition-all">
                            <CardHeader className="p-4 pb-2 space-y-1.5">
                                <CardDescription className="text-xs font-semibold text-muted-foreground">
                                    Total Transactions
                                </CardDescription>
                                <div className="flex items-center justify-between gap-2">
                                    <CardTitle className="text-2xl font-bold tabular-nums text-foreground">
                                        {totalVol}
                                    </CardTitle>
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 font-medium shrink-0 gap-1">
                                        <Layers className="size-3" />
                                        Volume
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardFooter className="flex-col items-start gap-1 p-4 pt-0 text-xs">
                                <div className="line-clamp-1 flex items-center gap-1.5 font-medium text-foreground text-[11px]">
                                    Active Period Volume
                                </div>
                                <div className="text-muted-foreground text-[11px] truncate">
                                    Files processed in {year}
                                </div>
                            </CardFooter>
                        </Card>

                        {/* 1.2 Active Clients */}
                        <Card className="cursor-pointer hover:border-border transition-all">
                            <CardHeader className="p-4 pb-2 space-y-1.5">
                                <CardDescription className="text-xs font-semibold text-muted-foreground">
                                    Active Clients
                                </CardDescription>
                                <div className="flex items-center justify-between gap-2">
                                    <CardTitle className="text-2xl font-bold tabular-nums text-foreground">
                                        {clients?.clients.length || 0}
                                    </CardTitle>
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 font-medium shrink-0 gap-1">
                                        <Users className="size-3" />
                                        Clients
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardFooter className="flex-col items-start gap-1 p-4 pt-0 text-xs">
                                <div className="line-clamp-1 flex items-center gap-1.5 font-medium text-foreground text-[11px]">
                                    Engaged Accounts
                                </div>
                                <div className="text-muted-foreground text-[11px] truncate">
                                    Active importers &amp; exporters
                                </div>
                            </CardFooter>
                        </Card>

                        {/* 1.3 Avg Import Speed */}
                        <Card className="cursor-pointer hover:border-border transition-all">
                            <CardHeader className="p-4 pb-2 space-y-1.5">
                                <CardDescription className="text-xs font-semibold text-muted-foreground">
                                    Avg Import Speed
                                </CardDescription>
                                <div className="flex items-center justify-between gap-2">
                                    <CardTitle className="text-2xl font-bold tabular-nums text-foreground">
                                        {turnaround?.imports.avg_days ?? '—'}
                                        {turnaround?.imports.avg_days ? <span className="text-sm font-normal text-muted-foreground ml-1">days</span> : ''}
                                    </CardTitle>
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 font-medium shrink-0 gap-1">
                                        <ArrowDownRight className="size-3" />
                                        Inbound SLA
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardFooter className="flex-col items-start gap-1 p-4 pt-0 text-xs">
                                <div className="line-clamp-1 flex items-center gap-1.5 font-medium text-foreground text-[11px]">
                                    Customs Clearance Avg
                                </div>
                                <div className="text-muted-foreground text-[11px] truncate">
                                    {turnaround?.imports.completed_count ?? 0} files completed
                                </div>
                            </CardFooter>
                        </Card>

                        {/* 1.4 Avg Export Speed */}
                        <Card className="cursor-pointer hover:border-border transition-all">
                            <CardHeader className="p-4 pb-2 space-y-1.5">
                                <CardDescription className="text-xs font-semibold text-muted-foreground">
                                    Avg Export Speed
                                </CardDescription>
                                <div className="flex items-center justify-between gap-2">
                                    <CardTitle className="text-2xl font-bold tabular-nums text-foreground">
                                        {turnaround?.exports.avg_days ?? '—'}
                                        {turnaround?.exports.avg_days ? <span className="text-sm font-normal text-muted-foreground ml-1">days</span> : ''}
                                    </CardTitle>
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 font-medium shrink-0 gap-1">
                                        <ArrowUpRight className="size-3" />
                                        Outbound SLA
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardFooter className="flex-col items-start gap-1 p-4 pt-0 text-xs">
                                <div className="line-clamp-1 flex items-center gap-1.5 font-medium text-foreground text-[11px]">
                                    Export Processing Avg
                                </div>
                                <div className="text-muted-foreground text-[11px] truncate">
                                    {turnaround?.exports.completed_count ?? 0} files completed
                                </div>
                            </CardFooter>
                        </Card>
                    </section>

                    {/* Section 2: Visual Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* 2.1 Monthly Volume Chart */}
                        <Card className="flex flex-col">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                        Monthly Volume
                                    </CardTitle>
                                    <div className="flex items-center gap-3 text-xs">
                                        <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                                            <span className="size-2 rounded-full bg-primary shrink-0" />
                                            Import
                                        </span>
                                        <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                                            <span className="size-2 rounded-full bg-success shrink-0" />
                                            Export
                                        </span>
                                    </div>
                                </div>
                                <CardDescription className="text-xs text-muted-foreground">
                                    Imports &amp; exports per month
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="mt-auto pt-2">
                                {monthlyData.length > 0 ? (
                                    <MonthlyBars data={monthlyData} selectedMonth={month} />
                                ) : (
                                    <div className="h-44 flex items-center justify-center text-xs text-muted-foreground">
                                        No data for this period
                                    </div>
                                )}

                                {/* Summary row below bars */}
                                <div className="grid grid-cols-3 items-center gap-4 mt-5 pt-4 border-t border-border/60">
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground mb-0.5">Imports</p>
                                        <p className="text-base font-bold text-primary tabular-nums">{impVol}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground mb-0.5">Exports</p>
                                        <p className="text-base font-bold text-success tabular-nums">{expVol}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground mb-0.5">Total</p>
                                        <p className="text-base font-bold text-foreground tabular-nums">{totalVol}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2.2 Transaction Flow */}
                        <Card className="flex flex-col">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                        Transaction Flow
                                    </CardTitle>
                                    <Badge variant="outline" className="text-[11px] font-medium">
                                        Distribution
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs text-muted-foreground">
                                    Import vs. export distribution
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="mt-auto pt-2">
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    {/* Donut — centered */}
                                    <FlowDonut imports={impVol} exports={expVol} />

                                    {/* Horizontal bars */}
                                    <div className="flex-1 w-full space-y-4">
                                        {/* Imports */}
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5 text-xs font-medium">
                                                <span className="text-muted-foreground flex items-center gap-1.5">
                                                    <span className="size-2 rounded-full bg-primary shrink-0" />
                                                    Imports
                                                </span>
                                                <span className="font-semibold text-foreground tabular-nums">{impVol} ({impPercent}%)</span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all duration-700"
                                                    style={{ width: `${impPercent}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Exports */}
                                        <div>
                                            <div className="flex justify-between items-center mb-1.5 text-xs font-medium">
                                                <span className="text-muted-foreground flex items-center gap-1.5">
                                                    <span className="size-2 rounded-full bg-success shrink-0" />
                                                    Exports
                                                </span>
                                                <span className="font-semibold text-foreground tabular-nums">{expVol} ({expPercent}%)</span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-success rounded-full transition-all duration-700"
                                                    style={{ width: `${expPercent}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Completed */}
                                        <div className="pt-2 border-t border-border/50">
                                            <div className="flex justify-between items-center mb-1.5 text-xs font-medium">
                                                <span className="text-muted-foreground flex items-center gap-1.5">
                                                    <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                                                    Completed
                                                </span>
                                                <span className="font-semibold text-foreground tabular-nums">{completionRatio}% · {completedCount} files</span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                                    style={{ width: `${completionRatio}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Section 3: Bottom Row: Clients + Turnaround */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* 3.1 Client Distribution */}
                        <Card className="flex flex-col justify-between">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                        Client Distribution
                                    </CardTitle>
                                    <Badge variant="outline" className="text-[11px] font-medium">
                                        Top Clients
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs text-muted-foreground">
                                    Top clients by transaction volume
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {sortedClients.length > 0 ? (
                                    <MiniBarChart
                                        data={sortedClients.map((c, i) => ({
                                            label: c.client_name,
                                            value: c.total,
                                            colorClass: clientColors[i % clientColors.length],
                                            rank: i + 1,
                                        }))}
                                    />
                                ) : (
                                    <div className="py-8 flex items-center justify-center text-xs text-muted-foreground">
                                        No client data for this period
                                    </div>
                                )}
                            </CardContent>

                            {sortedClients.length > 0 && (
                                <CardFooter className="p-4 pt-3 border-t border-border/50 text-xs flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                        <Award className="size-3.5 text-warning" />
                                        Most active client
                                    </span>
                                    <span className="font-semibold text-primary truncate max-w-[200px]" title={sortedClients[0]?.client_name}>
                                        {sortedClients[0]?.client_name || '—'}
                                    </span>
                                </CardFooter>
                            )}
                        </Card>

                        {/* 3.2 Turnaround Times */}
                        <Card className="flex flex-col justify-between">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                        Turnaround Performance
                                    </CardTitle>
                                    <Badge variant="outline" className="text-[11px] font-medium">
                                        Speed SLA
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs text-muted-foreground">
                                    Average processing speed by type
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Import Turnaround */}
                                <div className="flex items-center gap-3.5 p-3 rounded-xl border border-border/50 bg-card/60 shadow-xs">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <ArrowDownRight className="size-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-semibold text-foreground">Imports</span>
                                            <span className="text-xs font-bold tabular-nums text-foreground">
                                                {turnaround?.imports.avg_days ?? '—'} days avg
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all duration-700"
                                                style={{ width: `${Math.min(((turnaround?.imports.avg_days || 0) / 20) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-muted-foreground">
                                            <span>{turnaround?.imports.completed_count ?? 0} completed</span>
                                            <span>{turnaround?.imports.min_days ?? '—'}–{turnaround?.imports.max_days ?? '—'} days range</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Export Turnaround */}
                                <div className="flex items-center gap-3.5 p-3 rounded-xl border border-border/50 bg-card/60 shadow-xs">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                                        <ArrowUpRight className="size-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-semibold text-foreground">Exports</span>
                                            <span className="text-xs font-bold tabular-nums text-foreground">
                                                {turnaround?.exports.avg_days ?? '—'} days avg
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
                                            <div
                                                className="h-full bg-success rounded-full transition-all duration-700"
                                                style={{ width: `${Math.min(((turnaround?.exports.avg_days || 0) / 20) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-muted-foreground">
                                            <span>{turnaround?.exports.completed_count ?? 0} completed</span>
                                            <span>{turnaround?.exports.min_days ?? '—'}–{turnaround?.exports.max_days ?? '—'} days range</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>

                            {/* Completion ratio summary */}
                            <CardFooter className="p-4 pt-3 border-t border-border/50 text-xs flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-foreground">Overall Completion Rate</p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {completedCount} of {totalVol} transactions finalized
                                    </p>
                                </div>
                                <div className="text-xl font-bold tabular-nums text-emerald-500">
                                    {completionRatio}%
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
};
