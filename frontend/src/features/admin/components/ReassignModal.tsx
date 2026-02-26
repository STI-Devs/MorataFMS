import { useState, useEffect } from 'react';
import { transactionApi } from '../api/transactionApi';
import type { OversightTransaction, EncoderUser } from '../types/transaction.types';

interface ReassignModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: OversightTransaction | null;
    onSuccess: (transactionId: number, type: 'import' | 'export', assignedTo: string, assignedUserId: number) => void;
}

export const ReassignModal = ({ isOpen, onClose, transaction, onSuccess }: ReassignModalProps) => {
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <div
                className="w-full max-w-md rounded-lg p-6 shadow-xl bg-surface border border-border"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-5">
                    <div>
                        <h2 className="text-lg font-bold mb-0.5 text-text-primary">Reassign Encoder</h2>
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

                {/* Current Encoder */}
                <div className="mb-4 p-3 rounded-lg bg-surface-tint border border-border-tint">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-text-muted">Current Encoder</p>
                    <p className="text-sm font-semibold text-text-primary">
                        {transaction.assigned_to || <span className="text-text-muted italic font-normal">Unassigned</span>}
                    </p>
                </div>

                {/* Encoder Select */}
                <div className="mb-5">
                    <label className="block text-sm font-semibold mb-2 text-text-primary">Assign To</label>
                    {isFetching ? (
                        <p className="text-sm text-text-muted">Loading encoders...</p>
                    ) : (
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full px-3 py-2.5 rounded-lg border border-border bg-input-bg text-text-primary text-sm transition-colors focus:outline-none focus:border-blue-500/50"
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
                        disabled={isLoading || selectedUserId === ''}
                        className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: '#0a84ff', color: '#fff' }}
                    >
                        {isLoading ? 'Saving...' : 'Reassign'}
                    </button>
                </div>
            </div>
        </div>
    );
};
