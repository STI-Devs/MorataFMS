import { Icon } from '../../../components/Icon';
import { StatusBadge } from '../../../components/StatusBadge';
import type { ExportTransaction } from '../types';
import { mapExportTransaction } from '../utils/mappers';
import { TransactionListPage } from './TransactionListPage';

export const ExportList = () => (
    <TransactionListPage<ExportTransaction>
        type="export"
        title="Export Transactions"
        subtitle="Track and manage all export shipments"
        encodeButtonLabel="Encode Export"
        gridTemplateColumns="1.2fr 1.2fr 1.2fr 1.2fr 1fr 1.2fr 80px"
        mapResponseData={data => data.map(mapExportTransaction)}
        renderHeaders={() => (
            <>
                <span className="text-xs text-text-secondary uppercase tracking-wider text-center">Shipper</span>
                <span className="text-xs text-text-secondary uppercase tracking-wider text-center">Bill of Lading</span>
                <span className="text-xs text-text-secondary uppercase tracking-wider text-center">Vessel</span>
                <span className="text-xs text-text-secondary uppercase tracking-wider text-center">Departure Date</span>
                <span className="text-xs text-text-secondary uppercase tracking-wider text-center">Status</span>
                <span className="text-xs text-text-secondary uppercase tracking-wider text-center">Destination</span>
                <span className="text-xs text-text-secondary uppercase tracking-wider text-center">Actions</span>
            </>
        )}
        renderRow={(row, _, navigate, onCancel) => (
            <>
                <p className="text-sm text-text-primary font-bold truncate text-center">{row.shipper}</p>
                <p className="text-sm text-text-secondary font-bold truncate text-center">{row.bl}</p>
                <p className="text-sm text-text-secondary font-bold truncate text-center">{row.vessel}</p>
                <p className="text-sm text-text-secondary font-bold truncate text-center">{row.departureDate}</p>
                <div className="flex justify-center">
                    <StatusBadge status={row.status} />
                </div>
                <p className="text-sm text-text-secondary font-bold truncate text-center">{row.portOfDestination}</p>
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
                            row.status === 'Processing' || row.status === 'In Transit'
                                ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 cursor-pointer'
                                : 'text-text-muted cursor-not-allowed'
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
);
