import { useState } from 'react';
import { Icon } from '../../../components/Icon';


interface CancelTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    transactionRef: string;
    isLoading?: boolean;
}


const CANCEL_REASONS = [
    'Duplicate entry',
    'Wrong information entered',
    'Customer/client request',
    'Transaction no longer needed',
    'Other',
];


export function CancelTransactionModal({
    isOpen,
    onClose,
    onConfirm,
    transactionRef,
    isLoading = false,
}: CancelTransactionModalProps) {
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');

    if (!isOpen) return null;

    const finalReason = selectedReason === 'Other' ? customReason : selectedReason;
    const canSubmit = finalReason.trim().length > 0 && !isLoading;

    const handleSubmit = () => {
        if (canSubmit) {
            onConfirm(finalReason.trim());
            setSelectedReason('');
            setCustomReason('');
        }
    };

    const handleClose = () => {
        setSelectedReason('');
        setCustomReason('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-backdrop-in">
            <div className="bg-surface rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-border animate-modal-in">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                            <Icon name="alert-circle" className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary">Cancel Transaction</h3>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1.5 hover:bg-hover rounded-lg transition-colors text-text-muted hover:text-text-primary"
                    >
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-4">
                    <p className="text-sm text-text-secondary">
                        You are about to cancel transaction{' '}
                        <span className="font-bold text-text-primary">{transactionRef}</span>.
                        This will mark it as cancelled but keep it in the records.
                    </p>

                    {/* Reason selector */}
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                            Reason for cancellation <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            {CANCEL_REASONS.map(reason => (
                                <label
                                    key={reason}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedReason === reason
                                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                            : 'border-border hover:border-border-strong'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="cancelReason"
                                        value={reason}
                                        checked={selectedReason === reason}
                                        onChange={e => setSelectedReason(e.target.value)}
                                        className="text-orange-500 focus:ring-orange-500"
                                    />
                                    <span className="text-sm text-text-primary">{reason}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Custom reason textarea */}
                    {selectedReason === 'Other' && (
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                                Please specify
                            </label>
                            <textarea
                                value={customReason}
                                onChange={e => setCustomReason(e.target.value)}
                                placeholder="Enter your reason…"
                                maxLength={500}
                                rows={3}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-border-strong bg-input-bg text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 outline-none resize-none transition-all"
                            />
                            <p className="text-xs text-text-muted mt-1 text-right">{customReason.length}/500</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-surface-secondary">
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-semibold text-text-secondary bg-surface border border-border-strong rounded-lg hover:bg-hover transition-colors disabled:opacity-50"
                    >
                        Keep Active
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors flex items-center gap-2 ${canSubmit
                                ? 'bg-orange-600 hover:bg-orange-700'
                                : 'bg-surface-secondary text-text-muted cursor-not-allowed border border-border'
                            }`}
                    >
                        {isLoading && (
                            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        )}
                        {isLoading ? 'Cancelling…' : 'Cancel Transaction'}
                    </button>
                </div>
            </div>
        </div>
    );
}
