import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { Icon } from '../../../components/Icon';
import { mockTrackingApi } from '../api/mockTrackingApi';
import type { ExportTransaction, ImportTransaction, LayoutContext } from '../types';
import { PageHeader } from './shared/PageHeader';

export const TrackingDetails = () => {
    const navigate = useNavigate();
    const { referenceId } = useParams();
    const { user } = useOutletContext<LayoutContext>();
    
    const [transaction, setTransaction] = useState<ImportTransaction | ExportTransaction | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (referenceId) {
                setLoading(true);
                try {
                    const data = await mockTrackingApi.getTransaction(referenceId);
                    setTransaction(data);
                } catch (error) {
                    console.error("Failed to fetch transaction", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [referenceId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="text-center py-12">
                <Icon name="alert-circle" className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">Transaction Not Found</h3>
                <p className="text-gray-500 mb-6">The transaction with reference ID {referenceId} could not be found.</p>
                <button 
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    // specific logic to determine stages based on status (Mock Logic)
    const isImport = transaction.ref.startsWith('IMP');
    
    const getStageStatus = (index: number) => {
        // Simple mock logic: 
        // Cleared = All done
        // In Transit = 3 done
        // Pending = 1 done
        // Delayed = 2 done (but red?)
        if (transaction.status === 'Cleared') return 'Completed';
        if (transaction.status === 'In Transit' && index < 3) return 'Completed';
        if (transaction.status === 'In Transit' && index === 3) return 'In Progress';
        if (transaction.status === 'Delayed' && index < 2) return 'Completed';
        if (transaction.status === 'Delayed' && index === 2) return 'In Progress'; // Or specific delayed status
        if (transaction.status === 'Pending' && index === 0) return 'In Progress';
        return 'Pending';
    };

    const importStages = [
        { title: 'Bureau of Customs', icon: 'file-text' },
        { title: 'Philippine Ports Authority', icon: 'truck' }, // approximate icon
        { title: 'Delivery Order', icon: 'file-text' },
        { title: 'Port Charges', icon: 'credit-card' }, // need credit-card icon? use file-text for now or add one
        { title: 'Releasing', icon: 'check-circle' },
        { title: 'Billing of Liquidation', icon: 'file-text' }
    ];

    const exportStages = [
        { title: 'Booking Confirmation', icon: 'file-text' },
        { title: 'Container Pick-up', icon: 'truck' },
        { title: 'Gate In', icon: 'check-circle' },
        { title: 'Customs Clearance', icon: 'file-text' },
        { title: 'Loaded on Vessel', icon: 'truck' } // need ship icon?
    ];

    const stages = isImport ? importStages : exportStages;

    return (
        <div className="flex flex-col space-y-6">
            <PageHeader 
                title={`Ref No: ${transaction.ref}`}
                breadcrumb={`Dashboard / Tracking / ${transaction.ref}`}
                user={user || null}
            />

            {/* Status Overview Card */}
            <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-1">{transaction.ref}</h2>
                        <p className="text-sm text-gray-700 font-bold">
                            Bill of Lading: <span className="text-gray-900 font-bold">{transaction.bl}</span>
                        </p>
                        {/* Show generic extra info if available */}
                        {'importer' in transaction && (
                            <p className="text-sm text-gray-700 font-bold mt-1">
                                Importer: <span className="text-gray-900 font-bold">{(transaction as ImportTransaction).importer}</span>
                            </p>
                        )}
                         {'shipper' in transaction && (
                            <p className="text-sm text-gray-700 font-bold mt-1">
                                Shipper: <span className="text-gray-900 font-bold">{(transaction as ExportTransaction).shipper}</span>
                            </p>
                        )}
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                        transaction.status === 'Cleared' || transaction.status === 'Shipped' ? 'bg-green-50 text-green-700' :
                        transaction.status === 'Delayed' ? 'bg-red-50 text-red-700' :
                        transaction.status === 'Pending' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-blue-50 text-blue-700'
                    }`}>
                        <span className={`w-2 h-2 rounded-full ${
                            transaction.status === 'Cleared' || transaction.status === 'Shipped' ? 'bg-green-500' :
                            transaction.status === 'Delayed' ? 'bg-red-500' :
                            transaction.status === 'Pending' ? 'bg-yellow-500' :
                            'bg-blue-500'
                        }`}></span>
                        {transaction.status}
                    </span>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stages.map((stage, i) => {
                    const status = getStageStatus(i);
                    const isCompleted = status === 'Completed';
                    const isInProgress = status === 'In Progress';
                    
                    return (
                        <div
                            key={i}
                            className={`bg-white rounded-[2rem] p-6 border transition-all duration-200 group cursor-default ${
                                isInProgress ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-gray-100 shadow-sm hover:border-gray-200'
                            }`}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-xl transition-colors ${
                                    isCompleted ? 'bg-green-50 text-green-600' :
                                    isInProgress ? 'bg-blue-50 text-blue-600' :
                                    'bg-gray-50 text-gray-400'
                                }`}>
                                    <Icon name={stage.icon as import('../../../components/Icon').IconName} className="w-6 h-6" />
                                </div>
                                <h3 className={`font-bold ${isInProgress ? 'text-blue-700' : 'text-gray-900'}`}>{stage.title}</h3>
                            </div>
                            <p className={`text-sm font-bold ${
                                isCompleted ? 'text-green-600' :
                                isInProgress ? 'text-blue-600' :
                                'text-gray-400'
                            }`}>
                                {status}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
