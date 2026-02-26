import { useEffect, useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { getApiError } from '../../../lib/apiErrors';
import { transactionApi } from '../api/transactionApi';
import type { OversightTransaction } from '../types/transaction.types';

interface StatusOverrideModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: OversightTransaction | null;
    onSuccess: (transactionId: number, type: 'import' | 'export', newStatus: string) => void;
}

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
];

export const StatusOverrideModal = ({ isOpen, onClose, transaction, onSuccess }: StatusOverrideModalProps) => {
    const { theme } = useTheme();
    const [selectedStatus, setSelectedStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && transaction) {
            setSelectedStatus(transaction.status);
            setError('');
        }
    }, [isOpen, transaction]);

    const handleSubmit = async () => {
        if (!transaction || !selectedStatus) return;
        try {
            setIsLoading(true);
            setError('');
            let result;
            if (transaction.type === 'import') {
                result = await transactionApi.overrideImportStatus(transaction.id, selectedStatus);
            } else {
                result = await transactionApi.overrideExportStatus(transaction.id, selectedStatus);
            }
            onSuccess(transaction.id, transaction.type, result.status);
            onClose();
        } catch (err: unknown) {
            console.error('Status override failed:', err);
            setError(getApiError(err, 'override status'));
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !transaction) return null;

    const isDark = theme === 'dark';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <div
                className={`w-full max-w-md rounded-[2rem] p-8 shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Override Status
                        </h2>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {transaction.type === 'import' ? transaction.reference_no || transaction.bl_no : transaction.bl_no} • {transaction.client || 'Unknown Client'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                        <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Current Status */}
                <div className={`mb-5 p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Current Status</p>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold capitalize ${STATUS_OPTIONS.find(s => s.value === transaction.status)?.color || 'bg-gray-100 text-gray-800'}`}>
                        {transaction.status.replace('_', ' ')}
                    </span>
                </div>

                {/* Status Options */}
                <div className="mb-6">
                    <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        New Status
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {STATUS_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setSelectedStatus(opt.value)}
                                className={`px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${selectedStatus === opt.value
                                    ? isDark
                                        ? 'border-white bg-white/10'
                                        : 'border-black bg-black/5'
                                    : isDark
                                        ? 'border-gray-700 hover:border-gray-500'
                                        : 'border-gray-200 hover:border-gray-300'
                                    } ${isDark ? 'text-white' : 'text-gray-900'}`}
                            >
                                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${opt.value === 'pending' ? 'bg-gray-400' : opt.value === 'in_progress' ? 'bg-blue-500' : opt.value === 'completed' ? 'bg-green-500' : 'bg-red-500'}`} />
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className={`px-5 py-2.5 rounded-xl font-semibold border transition-colors ${isDark
                            ? 'border-gray-600 text-white hover:bg-gray-700'
                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || selectedStatus === transaction.status}
                        className="px-5 py-2.5 rounded-xl font-semibold bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Saving...' : 'Apply'}
                    </button>
                </div>
            </div>
        </div>
    );
};
