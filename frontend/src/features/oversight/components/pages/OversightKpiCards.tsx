import { AlertCircle, ArrowDownLeft, ArrowUpRight, Layers } from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '../../../../components/ui/card';

export interface OversightStats {
    total: number;
    imports: number;
    exports: number;
    needsAttention: number;
}

interface OversightKpiCardsProps {
    stats: OversightStats;
}

export const OversightKpiCards = ({ stats }: OversightKpiCardsProps) => {
    const importPct = stats.total > 0 ? Math.round((stats.imports / stats.total) * 100) : 0;
    const exportPct = stats.total > 0 ? Math.round((stats.exports / stats.total) * 100) : 0;

    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Transactions */}
            <Card className="p-4 gap-2 shadow-xs bg-card">
                <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Total Transactions</CardTitle>
                    <Layers className="size-4 text-muted-foreground/70" />
                </CardHeader>
                <CardContent className="p-0">
                    <div className="text-2xl font-bold tracking-tight text-foreground">{stats.total.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">All monitored transaction records</p>
                </CardContent>
            </Card>

            {/* Imports */}
            <Card className="p-4 gap-2 shadow-xs bg-card">
                <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Imports</CardTitle>
                    <ArrowDownLeft className="size-4 text-blue-500" />
                </CardHeader>
                <CardContent className="p-0">
                    <div className="text-2xl font-bold tracking-tight text-foreground">{stats.imports.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">{importPct}% of total volume</p>
                </CardContent>
            </Card>

            {/* Exports */}
            <Card className="p-4 gap-2 shadow-xs bg-card">
                <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Exports</CardTitle>
                    <ArrowUpRight className="size-4 text-emerald-500" />
                </CardHeader>
                <CardContent className="p-0">
                    <div className="text-2xl font-bold tracking-tight text-foreground">{stats.exports.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">{exportPct}% of total volume</p>
                </CardContent>
            </Card>

            {/* Needs Attention */}
            <Card className="p-4 gap-2 shadow-xs bg-card">
                <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Needs Attention</CardTitle>
                    <span className="sr-only">{stats.needsAttention}</span>
                    <AlertCircle className={`size-4 ${stats.needsAttention > 0 ? 'text-rose-500' : 'text-muted-foreground/70'}`} />
                </CardHeader>
                <CardContent className="p-0">
                    <div className={`text-2xl font-bold tracking-tight ${stats.needsAttention > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                        {stats.needsAttention.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Transactions with open remarks</p>
                </CardContent>
            </Card>
        </div>
    );
};
