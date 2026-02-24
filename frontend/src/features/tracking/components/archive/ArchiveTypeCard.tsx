import React from 'react';
import type { TransactionType } from '../types/document.types';

interface ArchiveTypeCardProps {
    type: TransactionType;
    isActive: boolean;
    onClick: () => void;
}

export const ArchiveTypeCard: React.FC<ArchiveTypeCardProps> = ({ type, isActive, onClick }) => {
    const isImport = type === 'import';
    const color = isImport ? '#30d158' : '#0a84ff';
    const label = isImport ? 'Import' : 'Export';
    const desc  = isImport ? 'Incoming goods from overseas' : 'Outgoing goods to destination';

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex-1 flex items-center gap-4 px-5 py-4 rounded-xl border-2 transition-all text-left ${isActive
                ? 'border-current shadow-sm'
                : 'border-border-strong bg-input-bg hover:border-border'
            }`}
            style={isActive ? { borderColor: color, backgroundColor: `${color}0d` } : {}}
        >
            <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${color}20` }}
            >
                <svg className="w-5 h-5" fill="none" stroke={color} viewBox="0 0 24 24">
                    {isImport
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8" />
                    }
                </svg>
            </div>
            <div>
                <p className={`text-sm font-black ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}>{label}</p>
                <p className="text-xs text-text-muted mt-0.5">{desc}</p>
            </div>
            {isActive && (
                <div
                    className="ml-auto w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: color }}
                >
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
        </button>
    );
};
