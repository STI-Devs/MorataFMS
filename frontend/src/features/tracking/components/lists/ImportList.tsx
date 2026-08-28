import { useState } from 'react';
import { Flag, Eye, X } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { StatusBadge } from '../../../../components/StatusBadge';
import { appRoutes } from '../../../../lib/appRoutes';
import { useCancelTransaction } from '../../hooks/useCancelTransaction';
import { useCreateTransaction } from '../../hooks/useCreateTransaction';
import { useTrackingViewMode } from '../../hooks/useTrackingViewMode';
import type { ApiImportTransaction, ImportTransaction } from '../../types';
import { mapImportTransaction } from '../../utils/mappers';
import { CancelTransactionModal } from '../modals/CancelTransactionModal';
import { EncodeModal } from '../modals/EncodeModal';
import { RemarkViewerModal } from '../modals/RemarkViewerModal';
import { TransactionListPage } from '../pages/TransactionListPage';
import type { VesselListFilters } from '../vessel-groups/VesselListToolbar';
import { VesselListToolbar } from '../vessel-groups/VesselListToolbar';
import { VesselGroupedImportList } from '../vessel-groups/VesselGroupedImportList';
import type { CreateImportPayload } from '../../types';

const CANCELLABLE_IMPORT_STATUSES = new Set(['Pending', 'Vessel Arrived', 'Processing', 'In Progress']);
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

export const ImportList = () => {
    const [viewMode, setViewMode] = useTrackingViewMode();
    const [filters, setFilters] = useState<VesselListFilters>(DEFAULT_FILTERS);
    const [isEncodeOpen, setIsEncodeOpen] = useState(false);
    const [cancelTarget, setCancelTarget] = useState<{ id: number; ref: string } | null>(null);
    const [remarkTarget, setRemarkTarget] = useState<ImportTransaction | null>(null);

    const createMutation = useCreateTransaction('import');
    const cancelMutation = useCancelTransaction('import');

    const handleFiltersChange = (partial: Partial<VesselListFilters>) => {
        setFilters((prev) => ({ ...prev, ...partial }));
    };

    if (viewMode === 'flat') {
        return (
            <>
                <div className="w-full space-y-6 pb-8">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Import Transactions
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage active import records with full transaction workflow, status updates, and remarks control.
                        </p>
                    </div>

                    <VesselListToolbar
                        type="import"
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        onEncode={() => setIsEncodeOpen(true)}
                        encodeLabel="Encode Import"
                    />

                    <TransactionListPage<ImportTransaction>
                        type="import"
                        filters={filters}
                        gridTemplateColumns="80px 1.3fr 1.1fr 1.2fr 1.2fr 110px 1.2fr 1.3fr 80px"
                        minGridWidth="1100px"
                        mapResponseData={(data) => (data as ApiImportTransaction[]).map(mapImportTransaction)}
                        renderHeaders={() => (
                                <>
                                    <span className="text-center">Selectivity</span>
                                    <span className="text-left">Customs Ref</span>
                                    <span className="text-left">BL No.</span>
                                    <span className="text-left">Vessel</span>
                                    <span className="text-left">Location</span>
                                    <span className="text-left">Status</span>
                                    <span className="text-left">Arrival</span>
                                    <span className="text-left">Importer</span>
                                    <span className="text-end">Actions</span>
                                </>
                            )}
                            renderRow={(row, _, navigate, onCancel) => (
                                <>
                                    <div className="flex justify-center items-center">
                                        <span
                                            className="size-2 rounded-full shrink-0 shadow-xs"
                                            style={{ backgroundColor: row.color }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                        <span className="font-mono text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate" title={row.ref}>
                                            {row.ref}
                                        </span>
                                        {row.open_remarks_count > 0 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setRemarkTarget(row);
                                                }}
                                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 text-destructive bg-destructive/10 border border-destructive/30"
                                                title={`${row.open_remarks_count} open remark(s)`}
                                            >
                                                <Flag className="size-2.5" />
                                                {row.open_remarks_count}
                                            </button>
                                        )}
                                    </div>
                                    <span className="font-mono text-xs text-muted-foreground truncate text-left" title={row.bl || ''}>
                                        {row.bl || '—'}
                                    </span>
                                    <span className="text-xs text-foreground font-medium truncate text-left" title={toTitleCase(row.vesselName)}>
                                        {toTitleCase(row.vesselName)}
                                    </span>
                                    <span className="text-xs text-muted-foreground truncate text-left" title={row.locationOfGoods || ''}>
                                        {row.locationOfGoods || '—'}
                                    </span>
                                    <div className="flex justify-start shrink-0">
                                        <StatusBadge status={row.status} />
                                    </div>
                                    <span className="text-xs text-muted-foreground tabular-nums truncate text-left" title={row.date || ''}>
                                        {row.date || '—'}
                                    </span>
                                    <span className="text-xs text-foreground font-medium truncate text-left" title={toTitleCase(row.importer)}>
                                        {toTitleCase(row.importer)}
                                    </span>
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`${appRoutes.trackingDetail.replace(':referenceId', encodeURIComponent(row.ref))}`);
                                            }}
                                            title="View Details"
                                        >
                                            <Eye className="size-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            disabled={!CANCELLABLE_IMPORT_STATUSES.has(row.status)}
                                            className={`size-7 cursor-pointer ${CANCELLABLE_IMPORT_STATUSES.has(row.status) ? 'text-muted-foreground hover:text-destructive' : 'opacity-30 cursor-not-allowed'}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (CANCELLABLE_IMPORT_STATUSES.has(row.status)) {
                                                    onCancel(row.id, row.ref);
                                                }
                                            }}
                                            title={CANCELLABLE_IMPORT_STATUSES.has(row.status) ? 'Cancel Transaction' : 'Cannot cancel'}
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
                    type="import"
                    onSave={async (data) => {
                        await createMutation.mutateAsync(data as CreateImportPayload);
                    }}
                />

                {remarkTarget && (
                    <RemarkViewerModal
                        isOpen
                        onClose={() => setRemarkTarget(null)}
                        transactionType="import"
                        transactionId={remarkTarget.id}
                        transactionLabel={`Import — ${remarkTarget.ref}`}
                    />
                )}
            </>
        );
    }

    // Grouped view (default)
    return (
        <>
            <div className="w-full space-y-6 pb-8">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Import Transactions
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage each import transaction with full status, document, and remarks control at the record level.
                    </p>
                </div>

                <VesselListToolbar
                    type="import"
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onEncode={() => setIsEncodeOpen(true)}
                    encodeLabel="Encode Import"
                />

                <VesselGroupedImportList
                    filters={filters}
                    onCancel={(id, ref) => setCancelTarget({ id, ref })}
                />
            </div>

            <EncodeModal
                isOpen={isEncodeOpen}
                onClose={() => setIsEncodeOpen(false)}
                type="import"
                onSave={async (data) => {
                    await createMutation.mutateAsync(data as CreateImportPayload);
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

