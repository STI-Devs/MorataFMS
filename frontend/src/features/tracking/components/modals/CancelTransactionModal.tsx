import { useState } from 'react';
import { Icon } from '../../../../components/Icon';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                            <Icon name="alert-circle" className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Cancel Transaction
                        </h3>
                    </div>
                    <button onClick={handleClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <Icon name="x" className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        You are about to cancel transaction <span className="font-semibold text-gray-900 dark:text-white">{transactionRef}</span>.
                        This will mark it as cancelled but keep it in the records.
                    </p>

                    {/* Reason selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Reason for cancellation <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            {CANCEL_REASONS.map((reason) => (
                                <label
                                    key={reason}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                        ${selectedReason === reason
                                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-600'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="cancelReason"
                                        value={reason}
                                        checked={selectedReason === reason}
                                        onChange={(e) => setSelectedReason(e.target.value)}
                                        className="text-orange-500 focus:ring-orange-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{reason}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Custom reason text area */}
                    {selectedReason === 'Other' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Please specify
                            </label>
                            <textarea
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder="Enter your reason..."
                                maxLength={500}
                                rows={3}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                    focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                            />
                            <p className="text-xs text-gray-400 mt-1">{customReason.length}/500</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                            bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                            rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                        Keep Active
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors
                            ${canSubmit
                                ? 'bg-orange-600 hover:bg-orange-700'
                                : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                            }`}
                    >
                        {isLoading ? 'Cancelling...' : 'Cancel Transaction'}
                    </button>
                </div>
            </div>
        </div>
    );
}
