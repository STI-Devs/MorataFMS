import { TransactionListPage } from './TransactionListPage';
import { mapImportTransaction } from '../utils/mappers';
import { StatusBadge } from '../../../components/StatusBadge';
import { Icon } from '../../../components/Icon';
import type { ImportTransaction } from '../types';

export const ImportList = () => {
    return (
        <TransactionListPage<ImportTransaction>
            type="import"
            title="Import Transactions"
            subtitle="Track and manage all import shipments"
            encodeButtonLabel="Encode Import"
            gridTemplateColumns="50px 1.2fr 1.2fr 1fr 1.5fr 1fr 80px"
            mapResponseData={(data) => data.map(mapImportTransaction)}
            renderHeaders={() => (
                <>
                    <span className="text-xs text-text-secondary uppercase tracking-wider">BLSC</span>
                    <span className="text-xs text-text-secondary uppercase tracking-wider">Customs Ref No.</span>
                    <span className="text-xs text-text-secondary uppercase tracking-wider">Bill of Lading</span>
                    <span className="text-xs text-text-secondary uppercase tracking-wider">Status</span>
                    <span className="text-xs text-text-secondary uppercase tracking-wider">Importer</span>
                    <span className="text-xs text-text-secondary uppercase tracking-wider">Arrival Date</span>
                    <span className="text-xs text-text-secondary uppercase tracking-wider text-right">Actions</span>
                </>
            )}
            renderRow={(row, _, navigate, onCancel) => (
                <>
                    <span className={`w-2.5 h-2.5 rounded-full ${row.color}`}></span>
                    <p className="text-sm text-text-primary font-bold truncate pr-2">{row.ref}</p>
                    <p className="text-sm text-text-secondary font-bold truncate pr-2">{row.bl}</p>
                    <span className="inline-flex"><StatusBadge status={row.status} /></span>
                    <p className="text-sm text-text-secondary font-bold truncate pr-2">{row.importer}</p>
                    <p className="text-sm text-text-secondary font-bold truncate pr-2">{row.date}</p>
                    <div className="flex justify-end gap-1.5">
                        <button
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                            onClick={(e) => { e.stopPropagation(); navigate(`/tracking/${row.ref}`); }}
                            title="Edit"
                        >
                            <Icon name="edit" className="w-4 h-4" />
                        </button>
                        <button
                            className={`p-1.5 rounded-md transition-colors ${row.status === 'Pending' || row.status === 'In Transit'
                                ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 cursor-pointer'
                                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                }`}
                            onClick={(e) => {
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
    );
};
