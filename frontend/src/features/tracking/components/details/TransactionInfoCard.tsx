import { Calendar, FileText, Ship } from 'lucide-react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Progress } from '../../../../components/ui/progress';
import type { ExportTransaction, ImportTransaction } from '../../types';
import type { StageDefinition } from '../../utils/stageUtils';

interface TransactionInfoCardProps {
    transaction:   ImportTransaction | ExportTransaction;
    isImport:      boolean;
    importTx:      ImportTransaction | null;
    exportTx:      ExportTransaction | null;
    stages:        StageDefinition[];
    stageStatuses: ('completed' | 'active' | 'pending')[];
    statusColor:   string;
}

function getChannelStyle(colorLabel?: string) {
    const raw = (colorLabel || '').toLowerCase().trim();
    if (raw === 'yellow' || raw === 'orange') {
        return {
            dotClass: 'bg-amber-400 ring-2 ring-amber-400/30',
            textClass: 'text-amber-600 dark:text-amber-400 font-semibold',
        };
    }
    if (raw === 'green') {
        return {
            dotClass: 'bg-emerald-500 ring-2 ring-emerald-500/30',
            textClass: 'text-emerald-600 dark:text-emerald-400 font-semibold',
        };
    }
    if (raw === 'red') {
        return {
            dotClass: 'bg-rose-500 ring-2 ring-rose-500/30',
            textClass: 'text-rose-600 dark:text-rose-400 font-semibold',
        };
    }
    return {
        dotClass: 'bg-muted-foreground ring-2 ring-muted-foreground/30',
        textClass: 'text-muted-foreground font-semibold',
    };
}

export const TransactionInfoCard = ({
    transaction,
    isImport,
    importTx,
    exportTx,
    stages,
    stageStatuses,
}: TransactionInfoCardProps) => {
    const completedCount = stageStatuses.filter((s) => s === 'completed').length;
    const progressPct = Math.round((completedCount / stages.length) * 100);

    const vesselName = importTx?.vesselName ?? (transaction as ExportTransaction).vessel ?? '—';
    const importerOrShipper = importTx?.importer ?? exportTx?.shipper ?? '—';
    const locationOrPort = isImport
        ? (importTx?.locationOfGoods || importTx?.originCountry || '—')
        : (exportTx?.portOfDestination || '—');
    const dateValue = importTx?.date ?? exportTx?.departureDate ?? '—';
    const channelStyle = getChannelStyle(importTx?.colorLabel);

    return (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Vessel / Carrier */}
            <Card className="shadow-2xs">
                <CardContent className="p-3 sm:p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                        <span>Vessel / Carrier</span>
                        <Ship className="size-3.5" />
                    </div>
                    <div className="text-sm font-bold truncate text-foreground" title={vesselName}>
                        {vesselName}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate" title={`Location: ${locationOrPort}`}>
                        Location: {locationOrPort}
                    </p>
                </CardContent>
            </Card>

            {/* Card 2: Bill of Lading & Client */}
            <Card className="shadow-2xs">
                <CardContent className="p-3 sm:p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                        <span>Bill of Lading</span>
                        <FileText className="size-3.5" />
                    </div>
                    <div className="text-sm font-bold font-mono truncate text-foreground" title={transaction.bl || '—'}>
                        {transaction.bl || '—'}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate" title={`${isImport ? 'Importer' : 'Shipper'}: ${importerOrShipper}`}>
                        Client: {importerOrShipper}
                    </p>
                </CardContent>
            </Card>

            {/* Card 3: Arrival Schedule & Channel / Destination */}
            <Card className="shadow-2xs">
                <CardContent className="p-3 sm:p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                        <span>{isImport ? 'Arrival & Channel' : 'Departure & Port'}</span>
                        <Calendar className="size-3.5" />
                    </div>
                    <div className="text-sm font-bold tabular-nums text-foreground">
                        {dateValue}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                        {isImport ? (
                            <>
                                <span>Channel:</span>
                                <span className={`inline-flex items-center gap-1.5 ${channelStyle.textClass}`}>
                                    <span className={`size-2 rounded-full inline-block shrink-0 ${channelStyle.dotClass}`} />
                                    <span>{importTx?.colorLabel || 'None'}</span>
                                </span>
                            </>
                        ) : (
                            <span className="truncate">Port: {exportTx?.portOfDestination || '—'}</span>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Card 4: Clearance Progress */}
            <Card className="shadow-2xs">
                <CardContent className="p-3 sm:p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                        <span>Clearance Progress</span>
                        <span className="font-mono font-bold text-foreground text-xs">{progressPct}%</span>
                    </div>
                    <div className="text-sm font-bold tabular-nums text-foreground">
                        {completedCount} / {stages.length} Stages
                    </div>
                    <Progress value={progressPct} className="h-1.5" />
                </CardContent>
            </Card>
        </div>
    );
};
