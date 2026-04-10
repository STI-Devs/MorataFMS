import { useState } from 'react';
import { Icon } from '../../../components/Icon';
import { StatusBadge } from '../../../components/StatusBadge';
import { useAuth } from '../../auth';
import type { ApiExportTransaction, ExportTransaction } from '../types';
import { mapExportTransaction } from '../utils/mappers';
import { RemarkViewerModal } from './RemarkViewerModal';
import { TransactionListPage } from './TransactionListPage';

export const ExportList = () => {
    const { user } = useAuth();
    const [remarkTarget, setRemarkTarget] = useState<ExportTransaction | null>(null);

    return (
        <>
            <TransactionListPage<ExportTransaction>
                type="export"
                title="Export Transactions"
                subtitle="Track and manage all export shipments"
                encodeButtonLabel="Encode Export"
                hideEncode={user?.role === 'accounting' || user?.role === 'processor'}
                gridTemplateColumns="1.5fr 1.2fr 1.5fr 1.2fr 110px 1.5fr 60px"
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
                        <div className="flex items-center justify-start gap-1.5 min-w-0 pr-2">
                            <p className="text-sm font-bold text-text-primary truncate" title={row.shipper}>{row.shipper}</p>
                            {row.open_remarks_count > 0 && (
                                <button
                                    onClick={e => { e.stopPropagation(); setRemarkTarget(row); }}
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0"
                                    style={{ color: '#ff453a', backgroundColor: 'rgba(255,69,58,0.12)' }}
                                    title={`${row.open_remarks_count} open remark(s)`}
                                >
                                    <Icon name="flag" className="w-3 h-3" />
                                    {row.open_remarks_count}
                                </button>
                            )}
                        </div>
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
                                onClick={e => { e.stopPropagation(); navigate(`/tracking/${row.ref}`); }}
                                title="View Details"
                            >
                                <Icon name="eye" className="w-4 h-4" />
                            </button>
                            <button
                                className={`p-1.5 rounded-md transition-colors ${
                                    row.status === 'Processing' || row.status === 'In Transit'
                                        ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer'
                                        : 'text-text-muted/30 cursor-not-allowed'
                                }`}
                                onClick={e => {
                                    e.stopPropagation();
                                    if (row.status === 'Processing' || row.status === 'In Transit') {
                                        onCancel(row.id, row.ref);
                                    }
                                }}
                                disabled={row.status !== 'Processing' && row.status !== 'In Transit'}
                                title={row.status === 'Processing' || row.status === 'In Transit' ? 'Cancel Transaction' : 'Cannot cancel'}
                            >
                                <Icon name="x" className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                )}
            />

            {remarkTarget && (
                <RemarkViewerModal
                    isOpen={!!remarkTarget}
                    onClose={() => setRemarkTarget(null)}
                    transactionType="export"
                    transactionId={remarkTarget.id}
                    transactionLabel={`Export — ${remarkTarget.ref}`}
                />
            )}
        </>
    );
};
