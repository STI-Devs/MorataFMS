import { useState } from 'react';
import { Eye, X } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { useCancelTransaction } from '../../hooks/useCancelTransaction';
import { useCreateTransaction } from '../../hooks/useCreateTransaction';
import { useTrackingViewMode } from '../../hooks/useTrackingViewMode';
import type { ApiExportTransaction, CreateExportPayload, ExportTransaction } from '../../types';
import { mapExportTransaction } from '../../utils/mappers';
import { CancelTransactionModal } from '../modals/CancelTransactionModal';
import { EncodeModal } from '../modals/EncodeModal';
import { TransactionListPage } from '../pages/TransactionListPage';
import type { VesselListFilters } from '../vessel-groups/VesselListToolbar';
import { VesselListToolbar } from '../vessel-groups/VesselListToolbar';
import { VesselGroupedExportList } from '../vessel-groups/VesselGroupedExportList';
import { StatusBadge } from '../../../../components/StatusBadge';
import { appRoutes } from '../../../../lib/appRoutes';

const CANCELLABLE_EXPORT_STATUSES = new Set(['Pending', 'In Transit', 'Departure', 'Processing', 'In Progress']);
const DEFAULT_FILTERS: VesselListFilters = {
    search: '',
    status: 'all',
    time: 'all',
};

function toTitleCase(str: string | null | undefined): string {
    if (!str) return '—';
    return str
        .toLowerCase()
        .replace(/\b([a-z])/g, (match) => match.toUpperCase())
        .replace(/\b([a-z0-9]*\d[a-z0-9]*)\b/gi, (match) => match.toUpperCase())
        .replace(/\bCma\b/gi, 'CMA')
        .replace(/\bCgm\b/gi, 'CGM')
        .replace(/\bMsc\b/gi, 'MSC')
        .replace(/\bApl\b/gi, 'APL')
        .replace(/\bOne\b/gi, 'ONE')
        .replace(/\bInc\b\.?/gi, 'Inc.')
        .replace(/\bCo\b\.?/gi, 'Co.')
        .replace(/\bCorp\b\.?/gi, 'Corp.')
        .replace(/\bLlc\b/gi, 'LLC')
        .replace(/\bLtd\b\.?/gi, 'Ltd.')
        .replace(/\.{2,}/g, '.');
}

export const ExportList = () => {
    const [viewMode, setViewMode] = useTrackingViewMode();
    const [filters, setFilters] = useState<VesselListFilters>(DEFAULT_FILTERS);
    const [isEncodeOpen, setIsEncodeOpen] = useState(false);
    const [cancelTarget, setCancelTarget] = useState<{ id: number; ref: string } | null>(null);

    const createMutation = useCreateTransaction('export');
    const cancelMutation = useCancelTransaction('export');

    const handleFiltersChange = (partial: Partial<VesselListFilters>) => {
        setFilters((prev) => ({ ...prev, ...partial }));
    };

    if (viewMode === 'flat') {
        return (
            <>
                <div className="w-full space-y-6 pb-8">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Export Transactions
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage each export shipment record with transaction-level status, document, and cancellation controls.
                        </p>
                    </div>

                    <VesselListToolbar
                        type="export"
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        onEncode={() => setIsEncodeOpen(true)}
                        encodeLabel="Encode Export"
                    />

                    <TransactionListPage<ExportTransaction>
                        type="export"
                        filters={filters}
                        gridTemplateColumns="1.4fr 1.2fr 1.3fr 1.1fr 110px 1.4fr 80px"
                        minGridWidth="880px"
                        mapResponseData={(data) => (data as ApiExportTransaction[]).map(mapExportTransaction)}
                        renderHeaders={() => (
                            <>
                                <span className="text-left">Shipper</span>
                                <span className="text-left">BL No.</span>
                                <span className="text-left">Vessel</span>
                                <span className="text-left">Departure</span>
                                <span className="text-left">Status</span>
                                <span className="text-left">Destination</span>
                                <span className="text-end">Actions</span>
                            </>
                        )}
                        renderRow={(row, _, navigate, onCancel) => (
                            <>
                                <span className="text-xs font-medium text-foreground truncate text-left" title={toTitleCase(row.shipper)}>
                                    {toTitleCase(row.shipper)}
                                </span>
                                <span className="font-mono text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate text-left" title={row.bl || ''}>
                                    {row.bl || '—'}
                                </span>
                                <span className="text-xs text-muted-foreground truncate text-left" title={toTitleCase(row.vessel)}>
                                    {toTitleCase(row.vessel)}
                                </span>
                                <span className="text-xs text-muted-foreground tabular-nums truncate text-left" title={row.departureDate || ''}>
                                    {row.departureDate || '—'}
                                </span>
                                <div className="flex justify-start shrink-0">
                                    <StatusBadge status={row.status} />
                                </div>
                                <span className="text-xs text-muted-foreground truncate text-left" title={toTitleCase(row.portOfDestination)}>
                                    {toTitleCase(row.portOfDestination)}
                                </span>
                                <div className="flex justify-end gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(appRoutes.trackingDetail.replace(':referenceId', encodeURIComponent(row.ref)));
                                        }}
                                        title="View Details"
                                    >
                                        <Eye className="size-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={!CANCELLABLE_EXPORT_STATUSES.has(row.status)}
                                        className={`size-7 cursor-pointer ${CANCELLABLE_EXPORT_STATUSES.has(row.status) ? 'text-muted-foreground hover:text-destructive' : 'opacity-30 cursor-not-allowed'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (CANCELLABLE_EXPORT_STATUSES.has(row.status)) {
                                                onCancel(row.id, row.ref);
                                            }
                                        }}
                                        title={CANCELLABLE_EXPORT_STATUSES.has(row.status) ? 'Cancel Transaction' : 'Cannot cancel'}
                                    >
                                        <X className="size-3.5" />
                                    </Button>
                                </div>
                            </>
                        )}
                    />
                </div>

                <EncodeModal
                    isOpen={isEncodeOpen}
                    onClose={() => setIsEncodeOpen(false)}
                    type="export"
                    onSave={async (data) => {
                        await createMutation.mutateAsync(data as CreateExportPayload);
                    }}
                />
            </>
        );
    }

    // Grouped view (default)
    return (
        <>
            <div className="w-full space-y-6 pb-8">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Export Transactions
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage each export shipment record with transaction-level status, document, and cancellation controls.
                    </p>
                </div>

                <VesselListToolbar
                    type="export"
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onEncode={() => setIsEncodeOpen(true)}
                    encodeLabel="Encode Export"
                />

                <VesselGroupedExportList
                    filters={filters}
                    onCancel={(id, ref) => setCancelTarget({ id, ref })}
                />
            </div>

            <EncodeModal
                isOpen={isEncodeOpen}
                onClose={() => setIsEncodeOpen(false)}
                type="export"
                onSave={async (data) => {
                    await createMutation.mutateAsync(data as CreateExportPayload);
                }}
            />

            <CancelTransactionModal
                isOpen={!!cancelTarget}
                onClose={() => setCancelTarget(null)}
                transactionRef={cancelTarget?.ref ?? ''}
                isLoading={cancelMutation.isPending}
                onConfirm={(reason) => {
                    if (cancelTarget) {
                        cancelMutation.mutate(
                            { id: cancelTarget.id, reason },
                            { onSuccess: () => setCancelTarget(null) },
                        );
                    }
                }}
            />
        </>
    );
};

