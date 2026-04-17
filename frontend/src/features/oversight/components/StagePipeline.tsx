import { useTheme } from '../../../context/ThemeContext';
import type { ExportStages, ImportStages, OversightTransaction } from '../types/transaction.types';

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

const STATUS_CFG: Record<string, { color: string; bg: string; icon: string }> = {
    completed:   { color: '#30d158', bg: 'rgba(48,209,88,0.15)', icon: '✓' },
    in_progress: { color: '#0a84ff', bg: 'rgba(10,132,255,0.15)', icon: '⟳' },
    pending:     { color: '#636366', bg: 'rgba(99,99,102,0.10)', icon: '○' },
};

interface StagePipelineProps {
    transaction: OversightTransaction;
}

export const StagePipeline = ({ transaction }: StagePipelineProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (!transaction.stages) {
        return <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>No stage data</span>;
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
        <div className="flex items-center gap-1">
            {entries.map((stage, i) => {
                const cfg = STATUS_CFG[stage.status] ?? STATUS_CFG.pending;
                return (
                    <div key={stage.key} className="flex items-center">
                        {i > 0 && (
                            <div
                                className="w-3 h-0.5 mx-0.5"
                                style={{
                                    backgroundColor: stage.status === 'completed' || entries[i - 1]?.status === 'completed'
                                        ? cfg.color
                                        : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                                }}
                            />
                        )}
                        <div
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
                            style={{ color: cfg.color, backgroundColor: cfg.bg }}
                            title={`${stage.label}: ${stage.notApplicable ? 'not applicable' : stage.status}`}
                        >
                            <span className="text-[9px]">{cfg.icon}</span>
                            {stage.label}
                            {stage.notApplicable ? ' (N/A)' : ''}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
