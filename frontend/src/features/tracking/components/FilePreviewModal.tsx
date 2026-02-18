import React from 'react';
import { Icon } from '../../../components/Icon';

interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: File | string | null;
    fileName?: string;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ isOpen, onClose, file, fileName }) => {
    if (!isOpen) return null;

    const isFileObject = file instanceof File;
    const fileUrl = isFileObject ? URL.createObjectURL(file) : null;
    const displayFileName = fileName || (isFileObject ? file.name : (typeof file === 'string' ? file : 'Unknown File'));

    const isImage = displayFileName.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
    const isPdf = displayFileName.match(/\.(pdf)$/i) != null;

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 bg-surface border border-border"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                            <Icon name="file-text" className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary truncate">
                            {displayFileName}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-hover transition-all shrink-0"
                    >
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-surface-secondary min-h-[300px]">
                    {fileUrl ? (
                        isImage ? (
                            <img src={fileUrl} alt={displayFileName} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
                        ) : isPdf ? (
                            <iframe src={fileUrl} className="w-full h-[600px] border-none rounded-lg" title="PDF Preview" />
                        ) : (
                            <div className="text-center p-8">
                                <div className="w-16 h-16 mx-auto mb-4 p-3 rounded-2xl bg-surface border border-border">
                                    <Icon name="file-text" className="w-full h-full text-text-muted" />
                                </div>
                                <p className="text-text-secondary font-bold mb-2">Preview not available</p>
                                <p className="font-mono text-sm text-text-muted">{displayFileName}</p>
                            </div>
                        )
                    ) : (
                        <div className="text-center p-8">
                            <div className="w-16 h-16 mx-auto mb-4 p-3 rounded-2xl bg-surface border border-border">
                                <Icon name="file-text" className="w-full h-full text-text-muted" />
                            </div>
                            <p className="text-lg font-bold text-text-primary mb-1">File Preview</p>
                            <p className="text-sm text-text-muted mb-2">Preview placeholder for:</p>
                            <p className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">{displayFileName}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
