import { TransactionListPage } from './TransactionListPage';
import { mapExportTransaction } from '../utils/mappers';
import { StatusBadge } from '../../../components/StatusBadge';
import { Icon } from '../../../components/Icon';
import type { ExportTransaction } from '../types';

export const ExportList = () => {
    return (
        <TransactionListPage<ExportTransaction>
            type="export"
            title="Export Transactions"
            subtitle="Track and manage all export shipments"
            encodeButtonLabel="Encode Export"
            gridTemplateColumns="1.2fr 1.2fr 1.2fr 1.2fr 1fr 1.2fr 80px"
            mapResponseData={(data) => data.map(mapExportTransaction)}
            renderHeaders={() => (
                <>
                    <span className="text-xs text-text-secondary uppercase tracking-wider">Shipper</span>
                    <span className="text-xs text-text-secondary uppercase tracking-wider">Bill of Lading</span>
                    <span className="text-xs text-text-secondary uppercase tracking-wider">Vessel</span>
                    <span className="text-xs text-text-secondary uppercase tracking-wider">Departure Date</span>
                    <span className="text-xs text-text-secondary uppercase tracking-wider">Status</span>
                    <span className="text-xs text-text-secondary uppercase tracking-wider">Destination</span>
                    <span className="text-xs text-text-secondary uppercase tracking-wider text-right">Actions</span>
                </>
            )}
            renderRow={(row, _, navigate, onCancel) => (
                <>
                    <p className="text-sm text-text-primary font-bold truncate pr-2">{row.shipper}</p>
                    <p className="text-sm text-text-secondary font-bold truncate pr-2">{row.bl}</p>
                    <p className="text-sm text-text-secondary font-bold truncate pr-2">{row.vessel}</p>
                    <p className="text-sm text-text-secondary font-bold truncate pr-2">{row.departureDate}</p>
                    <span className="inline-flex"><StatusBadge status={row.status} /></span>
                    <p className="text-sm text-text-secondary font-bold truncate pr-2">{row.portOfDestination}</p>
                    <div className="flex justify-end gap-1.5">
                        <button
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                            onClick={(e) => { e.stopPropagation(); navigate(`/tracking/${row.ref}`); }}
                            title="Edit"
                        >
                            <Icon name="edit" className="w-4 h-4" />
                        </button>
                        <button
                            className={`p-1.5 rounded-md transition-colors ${row.status === 'Processing' || row.status === 'In Transit'
                                ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 cursor-pointer'
                                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                }`}
                            onClick={(e) => {
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
    );
};
