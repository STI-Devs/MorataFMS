import type { ViewMode } from '../utils/archive.utils';

export const ViewToggle = ({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) => (
    <div className="flex items-center gap-0.5 bg-surface-secondary border border-border rounded-lg p-0.5">
        {(['folder', 'document'] as ViewMode[]).map(m => (
            <button key={m} onClick={() => onChange(m)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${mode === m ? 'bg-surface text-text-primary shadow-sm border border-border' : 'text-text-muted hover:text-text-secondary hover:bg-hover'}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {m === 'folder'
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    }
                </svg>
                {m === 'folder' ? 'Folder' : 'Document'} View
            </button>
        ))}
    </div>
);
