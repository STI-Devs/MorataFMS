import { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import type { ImportTransaction, ExportTransaction } from '../types/client.types';

interface TransactionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientName: string;
    imports: ImportTransaction[];
    exports: ExportTransaction[];
}

export const TransactionHistoryModal = ({ isOpen, onClose, clientName, imports, exports }: TransactionHistoryModalProps) => {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<'imports' | 'exports'>('imports');

    if (!isOpen) return null;

    const totalTransactions = imports.length + exports.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <div
                className={`w-full max-w-4xl rounded-[2rem] p-8 max-h-[90vh] overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                            Transaction History
                        </h2>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {clientName} • {totalTransactions} total transaction{totalTransactions !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                            }`}
                    >
                        <svg className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('imports')}
                        className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'imports'
                                ? 'border-black dark:border-white text-black dark:text-white'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Imports ({imports.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('exports')}
                        className={`px-4 py-2 font-medium transition-colors border-b-2 ${activeTab === 'exports'
                                ? 'border-black dark:border-white text-black dark:text-white'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Exports ({exports.length})
                    </button>
                </div>

                {/* Transaction Lists */}
                {activeTab === 'imports' ? (
                    imports.length === 0 ? (
                        <div className="text-center py-12">
                            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                                No import transactions found
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className={theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}>
                                    <tr>
                                        <th className={`px-4 py-3 text-left text-xs font-bold uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                            Date
                                        </th>
                                        <th className={`px-4 py-3 text-left text-xs font-bold uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                            Ref No
                                        </th>
                                        <th className={`px-4 py-3 text-left text-xs font-bold uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                            BL No
                                        </th>
                                        <th className={`px-4 py-3 text-left text-xs font-bold uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                            Status
                                        </th>
                                        <th className={`px-4 py-3 text-left text-xs font-bold uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                            Assigned To
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-100'}`}>
                                    {imports.map((transaction) => (
                                        <tr key={transaction.id} className={`transition-colors ${theme === 'dark' ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'}`}>
                                            <td className={`px-4 py-3 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className={`px-4 py-3 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                {transaction.reference_no || 'N/A'}
                                            </td>
                                            <td className={`px-4 py-3 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {transaction.bl_no || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold capitalize ${transaction.status === 'completed'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                        : transaction.status === 'in_progress'
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                            : transaction.status === 'cancelled'
                                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {transaction.status}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-3 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {transaction.assigned_to || 'Unassigned'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    exports.length === 0 ? (
                        <div className="text-center py-12">
                            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                                No export transactions found
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className={theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}>
                                    <tr>
                                        <th className={`px-4 py-3 text-left text-xs font-bold uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                            BL No
                                        </th>
                                        <th className={`px-4 py-3 text-left text-xs font-bold uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                            Vessel
                                        </th>
                                        <th className={`px-4 py-3 text-left text-xs font-bold uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                            Destination
                                        </th>
                                        <th className={`px-4 py-3 text-left text-xs font-bold uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                            Status
                                        </th>
                                        <th className={`px-4 py-3 text-left text-xs font-bold uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                            Assigned To
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-100'}`}>
                                    {exports.map((transaction) => (
                                        <tr key={transaction.id} className={`transition-colors ${theme === 'dark' ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'}`}>
                                            <td className={`px-4 py-3 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                {transaction.bl_no || 'N/A'}
                                            </td>
                                            <td className={`px-4 py-3 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {transaction.vessel || 'N/A'}
                                            </td>
                                            <td className={`px-4 py-3 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {transaction.destination || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold capitalize ${transaction.status === 'completed'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                        : transaction.status === 'in_progress'
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                            : transaction.status === 'cancelled'
                                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {transaction.status}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-3 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {transaction.assigned_to || 'Unassigned'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className={`px-6 py-3 rounded-xl font-bold border transition-colors ${theme === 'dark'
                                ? 'border-gray-600 text-white hover:bg-gray-700'
                                : 'border-gray-200 text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
