import { useState, useEffect } from 'react';
import { transactionApi } from '../api/transactionApi';
import type { OversightTransaction } from '../types/transaction.types';

interface StatusOverrideModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: OversightTransaction | null;
    onSuccess: (transactionId: number, type: 'import' | 'export', newStatus: string) => void;
}

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending', dot: '#ff9f0a' },
    { value: 'in_progress', label: 'In Progress', dot: '#64d2ff' },
    { value: 'completed', label: 'Completed', dot: '#30d158' },
    { value: 'cancelled', label: 'Cancelled', dot: '#ff453a' },
];

export const StatusOverrideModal = ({ isOpen, onClose, transaction, onSuccess }: StatusOverrideModalProps) => {
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
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update status.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !transaction) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <div
                className="w-full max-w-md rounded-lg p-6 shadow-xl bg-surface border border-border"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-5">
                    <div>
                        <h2 className="text-lg font-bold mb-0.5 text-text-primary">Override Status</h2>
                        <p className="text-sm text-text-secondary">
                            {transaction.type === 'import' ? transaction.reference_no || transaction.bl_no : transaction.bl_no} • {transaction.client || 'Unknown Client'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg transition-colors hover:bg-hover text-text-muted hover:text-text-primary"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Current Status */}
                <div className="mb-4 p-3 rounded-lg bg-surface-tint border border-border-tint">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-text-muted">Current Status</p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold capitalize text-text-primary">
                        {(() => {
                            const opt = STATUS_OPTIONS.find(s => s.value === transaction.status);
                            return opt ? <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: opt.dot }} /> : null;
                        })()}
                        {transaction.status.replace('_', ' ')}
                    </span>
                </div>

                {/* Status Options */}
                <div className="mb-5">
                    <label className="block text-sm font-semibold mb-2.5 text-text-primary">New Status</label>
                    <div className="grid grid-cols-2 gap-2">
                        {STATUS_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setSelectedStatus(opt.value)}
                                className={`px-3 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all flex items-center gap-2 ${selectedStatus === opt.value
                                        ? 'border-text-primary bg-surface-elevated'
                                        : 'border-border hover:border-border-strong bg-surface-tint'
                                    } text-text-primary`}
                            >
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: opt.dot }} />
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(255,69,58,0.1)', color: '#ff453a' }}>
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-semibold border border-border text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors bg-surface-tint"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || selectedStatus === transaction.status}
                        className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#0a84ff', color: '#fff' }}
                    >
                        {isLoading ? 'Saving...' : 'Apply'}
                    </button>
                </div>
            </div>
        </div>
    );
};
