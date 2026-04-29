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

export const TransactionInfoCard = ({
    transaction,
    isImport,
    importTx,
    exportTx,
    stages,
    stageStatuses,
    statusColor,
}: TransactionInfoCardProps) => {
    const completedCount = stageStatuses.filter(s => s === 'completed').length;
    const progressPct    = Math.round((completedCount / stages.length) * 100);

    return (
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border border-b border-border">
                <div className="px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5">Bill of Lading</p>
                    <p className="text-sm font-bold text-text-primary truncate">{transaction.bl || '—'}</p>
                </div>
                <div className="px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5">{isImport ? 'Importer' : 'Shipper'}</p>
                    <p className="text-sm font-bold text-text-primary truncate">{importTx?.importer ?? exportTx?.shipper ?? '—'}</p>
                </div>
                <div className="px-5 py-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5">{isImport ? 'Arrival Date' : 'Departure Date'}</p>
                    <p className="text-sm font-bold text-text-primary truncate">{importTx?.date ?? exportTx?.departureDate ?? '—'}</p>
                </div>
                <div className="px-5 py-4">
                    {isImport ? (
                        <>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">Selective Color</p>
                            <span
                                className="text-sm font-bold capitalize px-2 py-0.5 rounded-md"
                                style={{
                                    color: importTx!.color,
                                    backgroundColor: `${importTx!.color}18`,
                                }}
                            >
                                {importTx!.colorLabel || '—'}
                            </span>
                        </>
                    ) : (
                        <>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5">Destination</p>
                            <p className="text-sm font-bold text-text-primary truncate">{exportTx?.portOfDestination || '—'}</p>
                        </>
                    )}
                </div>
            </div>

            {isImport && (
                <div className="grid grid-cols-1 border-b border-border sm:grid-cols-3 sm:divide-x divide-border">
                    <div className="px-5 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5">Origin</p>
                        <p className="text-sm font-bold text-text-primary truncate">{importTx?.originCountry || '—'}</p>
                    </div>
                    <div className="px-5 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5">Vessel Name</p>
                        <p className="text-sm font-bold text-text-primary truncate">{importTx?.vesselName || '—'}</p>
                    </div>
                    <div className="px-5 py-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5">Location of Goods</p>
                        <p className="text-sm font-bold text-text-primary truncate">{importTx?.locationOfGoods || '—'}</p>
                    </div>
                </div>
            )}

            {/* Progress bar */}
            <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-text-secondary">Clearance Progress</p>
                    <p className="text-xs font-bold tabular-nums" style={{ color: statusColor }}>
                        {completedCount} / {stages.length} stages &mdash; {progressPct}%
                    </p>
                </div>
                <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${progressPct}%`,
                            backgroundColor: statusColor,
                            boxShadow: progressPct > 0 ? `0 0 8px ${statusColor}60` : 'none',
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
