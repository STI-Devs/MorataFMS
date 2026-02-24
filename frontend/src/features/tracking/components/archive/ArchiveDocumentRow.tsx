import type { ArchiveDocument, FileExt } from '../../types/document.types';

const extStyle = (ext: FileExt) => {
    if (ext === 'pdf')  return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    if (ext === 'docx') return { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
    return                     { color: '#f97316', bg: 'rgba(249,115,22,0.1)' };
};

const TYPE_BADGE = {
    import: { label: 'Import', color: '#30d158', bg: 'rgba(48,209,88,0.13)' },
    export: { label: 'Export', color: '#0a84ff', bg: 'rgba(10,132,255,0.13)' },
};

interface Props {
    doc: ArchiveDocument;
    onDelete: (id: number) => void;
}

export const ArchiveDocumentRow = ({ doc, onDelete }: Props) => {
    const c = extStyle(doc.ext);
    const t = TYPE_BADGE[doc.type];

    return (
        <div
            className="grid items-center gap-4 py-3 px-2 border-b border-border/50 hover:bg-hover transition-colors"
            style={{ gridTemplateColumns: '32px 2fr 1.2fr 1fr 1fr 1fr 80px 80px' }}
        >
            {/* File icon */}
            <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: c.bg }}>
                <svg className="w-4 h-4" fill="none" stroke={c.color} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            </div>

            {/* Name + doc type */}
            <div className="min-w-0">
                <p className="text-sm font-bold text-text-primary truncate">{doc.name}</p>
                <p className="text-[11px] text-text-muted mt-0.5">{doc.docType}</p>
            </div>

            {/* Import / Export badge */}
            <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold w-fit"
                style={{ color: t.color, backgroundColor: t.bg }}
            >
                <span className="w-1 h-1 rounded-full" style={{ backgroundColor: t.color }} />
                {t.label}
            </span>

            {/* Client */}
            <p className="text-xs text-text-secondary truncate">{doc.client}</p>

            {/* Ref no */}
            <p className="text-xs text-text-muted">{doc.refNo || <span className="italic opacity-50">No ref</span>}</p>

            {/* File date */}
            <p className="text-xs text-text-muted">{doc.fileDate}</p>

            {/* Size */}
            <span className="text-xs text-text-muted text-right">{doc.size}</span>

            {/* Actions */}
            <div className="flex items-center justify-end gap-1">
                <button
                    className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                    title="Download"
                    onClick={(e) => e.stopPropagation()}
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </button>
                <button
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="Delete"
                    onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
