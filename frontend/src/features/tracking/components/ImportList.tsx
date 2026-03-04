import { Icon } from '../../../components/Icon';
import { StatusBadge } from '../../../components/StatusBadge';
import type { ImportTransaction } from '../types';
import { mapImportTransaction } from '../utils/mappers';
import { TransactionListPage } from './TransactionListPage';

export const ImportList = () => (
    <TransactionListPage<ImportTransaction>
        type="import"
        title="Import Transactions"
        subtitle="Track and manage all import shipments"
        encodeButtonLabel="Encode Import"
        gridTemplateColumns="50px 1.2fr 1.2fr 1fr 1.5fr 1fr 80px"
        mapResponseData={data => data.map(mapImportTransaction)}
        renderHeaders={() => (
            <>
                <span className="text-xs text-text-secondary uppercase tracking-wider text-center">BLSC</span>
                <span className="text-xs text-text-secondary uppercase tracking-wider text-center">Customs Ref No.</span>
                <span className="text-xs text-text-secondary uppercase tracking-wider text-center">Bill of Lading</span>
                <span className="text-xs text-text-secondary uppercase tracking-wider text-center">Status</span>
                <span className="text-xs text-text-secondary uppercase tracking-wider text-center">Importer</span>
                <span className="text-xs text-text-secondary uppercase tracking-wider text-center">Arrival Date</span>
                <span className="text-xs text-text-secondary uppercase tracking-wider text-center">Actions</span>
            </>
        )}
        renderRow={(row, _, navigate, onCancel) => (
            <>
                <div className="flex justify-center">
                    <span className={`w-2.5 h-2.5 rounded-full ${row.color}`} />
                </div>
                <p className="text-sm text-text-primary font-bold truncate text-center">{row.ref}</p>
                <p className="text-sm text-text-secondary font-bold truncate text-center">{row.bl}</p>
                <div className="flex justify-center">
                    <StatusBadge status={row.status} />
                </div>
                <p className="text-sm text-text-secondary font-bold truncate text-center">{row.importer}</p>
                <p className="text-sm text-text-secondary font-bold truncate text-center">{row.date}</p>
                <div className="flex justify-center gap-1.5">
                    <button
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                        onClick={e => { e.stopPropagation(); navigate(`/tracking/${row.ref}`); }}
                        title="Edit"
                    >
                        <Icon name="edit" className="w-4 h-4" />
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
);
