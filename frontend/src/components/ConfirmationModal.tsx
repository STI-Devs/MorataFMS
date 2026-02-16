import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    confirmButtonClass?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    confirmButtonClass = 'bg-red-600 hover:bg-red-700',
}) => {
    const { theme } = useTheme();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200]">
            <div className={`rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden mx-4 animate-in fade-in zoom-in duration-200 transition-colors ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}>
                <div className="p-6 text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${theme === 'dark' ? 'bg-red-500/10' : 'bg-red-50'
                        }`}>
                        <svg className={`w-8 h-8 transition-colors ${theme === 'dark' ? 'text-red-400' : 'text-red-500'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className={`text-xl font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{title}</h3>
                    <p className={`text-sm mb-8 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>{message}</p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${theme === 'dark'
                                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 px-4 py-2.5 text-white text-sm font-bold rounded-xl transition-all shadow-sm ${confirmButtonClass}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
