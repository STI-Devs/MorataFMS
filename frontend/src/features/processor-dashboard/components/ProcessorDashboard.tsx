import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    ArrowRight,
    FileSpreadsheet,
    Flag,
    FolderOpen,
    Layers,
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
import { getExportProcessorActionability, getImportProcessorActionability } from '../../tracking/utils/stageUtils';

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
        description: 'Track and manage shared processor-stage queues for imports (PPA, Port Charges) and exports (CIL, DCCCI).',
        path: appRoutes.processorTransaction,
        icon: FileSpreadsheet,
        badgeLabel: 'Task Queue',
        accentColor: 'text-primary',
    },
    {
        label: 'Documents',
        description: 'Access and view archived processor attachments and stage clearances.',
        path: appRoutes.processorDocuments,
        icon: FolderOpen,
        badgeLabel: 'Document Library',
        accentColor: 'text-sky-500',
    },
];

export const ProcessorDashboard = () => {
    const navigate = useNavigate();

    const { data: rawImports, isLoading: loadingImports } = useQuery({
        queryKey: [...trackingKeys.imports.list(), 'processor-dashboard-imports'],
        queryFn: () => trackingApi.getAllImports({ exclude_statuses: 'completed,cancelled', operational_scope: 'workspace' }),
    });

    const { data: rawExports, isLoading: loadingExports } = useQuery({
        queryKey: [...trackingKeys.exports.list(), 'processor-dashboard-exports'],
        queryFn: () => trackingApi.getAllExports({ exclude_statuses: 'completed,cancelled', operational_scope: 'workspace' }),
    });

    const isLoading = loadingImports || loadingExports;

    const metrics = useMemo(() => {
        let readyPPA = 0;
        let readyPortCharges = 0;
        let readyCIL = 0;
        let readyDCCCI = 0;
        let pendingImportTasks = 0;
        let pendingExportTasks = 0;
        let importAttention = 0;
        let exportAttention = 0;

        rawImports?.forEach((tx) => {
            const stages = tx.stages;
            const actionability = getImportProcessorActionability(stages);

            if (stages?.ppa !== 'completed') {
                pendingImportTasks++;
                if (actionability.ppa) {
                    readyPPA++;
                }
            }

            if (stages?.port_charges !== 'completed') {
                pendingImportTasks++;
                if (actionability.port_charges) {
                    readyPortCharges++;
                }
            }

            if (tx.open_remarks_count > 0) {
                importAttention++;
            }
        });

        rawExports?.forEach((tx) => {
            const stages = tx.stages;
            const actionability = getExportProcessorActionability(stages);

            if (stages?.cil !== 'completed') {
                pendingExportTasks++;
                if (actionability.cil) {
                    readyCIL++;
                }
            }

            if (stages?.dccci !== 'completed') {
                pendingExportTasks++;
                if (actionability.dccci) {
                    readyDCCCI++;
                }
            }

            if (tx.open_remarks_count > 0) {
                exportAttention++;
            }
        });

        const readyImportTasks = readyPPA + readyPortCharges;
        const readyExportTasks = readyCIL + readyDCCCI;
        const readyTasks = readyImportTasks + readyExportTasks;
        const totalAttention = importAttention + exportAttention;

        return {
            readyPPA,
            readyPortCharges,
            readyCIL,
            readyDCCCI,
            readyImportTasks,
            readyExportTasks,
            readyTasks,
            pendingImportTasks,
            pendingExportTasks,
            totalAttention,
        };
    }, [rawImports, rawExports]);

    return (
        <div className="w-full space-y-6 pb-8">
            {/* Header */}
            <header className="flex flex-col gap-1 border-b border-border/80 pb-5">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Processor Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                    Manage shared processor uploads for active transactions while encoder ownership stays with the file owner.
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
                            {metrics.pendingImportTasks} pending stages (PPA/Port Charges)
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
                            {metrics.pendingExportTasks} pending stages (CIL/DCCCI)
                        </p>
                    </CardContent>
                </Card>

                {/* 3. Ready to Process */}
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Ready to Process</CardTitle>
                        <Layers className="size-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {isLoading ? '...' : metrics.readyTasks}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {metrics.readyImportTasks} imports · {metrics.readyExportTasks} exports
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

            {/* Section 2: Module Navigation */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Processor Workspace Modules
                    </h2>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    {moduleCards.map((card) => {
                        const IconComponent = card.icon;
                        return (
                            <Card
                                key={card.label}
                                id={`processor-module-${card.label.toLowerCase().replace(/\s+/g, '-')}`}
                                onClick={() => navigate(card.path)}
                                className="group relative overflow-hidden transition-all hover:border-primary/50 hover:shadow-xs cursor-pointer"
                            >
                                <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-9 items-center justify-center rounded-lg border border-border/80 bg-muted/40 transition-colors group-hover:border-primary/30 group-hover:bg-primary/5">
                                                <IconComponent className={`size-4.5 ${card.accentColor}`} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                                    {card.label}
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {card.description}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium shrink-0">
                                            {card.badgeLabel}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-end text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors gap-1 pt-1">
                                        Open Module
                                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};
