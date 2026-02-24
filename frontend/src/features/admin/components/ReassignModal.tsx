import { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { transactionApi } from '../api/transactionApi';
import type { OversightTransaction, EncoderUser } from '../types/transaction.types';

interface ReassignModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: OversightTransaction | null;
    onSuccess: (transactionId: number, type: 'import' | 'export', assignedTo: string, assignedUserId: number) => void;
}

export const ReassignModal = ({ isOpen, onClose, transaction, onSuccess }: ReassignModalProps) => {
    const { theme } = useTheme();
    const [encoders, setEncoders] = useState<EncoderUser[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedUserId(transaction?.assigned_user_id ?? '');
            setError('');
            loadEncoders();
        }
    }, [isOpen, transaction]);

    const loadEncoders = async () => {
        try {
            setIsFetching(true);
            const res = await transactionApi.getEncoders();
            setEncoders(res.data);
        } catch {
            setError('Failed to load encoders.');
        } finally {
            setIsFetching(false);
        }
    };

    const handleSubmit = async () => {
        if (!transaction || selectedUserId === '') return;
        try {
            setIsLoading(true);
            setError('');
            let result;
            if (transaction.type === 'import') {
                result = await transactionApi.reassignImport(transaction.id, Number(selectedUserId));
            } else {
                result = await transactionApi.reassignExport(transaction.id, Number(selectedUserId));
            }
            onSuccess(transaction.id, transaction.type, result.assigned_to, result.assigned_user_id);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reassign encoder.');
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
                            Reassign Encoder
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

                {/* Current Encoder */}
                <div className={`mb-5 p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Current Encoder</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {transaction.assigned_to || 'Unassigned'}
                    </p>
                </div>

                {/* Encoder Select */}
                <div className="mb-6">
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Assign To
                    </label>
                    {isFetching ? (
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading encoders...</p>
                    ) : (
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value === '' ? '' : Number(e.target.value))}
                            className={`w-full px-4 py-3 rounded-xl border transition-colors focus:outline-none focus:border-gray-400 ${isDark
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-200 text-gray-900'
                                }`}
                        >
                            <option value="">Select an encoder...</option>
                            {encoders.map((enc) => (
                                <option key={enc.id} value={enc.id}>
                                    {enc.name} ({enc.role})
                                </option>
                            ))}
                        </select>
                    )}
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
                        disabled={isLoading || selectedUserId === ''}
                        className="px-5 py-2.5 rounded-xl font-semibold bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Saving...' : 'Reassign'}
                    </button>
                </div>
            </div>
        </div>
    );
};
