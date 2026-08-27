import { useEffect, useState } from 'react';
import { getApiError } from '../../../../lib/apiErrors';
import { Button } from '../../../../components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../../../components/ui/dialog';
import { transactionApi } from '../../api/transactionApi';
import type { OversightTransaction } from '../../types/transaction.types';

interface StatusOverrideModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: OversightTransaction | null;
    onSuccess: (transactionId: number, type: 'import' | 'export', newStatus: string) => void;
}

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending', dot: 'var(--warning)' },
    { value: 'in_progress', label: 'In Progress', dot: 'var(--sky)' },
    { value: 'completed', label: 'Completed', dot: 'var(--success)' },
    { value: 'cancelled', label: 'Cancelled', dot: 'var(--danger)' },
];

function normalizeStatus(status: string): string {
    return status.trim().toLowerCase().replace(/\s+/g, '_');
}

export const StatusOverrideModal = ({ isOpen, onClose, transaction, onSuccess }: StatusOverrideModalProps) => {
    const [selectedStatus, setSelectedStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const currentStatus = transaction ? normalizeStatus(transaction.status) : '';
    const isRestoreMode = currentStatus === 'cancelled';
    const availableOptions = isRestoreMode
        ? STATUS_OPTIONS.filter((option) => option.value !== 'cancelled')
        : STATUS_OPTIONS;

    useEffect(() => {
        if (isOpen && transaction) {
            setSelectedStatus(isRestoreMode ? 'pending' : currentStatus);
            setError('');
        }
    }, [currentStatus, isOpen, isRestoreMode, transaction]);

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

    const currentOption = STATUS_OPTIONS.find((statusOption) => statusOption.value === currentStatus);

    return (
        <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="max-w-md sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isRestoreMode ? 'Restore Transaction' : 'Override Status'}</DialogTitle>
                    <DialogDescription>
                        {transaction.type === 'import' ? transaction.reference_no || transaction.bl_no : transaction.bl_no} · {transaction.client || 'Unknown Client'}
                    </DialogDescription>
                </DialogHeader>

                {/* Current Status */}
                <div className="mb-4 p-3 rounded-lg bg-surface-tint border border-border-tint">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-text-muted">Current Status</p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold capitalize text-text-primary">
                        {currentOption ? <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: currentOption.dot }} /> : null}
                        {(currentOption?.label ?? transaction.status).replace('_', ' ')}
                    </span>
                </div>

                {/* Status Options */}
                <div className="mb-5">
                    <label className="block text-sm font-semibold mb-2.5 text-text-primary">
                        {isRestoreMode ? 'Restore To' : 'New Status'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {availableOptions.map((opt) => (
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
                    <div className="mb-4 p-3 rounded-lg text-sm bg-danger/10 text-danger">
                        {error}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || selectedStatus === currentStatus}
                    >
                        {isLoading ? 'Saving...' : isRestoreMode ? 'Restore' : 'Apply'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
