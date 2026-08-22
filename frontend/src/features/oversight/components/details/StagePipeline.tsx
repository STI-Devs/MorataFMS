import { Check, Circle, RefreshCw } from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import type { ExportStages, ImportStages, OversightTransaction } from '../../types/transaction.types';

const IMPORT_STAGE_LABELS: Record<keyof ImportStages, string> = {
    boc: 'BOC',
    bonds: 'Bonds',
    ppa: 'PPA',
    do: 'D/O',
    port_charges: 'Port Chg.',
    releasing: 'Releasing',
    billing: 'Billing',
};

const EXPORT_STAGE_LABELS: Record<keyof ExportStages, string> = {
    boc: 'BOC',
    bl_generation: 'B/L',
    phytosanitary: 'Phyto',
    co: 'C/O',
    cil: 'CIL',
    dccci: 'DCCCI',
    billing: 'Billing',
};

// Local 3-state map for stage chips
const STATUS_CFG: Record<string, { color: string; bg: string; border: string; label: string; Icon: typeof Check }> = {
    completed:   { color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Completed', Icon: Check },
    in_progress: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', label: 'In Progress', Icon: RefreshCw },
    pending:     { color: 'text-muted-foreground', bg: 'bg-muted/40', border: 'border-border/60', label: 'Pending', Icon: Circle },
};

interface StagePipelineProps {
    transaction: OversightTransaction;
}

export const StagePipeline = ({ transaction }: StagePipelineProps) => {
    if (!transaction.stages) {
        return <span className="text-xs text-muted-foreground">No stage data</span>;
    }

    const entries = transaction.type === 'import'
        ? Object.entries(IMPORT_STAGE_LABELS).map(([key, label]) => ({
            key,
            label,
            status: (transaction.stages as ImportStages)[key as keyof ImportStages],
            notApplicable: transaction.not_applicable_stages?.includes(key) ?? false,
        }))
        : Object.entries(EXPORT_STAGE_LABELS).map(([key, label]) => ({
            key,
            label,
            status: (transaction.stages as ExportStages)[key as keyof ExportStages],
            notApplicable: transaction.not_applicable_stages?.includes(key) ?? false,
        }));

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {entries.map((stage, i) => {
                    const cfg = STATUS_CFG[stage.status] ?? STATUS_CFG.pending;
                    const StatusIcon = cfg.Icon;
                    const isCompleted = stage.status === 'completed';
                    const isInProgress = stage.status === 'in_progress';

                    return (
                        <div
                            key={stage.key}
                            title={`${stage.label}: ${stage.notApplicable ? 'not applicable' : stage.status}`}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                                isCompleted
                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                    : isInProgress
                                      ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20'
                                      : 'bg-muted/20 border-border/60'
                            }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                                    {i + 1}
                                </span>
                                <div>
                                    <p className="text-xs font-bold text-foreground">
                                        {stage.label}
                                        {stage.notApplicable ? ' (N/A)' : ''}
                                    </p>
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                className={`text-[10px] font-semibold px-2 py-0.5 capitalize gap-1 ${cfg.color} ${cfg.bg} ${cfg.border}`}
                            >
                                <StatusIcon className={`size-3 ${isInProgress ? 'animate-spin' : ''}`} />
                                {stage.notApplicable ? 'N/A' : cfg.label}
                            </Badge>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
