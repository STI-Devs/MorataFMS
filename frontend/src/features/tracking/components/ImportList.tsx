import { useState } from 'react';
import { Icon } from '../../../components/Icon';
import { StatusBadge } from '../../../components/StatusBadge';
import type { ApiImportTransaction, ImportTransaction } from '../types';
import { mapImportTransaction } from '../utils/mappers';
import { RemarkViewerModal } from './RemarkViewerModal';
import { TransactionListPage } from './TransactionListPage';

const CANCELLABLE_IMPORT_STATUSES = new Set(['Pending', 'Vessel Arrived', 'Processing', 'In Progress']);

export const ImportList = () => {
    const [remarkTarget, setRemarkTarget] = useState<ImportTransaction | null>(null);

    return (
        <>
            <TransactionListPage<ImportTransaction>
                type="import"
                title="Import Transactions"
                subtitle="Track and manage all import shipments"
                encodeButtonLabel="Encode Import"
                gridTemplateColumns="90px 1.2fr 1fr 1fr 1.3fr 120px 1.4fr 1fr 60px"
                mapResponseData={data => (data as ApiImportTransaction[]).map(mapImportTransaction)}
                renderHeaders={() => (
                    <>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] text-center">Selectivity</span>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] text-left">Customs Ref No.</span>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] text-left">Bill of Lading</span>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] text-left">Vessel Name</span>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] text-left">Location of Goods</span>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] text-center">Status</span>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] text-center">Arrival Date</span>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] text-left pl-4">Importer</span>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.08em] text-center"></span>
                    </>
                )}
                renderRow={(row, _, navigate, onCancel) => (
                    <>
                        <div className="flex justify-center items-center">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color, boxShadow: `0 0 4px ${row.color}40` }} />
                        </div>
                        <div className="flex items-center justify-start gap-1.5 min-w-0 pr-2">
                            <p className="text-sm font-bold text-text-primary truncate" title={row.ref}>{row.ref}</p>
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
                        <p className="text-sm text-text-secondary font-bold truncate text-left" title={row.vesselName || ''}>{row.vesselName || '—'}</p>
                        <p className="text-sm text-text-secondary font-bold truncate text-left" title={row.locationOfGoods || ''}>{row.locationOfGoods || '—'}</p>
                        <div className="flex justify-center flex-shrink-0">
                            <StatusBadge status={row.status} />
                        </div>
                        <p className="text-sm text-text-muted font-semibold truncate text-center" title={row.date || ''}>{row.date || '—'}</p>
                        <p className="text-sm text-text-secondary font-bold truncate text-left pl-4" title={row.importer}>{row.importer}</p>
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
                                    CANCELLABLE_IMPORT_STATUSES.has(row.status)
                                        ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer'
                                        : 'text-text-muted/30 cursor-not-allowed'
                                }`}
                                onClick={e => {
                                    e.stopPropagation();
                                    if (CANCELLABLE_IMPORT_STATUSES.has(row.status)) {
                                        onCancel(row.id, row.ref);
                                    }
                                }}
                                disabled={!CANCELLABLE_IMPORT_STATUSES.has(row.status)}
                                title={CANCELLABLE_IMPORT_STATUSES.has(row.status) ? 'Cancel Transaction' : 'Cannot cancel'}
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
                    transactionType="import"
                    transactionId={remarkTarget.id}
                    transactionLabel={`Import — ${remarkTarget.ref}`}
                />
            )}
        </>
    );
};
