import React from 'react';
import { Icon } from '../../../../components/Icon';
import type { StageUpload } from '../../types/document.types';

interface StageUploadRowProps {
    stageKey: string;
    label: string;
    upload: StageUpload;
    onChange: (next: StageUpload) => void;
}

const formatSize = (b: number): string => {
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
};

export const StageUploadRow: React.FC<StageUploadRowProps> = ({ stageKey, label, upload, onChange }) => {
    const inputId = `stage-file-${stageKey}`;
    const hasFile = upload.file !== null;

    const handleFile = (file: File) => onChange({ file });

    return (
        <div className={`rounded-xl border-2 transition-all ${hasFile
            ? 'border-amber-500/50 bg-amber-50/30 dark:bg-amber-900/5'
            : 'border-border-strong bg-input-bg'
        }`}>
            {/* Stage label */}
            <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
                <div
                    className={`w-2 h-2 rounded-full shrink-0 ${hasFile ? '' : 'bg-border-strong'}`}
                    style={hasFile ? { backgroundColor: '#ff9f0a' } : {}}
                />
                <span className="text-sm font-bold text-text-primary flex-1">{label}</span>
                {hasFile && (
                    <button
                        type="button"
                        onClick={() => onChange({ file: null })}
                        className="text-text-muted hover:text-red-400 transition-colors"
                        title="Remove file"
                    >
                        <Icon name="x" className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Upload area */}
            <div className="px-4 pb-4">
                {hasFile ? (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-amber-400/40 bg-amber-50/40 dark:bg-amber-900/10">
                        <div
                            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                            style={{ backgroundColor: 'rgba(255,159,10,0.15)' }}
                        >
                            <Icon name="file-text" className="w-4 h-4" stroke="#ff9f0a" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-text-primary truncate">{upload.file!.name}</p>
                            <p className="text-[10px] text-text-muted">{formatSize(upload.file!.size)}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => document.getElementById(inputId)?.click()}
                            className="text-[10px] font-bold text-amber-500 hover:text-amber-400 transition-colors shrink-0"
                        >
                            Change
                        </button>
                        <input
                            id={inputId}
                            type="file"
                            className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                        />
                    </div>
                ) : (
                    <label
                        htmlFor={inputId}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-amber-400/50 hover:bg-hover transition-all"
                    >
                        <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 bg-surface-secondary">
                            <svg className="w-4 h-4 text-text-muted opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <span className="text-xs text-text-muted font-semibold">Click to attach a file</span>
                        <input
                            id={inputId}
                            type="file"
                            className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                        />
                    </label>
                )}
            </div>
        </div>
    );
};
