import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    ArrowRight,
    FileSpreadsheet,
    Flag,
    FolderOpen,
    Receipt,
    Truck,
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import {
    Card,
    CardContent,
} from '../../../components/ui/card';
import { appRoutes } from '../../../lib/appRoutes';
import { trackingApi } from '../../tracking/api/trackingApi';
import { trackingKeys } from '../../tracking/utils/queryKeys';
import {
    getExportAccountingActionability,
    getImportAccountingActionability,
} from '../../tracking/utils/stageUtils';

type ModuleCard = {
    label: string;
    description: string;
    path: string;
    icon: typeof FileSpreadsheet;
    badgeLabel: string;
    accentColor: string;
};

const moduleCards: ModuleCard[] = [
    {
        label: 'Transaction Tasks',
        description: 'Track and manage import/export workflows for billing and liquidation uploads.',
        path: appRoutes.accountantImpExp,
        icon: FileSpreadsheet,
        badgeLabel: 'Task Queue',
        accentColor: 'text-emerald-500',
    },
    {
        label: 'Documents',
        description: 'Access billing attachments, finance receipts, and finalized transaction records.',
        path: appRoutes.accountantDocuments,
        icon: FolderOpen,
        badgeLabel: 'Document Library',
        accentColor: 'text-primary',
    },
];

export const AccountingDashboard = () => {
    const navigate = useNavigate();

    const importsQuery = useQuery({
        queryKey: [...trackingKeys.imports.list(), 'accounting-dashboard-imports'],
        queryFn: () => trackingApi.getAllImports({ exclude_statuses: 'completed,cancelled' }),
    });

    const exportsQuery = useQuery({
        queryKey: [...trackingKeys.exports.list(), 'accounting-dashboard-exports'],
        queryFn: () => trackingApi.getAllExports({ exclude_statuses: 'completed,cancelled' }),
    });

    const isLoading = importsQuery.isLoading || exportsQuery.isLoading;
    const rawImports = importsQuery.data;
    const rawExports = exportsQuery.data;

    const metrics = useMemo(() => {
        let readyImportBilling = 0;
        let readyExportBilling = 0;
        let pendingImportBilling = 0;
        let pendingExportBilling = 0;
        let importAttention = 0;
        let exportAttention = 0;

        rawImports?.forEach((tx) => {
            const isBilled = tx.stages?.billing === 'completed';
            if (!isBilled) {
                pendingImportBilling++;
                const actionability = getImportAccountingActionability(tx.stages);
                if (actionability.billing) {
                    readyImportBilling++;
                }
            }
            if (tx.open_remarks_count > 0) {
                importAttention++;
            }
        });

        rawExports?.forEach((tx) => {
            const isBilled = tx.stages?.billing === 'completed';
            if (!isBilled) {
                pendingExportBilling++;
                const actionability = getExportAccountingActionability(tx.stages);
                if (actionability.billing) {
                    readyExportBilling++;
                }
            }
            if (tx.open_remarks_count > 0) {
                exportAttention++;
            }
        });

        const readyBilling = readyImportBilling + readyExportBilling;
        const pendingBilling = pendingImportBilling + pendingExportBilling;
        const totalAttention = importAttention + exportAttention;

        return {
            readyBilling,
            readyImportBilling,
            readyExportBilling,
            pendingBilling,
            pendingImportBilling,
            pendingExportBilling,
            totalAttention,
        };
    }, [rawImports, rawExports]);

    return (
        <div className="w-full space-y-6 pb-8">
            {/* Header */}
            <header className="flex flex-col gap-1 border-b border-border/80 pb-5">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Accounting Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                    Manage shared accounting-stage uploads while encoder ownership remains with the brokerage file owner.
                </p>
            </header>

            {/* Section 1: KPI Metrics Cards */}
            <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                {/* 1. Active Imports */}
                <Card className="shadow-2xs">
                    <CardContent className="p-3 sm:p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                            <span>Active Imports</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium shrink-0 gap-1 border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <Truck className="size-3 text-blue-500" /> Imports
                            </Badge>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold tabular-nums text-foreground">
                            {isLoading ? '...' : (rawImports?.length ?? 0)}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                            {metrics.pendingImportBilling} pending billing
                        </p>
                    </CardContent>
                </Card>

                {/* 2. Active Exports */}
                <Card className="shadow-2xs">
                    <CardContent className="p-3 sm:p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                            <span>Active Exports</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium shrink-0 gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <Flag className="size-3 text-emerald-500" /> Exports
                            </Badge>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold tabular-nums text-foreground">
                            {isLoading ? '...' : (rawExports?.length ?? 0)}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                            {metrics.pendingExportBilling} pending billing
                        </p>
                    </CardContent>
                </Card>

                {/* 3. Ready to Bill */}
                <Card className="shadow-2xs">
                    <CardContent className="p-3 sm:p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                            <span>Ready to Bill</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium shrink-0 gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <Receipt className="size-3 text-emerald-500" /> Actionable
                            </Badge>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold tabular-nums text-foreground">
                            {isLoading ? '...' : metrics.readyBilling}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                            {metrics.readyImportBilling} imports · {metrics.readyExportBilling} exports
                        </p>
                    </CardContent>
                </Card>

                {/* 4. Needs Attention */}
                <Card className="shadow-2xs">
                    <CardContent className="p-3 sm:p-3.5 space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                            <span>Needs Attention</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium shrink-0 gap-1 border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                <AlertCircle className="size-3 text-rose-500" /> Remarks
                            </Badge>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold tabular-nums text-foreground">
                            {isLoading ? '...' : metrics.totalAttention}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                            Open operational remarks
                        </p>
                    </CardContent>
                </Card>
            </section>

            {/* Section 2: Modules Navigation */}
            <section className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="h-4 w-1 rounded-full bg-primary" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Modules
                    </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {moduleCards.map((card) => {
                        const IconComponent = card.icon;
                        return (
                            <button
                                key={card.label}
                                id={`accounting-module-${card.label.toLowerCase().replace(/\s+/g, '-')}`}
                                type="button"
                                onClick={() => navigate(card.path)}
                                className="group relative flex flex-col gap-4 overflow-hidden rounded-xl border border-border/80 bg-card p-5 text-left shadow-2xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xs cursor-pointer"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex size-11 items-center justify-center rounded-xl bg-muted/60 text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <IconComponent className={`size-5 ${card.accentColor}`} />
                                    </div>
                                    <Badge variant="secondary" className="text-[11px] font-medium">
                                        {card.badgeLabel}
                                    </Badge>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                                        {card.label}
                                    </p>
                                    <p className="text-xs leading-relaxed text-muted-foreground">
                                        {card.description}
                                    </p>
                                </div>

                                <div className="mt-auto flex items-center gap-1.5 text-xs font-semibold text-primary pt-2">
                                    Open module
                                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};
