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
    CardHeader,
    CardTitle,
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
        accentColor: 'text-sky-500',
    },
];

export const AccountingDashboard = () => {
    const navigate = useNavigate();

    const { data: rawImports, isLoading: loadingImports } = useQuery({
        queryKey: [...trackingKeys.imports.list(), 'accounting-dashboard-imports'],
        queryFn: () => trackingApi.getAllImports({ exclude_statuses: 'completed,cancelled', operational_scope: 'workspace' }),
    });

    const { data: rawExports, isLoading: loadingExports } = useQuery({
        queryKey: [...trackingKeys.exports.list(), 'accounting-dashboard-exports'],
        queryFn: () => trackingApi.getAllExports({ exclude_statuses: 'completed,cancelled', operational_scope: 'workspace' }),
    });

    const isLoading = loadingImports || loadingExports;

    const metrics = useMemo(() => {
        let readyImportBilling = 0;
        let readyExportBilling = 0;
        let pendingImportBilling = 0;
        let pendingExportBilling = 0;
        let importAttention = 0;
        let exportAttention = 0;

        rawImports?.forEach((tx) => {
            const stages = tx.stages;
            const actionability = getImportAccountingActionability(stages);

            if (stages?.billing !== 'completed') {
                pendingImportBilling++;
                if (actionability.billing) {
                    readyImportBilling++;
                }
            }

            if (tx.open_remarks_count > 0) {
                importAttention++;
            }
        });

        rawExports?.forEach((tx) => {
            const stages = tx.stages;
            const actionability = getExportAccountingActionability(stages);

            if (stages?.billing !== 'completed') {
                pendingExportBilling++;
                if (actionability.billing) {
                    readyExportBilling++;
                }
            }

            if (tx.open_remarks_count > 0) {
                exportAttention++;
            }
        });

        const readyBilling = readyImportBilling + readyExportBilling;
        const totalPending = pendingImportBilling + pendingExportBilling;
        const totalAttention = importAttention + exportAttention;

        return {
            readyImportBilling,
            readyExportBilling,
            readyBilling,
            pendingImportBilling,
            pendingExportBilling,
            totalPending,
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Active Imports */}
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Active Imports</CardTitle>
                        <Truck className="size-4 text-blue-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {isLoading ? '...' : (rawImports?.length ?? 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {metrics.pendingImportBilling} pending billing
                        </p>
                    </CardContent>
                </Card>

                {/* 2. Active Exports */}
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Active Exports</CardTitle>
                        <Flag className="size-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {isLoading ? '...' : (rawExports?.length ?? 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {metrics.pendingExportBilling} pending billing
                        </p>
                    </CardContent>
                </Card>

                {/* 3. Ready to Bill */}
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Ready to Bill</CardTitle>
                        <Receipt className="size-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {isLoading ? '...' : metrics.readyBilling}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {metrics.readyImportBilling} imports · {metrics.readyExportBilling} exports
                        </p>
                    </CardContent>
                </Card>

                {/* 4. Needs Attention */}
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Needs Attention</CardTitle>
                        <AlertCircle className={`size-4 ${metrics.totalAttention > 0 ? 'text-rose-500' : 'text-muted-foreground/70'}`} />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div
                            className={`text-2xl font-bold tracking-tight tabular-nums ${
                                metrics.totalAttention > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
                            }`}
                        >
                            {isLoading ? '...' : metrics.totalAttention}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Open operational remarks
                        </p>
                    </CardContent>
                </Card>
            </div>

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
