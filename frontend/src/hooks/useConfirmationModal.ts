import { useCallback, useState } from 'react';

interface ConfirmationOptions {
    title: string;
    message: string;
    confirmText?: string;
    confirmButtonClass?: string;
    onConfirm: () => void;
}

export const useConfirmationModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmationOptions>({
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const openModal = useCallback((opts: ConfirmationOptions) => {
        setOptions(opts);
        setIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
    }, []);

    const handleConfirm = useCallback(() => {
        options.onConfirm();
        closeModal();
    }, [options, closeModal]);

    return {
        isOpen,
        closeModal,
        openModal,
        modalProps: {
            isOpen,
            onClose: closeModal,
            onConfirm: handleConfirm,
            title: options.title,
            message: options.message,
            confirmText: options.confirmText,
            confirmButtonClass: options.confirmButtonClass,
        }
    };
};
