import { useState } from 'react';
import { useCancelTransaction } from '../../hooks/useCancelTransaction';
import { useCreateTransaction } from '../../hooks/useCreateTransaction';
import type { ApiExportTransaction, CreateExportPayload, ExportTransaction } from '../../types';
import { mapExportTransaction } from '../../utils/mappers';
import { CancelTransactionModal } from '../modals/CancelTransactionModal';
import { EncodeModal } from '../modals/EncodeModal';
import { TransactionListPage } from '../pages/TransactionListPage';
import type { VesselListFilters } from '../vessel-groups/VesselListToolbar';
import { VesselListToolbar } from '../vessel-groups/VesselListToolbar';
import { VesselGroupedExportList } from '../vessel-groups/VesselGroupedExportList';
import { StatusBadge } from '../../../../components/StatusBadge';
import { Icon } from '../../../../components/Icon';
import { appRoutes } from '../../../../lib/appRoutes';
import { TrackingPageHero } from '../details/TrackingPageHero';

const CANCELLABLE_EXPORT_STATUSES = new Set(['Pending', 'In Transit', 'Departure', 'Processing', 'In Progress']);
const DEFAULT_FILTERS: VesselListFilters = {
    search: '',
    status: 'all',
    time: 'all',
};

export const ExportList = () => {
    const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');
    const [filters, setFilters] = useState<VesselListFilters>(DEFAULT_FILTERS);
    const [isEncodeOpen, setIsEncodeOpen] = useState(false);
    const [cancelTarget, setCancelTarget] = useState<{ id: number; ref: string } | null>(null);

    const createMutation = useCreateTransaction('export');
    const cancelMutation = useCancelTransaction('export');

    const handleFiltersChange = (partial: Partial<VesselListFilters>) => {
        setFilters(prev => ({ ...prev, ...partial }));
    };

    if (viewMode === 'flat') {
        return (
            <>
                <div className="space-y-5 p-4">
                    <TrackingPageHero
                        title="Export Transactions"
                        description="Manage active export records with a cleaner operational layout that still supports quick lookup by vessel, BL, shipper, and destination."
                    />
                    <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-surface to-surface-secondary/20 shadow-sm">
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
                            title=""
                            subtitle=""
                            encodeButtonLabel="Encode Export"
                            gridTemplateColumns="1.5fr 1.2fr 1.5fr 1.2fr 120px 1.5fr 60px"
                            mapResponseData={data => (data as ApiExportTransaction[]).map(mapExportTransaction)}
                            renderHeaders={() => (
                                <>
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] text-left">Shipper</span>
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] text-left">Bill of Lading</span>
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] text-left">Vessel</span>
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] text-center">Departure Date</span>
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] text-center">Status</span>
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] text-left">Destination</span>
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] text-center"></span>
                                </>
                            )}
                            renderRow={(row, _, navigate, onCancel) => (
                                <>
                                    <p className="text-sm font-bold text-text-primary truncate" title={row.shipper}>{row.shipper}</p>
                                    <p className="text-sm text-text-secondary font-bold truncate text-left" title={row.bl || ''}>{row.bl || '—'}</p>
                                    <p className="text-sm text-text-secondary font-bold truncate text-left" title={row.vessel || ''}>{row.vessel || '—'}</p>
                                    <p className="text-sm text-text-muted font-semibold truncate text-center" title={row.departureDate || ''}>{row.departureDate || '—'}</p>
                                    <div className="flex justify-center flex-shrink-0">
                                        <StatusBadge status={row.status} />
                                    </div>
                                    <p className="text-sm text-text-secondary font-bold truncate text-left" title={row.portOfDestination}>{row.portOfDestination}</p>
                                    <div className="flex justify-center gap-1.5">
                                        <button
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                            onClick={e => { e.stopPropagation(); navigate(appRoutes.trackingDetail.replace(':referenceId', encodeURIComponent(row.ref))); }}
                                            title="View Details"
                                        >
                                            <Icon name="eye" className="w-4 h-4" />
                                        </button>
                                        <button
                                            className={`p-1.5 rounded-md transition-colors ${CANCELLABLE_EXPORT_STATUSES.has(row.status) ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer' : 'text-text-muted/30 cursor-not-allowed'}`}
                                            onClick={e => { e.stopPropagation(); if (CANCELLABLE_EXPORT_STATUSES.has(row.status)) { onCancel(row.id, row.ref); } }}
                                            disabled={!CANCELLABLE_EXPORT_STATUSES.has(row.status)}
                                            title={CANCELLABLE_EXPORT_STATUSES.has(row.status) ? 'Cancel Transaction' : 'Cannot cancel'}
                                        >
                                            <Icon name="x" className="w-4 h-4" />
                                        </button>
                                    </div>
                                </>
                            )}
                        />
                    </div>
                </div>

                <EncodeModal
                    isOpen={isEncodeOpen}
                    onClose={() => setIsEncodeOpen(false)}
                    type="export"
                    onSave={async (data) => { await createMutation.mutateAsync(data as CreateExportPayload); }}
                />
            </>
        );
    }

    // Grouped view (default)
    return (
        <>
            <div className="space-y-5 p-4">
                <TrackingPageHero
                    title="Export Transactions"
                    description="Manage each export shipment record with transaction-level status, document, and cancellation controls."
                />
                <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-surface to-surface-secondary/20 shadow-sm">
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
            </div>

            <EncodeModal
                isOpen={isEncodeOpen}
                onClose={() => setIsEncodeOpen(false)}
                type="export"
                onSave={async (data) => { await createMutation.mutateAsync(data as CreateExportPayload); }}
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
