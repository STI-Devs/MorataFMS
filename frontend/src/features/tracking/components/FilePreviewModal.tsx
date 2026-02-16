import React from 'react';
import { useTheme } from '../../../context/ThemeContext';

interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: File | string | null;
    fileName?: string;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ isOpen, onClose, file, fileName }) => {
    const { theme } = useTheme();

    if (!isOpen) return null;

    const isFileObject = file instanceof File;
    const fileUrl = isFileObject ? URL.createObjectURL(file) : null;
    const displayFileName = fileName || (isFileObject ? file.name : (typeof file === 'string' ? file : 'Unknown File'));

    // Determine file type for display (very basic check)
    const isImage = displayFileName.match(/\.(jpeg|jpg|gif|png)$/i) != null;
    const isPdf = displayFileName.match(/\.(pdf)$/i) != null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={onClose}>
            <div
                className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                    <h3 className={`text-lg font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {displayFileName}
                    </h3>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-xl transition-all ${theme === 'dark'
                            ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100 dark:bg-gray-900 min-h-[300px]">
                    {fileUrl ? (
                        // Actual File Object Preview
                        isImage ? (
                            <img src={fileUrl} alt={displayFileName} className="max-w-full max-h-full object-contain" />
                        ) : isPdf ? (
                            <iframe src={fileUrl} className="w-full h-[600px] border-none" title="PDF Preview" />
                        ) : (
                            <div className="text-center">
                                <p className="text-gray-500 mb-4">Preview not available for this file type.</p>
                                <p className="font-mono text-sm">{displayFileName}</p>
                            </div>
                        )
                    ) : (
                        // Mock/String File Preview
                        <div className="text-center p-8">
                            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Preview Placeholder</p>
                            <p className="text-sm text-gray-500 mt-2">This is a mock file display for:</p>
                            <p className="font-mono text-sm font-bold mt-1 text-blue-500">{displayFileName}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
