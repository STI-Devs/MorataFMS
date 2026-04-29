import { Icon } from '../../../../components/Icon';
import type { OversightTransaction } from '../../types/transaction.types';

interface Props {
    transaction: OversightTransaction;
    onCancel: () => void;
    onConfirm: () => void;
}

export const DeleteCancelledTransactionModal = ({ transaction, onCancel, onConfirm }: Props) => {
    const label = transaction.reference_no || transaction.bl_no || `#${transaction.id}`;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={onCancel}
        >
            <div
                className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-5"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(255,69,58,0.15)' }}>
                        <Icon name="trash" className="w-5 h-5" style={{ color: '#ff453a' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text-primary">Delete Cancelled Transaction</p>
                        <p className="text-xs text-text-muted mt-1 leading-relaxed">
                            You are about to permanently delete the cancelled{' '}
                            <span className="font-semibold capitalize">{transaction.type}</span>{' '}transaction{' '}
                            <span className="font-semibold text-text-primary">{label}</span>.
                            This action cannot be undone.
                        </p>
                    </div>
                </div>

                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-semibold rounded-lg border border-border text-text-secondary hover:bg-hover transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors"
                        style={{ backgroundColor: '#ff453a' }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};
