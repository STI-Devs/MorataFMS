import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
} from './ui/alert-dialog';

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
    // Ref mirrors isProcessing synchronously so Radix's composed close-on-click
    // (which fires before React flushes the state update) cannot dismiss the
    // dialog while onConfirm is still pending.
    const isProcessingRef = React.useRef(false);

    React.useEffect(() => {
        if (!isOpen) {
            setIsProcessing(false);
            isProcessingRef.current = false;
        }
    }, [isOpen]);

    const iconWrapperClass = icon === 'success' ? 'bg-emerald-500/10' : 'bg-red-500/10';
    const iconClass = icon === 'success' ? 'text-emerald-500' : 'text-red-500';

    const handleConfirm = async () => {
        isProcessingRef.current = true;
        setIsProcessing(true);
        try {
            await onConfirm();
            onClose();
        } finally {
            isProcessingRef.current = false;
            setIsProcessing(false);
        }
    };

    return (
        <AlertDialog
            open={isOpen}
            onOpenChange={(nextOpen) => {
                if (!nextOpen && !isProcessingRef.current) onClose();
            }}
        >
            <AlertDialogContent
                className="z-[200] w-full max-w-sm p-0 gap-0 border-0 bg-transparent shadow-none sm:max-w-sm"
                overlayClassName="bg-black/40 backdrop-blur-sm z-[200] animate-backdrop-in"
            >
                <div className="p-6 text-center bg-surface rounded-2xl border border-border shadow-2xl animate-modal-in">
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
                    <AlertDialogTitle className="text-xl font-bold text-text-primary mb-2 transition-colors">{title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm text-text-secondary mb-8 transition-colors">{message}</AlertDialogDescription>
                    <div className="flex gap-3">
                        {!hideCancel && (
                            <AlertDialogCancel
                                disabled={isProcessing}
                                className="flex-1 px-4 py-2.5 text-text-secondary text-sm font-bold rounded-xl transition-all disabled:opacity-60 cursor-pointer"
                            >
                                {cancelText}
                            </AlertDialogCancel>
                        )}
                        <AlertDialogAction
                            disabled={isProcessing}
                            onClick={handleConfirm}
                            onSelect={(e) => e.preventDefault()}
                            className={`${hideCancel ? 'w-full' : 'flex-1'} px-4 py-2.5 text-white text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-60 ${confirmButtonClass} cursor-pointer`}
                        >
                            {isProcessing ? 'Processing...' : confirmText}
                        </AlertDialogAction>
                    </div>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
};
