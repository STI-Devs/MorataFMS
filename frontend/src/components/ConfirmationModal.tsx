import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: string;
    message: string;
    confirmText?: string;
    confirmButtonClass?: string;
    cancelText?: string;
    hideCancel?: boolean;
    icon?: 'warning' | 'success';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    confirmButtonClass = 'bg-red-600 hover:bg-red-700',
    cancelText = 'Cancel',
    hideCancel = false,
    icon = 'warning',
}) => {
    const [isProcessing, setIsProcessing] = React.useState(false);

    React.useEffect(() => {
        if (!isOpen) {
            setIsProcessing(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const iconWrapperClass = icon === 'success' ? 'bg-emerald-50' : 'bg-red-50';
    const iconClass = icon === 'success' ? 'text-emerald-500' : 'text-red-500';

    const handleConfirm = async () => {
        try {
            setIsProcessing(true);
            await onConfirm();
            onClose();
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] animate-backdrop-in">
            <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden mx-4 border border-border transition-all animate-modal-in">
                <div className="p-6 text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${iconWrapperClass}`}>
                        {icon === 'success' ? (
                            <svg className={`w-8 h-8 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className={`w-8 h-8 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-2 transition-colors">{title}</h3>
                    <p className="text-sm text-text-secondary mb-8 transition-colors">{message}</p>
                    <div className="flex gap-3">
                        {!hideCancel && (
                            <button
                                onClick={onClose}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-2.5 bg-surface-secondary hover:bg-hover text-text-secondary text-sm font-bold rounded-xl transition-all disabled:opacity-60"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={handleConfirm}
                            disabled={isProcessing}
                            className={`${hideCancel ? 'w-full' : 'flex-1'} px-4 py-2.5 text-white text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-60 ${confirmButtonClass}`}
                        >
                            {isProcessing ? 'Processing...' : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
