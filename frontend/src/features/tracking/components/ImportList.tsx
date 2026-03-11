import { useState } from 'react';
import { Icon } from '../../../components/Icon';
import { StatusBadge } from '../../../components/StatusBadge';
import type { ApiImportTransaction, ImportTransaction } from '../types';
import { mapImportTransaction } from '../utils/mappers';
import { RemarkViewerModal } from './RemarkViewerModal';
import { TransactionListPage } from './TransactionListPage';

export const ImportList = () => {
    const [remarkTarget, setRemarkTarget] = useState<ImportTransaction | null>(null);

    return (
        <>
            <TransactionListPage<ImportTransaction>
                type="import"
                title="Import Transactions"
                subtitle="Track and manage all import shipments"
                encodeButtonLabel="Encode Import"
                gridTemplateColumns="50px 1.2fr 1.2fr 1fr 1.5fr 1fr 80px"
                mapResponseData={data => (data as ApiImportTransaction[]).map(mapImportTransaction)}
                renderHeaders={() => (
                    <>
                        <span className="text-xs text-text-secondary uppercase tracking-wider text-center">BLSC</span>
                        <span className="text-xs text-text-secondary uppercase tracking-wider text-left pl-2">Customs Ref No.</span>
                        <span className="text-xs text-text-secondary uppercase tracking-wider text-left">Bill of Lading</span>
                        <span className="text-xs text-text-secondary uppercase tracking-wider text-center">Status</span>
                        <span className="text-xs text-text-secondary uppercase tracking-wider text-left">Importer</span>
                        <span className="text-xs text-text-secondary uppercase tracking-wider text-center">Arrival Date</span>
                        <span className="text-xs text-text-secondary uppercase tracking-wider text-center">Actions</span>
                    </>
                )}
                renderRow={(row, _, navigate, onCancel) => (
                    <>
                        <div className="flex justify-center">
                            <span className={`w-2.5 h-2.5 rounded-full ${row.color}`} />
                        </div>
                        <div className="flex items-center justify-start gap-1.5 min-w-0 pl-2">
                            <p className="text-sm text-text-primary font-bold truncate">{row.ref}</p>
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
                        <p className="text-sm text-text-secondary font-bold truncate text-left">{row.bl}</p>
                        <div className="flex justify-center">
                            <StatusBadge status={row.status} />
                        </div>
                        <p className="text-sm text-text-secondary font-bold truncate text-left">{row.importer}</p>
                        <p className="text-sm text-text-secondary font-bold truncate text-center">{row.date}</p>
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
                                    row.status === 'Pending' || row.status === 'In Transit'
                                        ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 cursor-pointer'
                                        : 'text-text-muted cursor-not-allowed'
                                }`}
                                onClick={e => {
                                    e.stopPropagation();
                                    if (row.status === 'Pending' || row.status === 'In Transit') {
                                        onCancel(row.id, row.ref);
                                    }
                                }}
                                disabled={row.status !== 'Pending' && row.status !== 'In Transit'}
                                title={row.status === 'Pending' || row.status === 'In Transit' ? 'Cancel Transaction' : 'Cannot cancel'}
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
