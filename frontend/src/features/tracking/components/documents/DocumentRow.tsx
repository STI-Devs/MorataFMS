import { Icon } from '../../../../components/Icon';
import type { ApiDocument } from '../../types';

const getExtFromFilename = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    return ext;
};

const extStyle = (ext: string) => {
    if (ext === 'pdf') return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    if (ext === 'doc' || ext === 'docx') return { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
    if (ext === 'xls' || ext === 'xlsx') return { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') return { color: '#f97316', bg: 'rgba(249,115,22,0.1)' };
    return { color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
};

const FileIcon = ({ filename }: { filename: string }) => {
    const ext = getExtFromFilename(filename);
    const c = extStyle(ext);
    return (
        <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: c.bg }}>
            <svg className="w-4 h-4" fill="none" stroke={c.color} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        </div>
    );
};

interface Props {
    doc: ApiDocument;
    onDownload: (doc: ApiDocument) => void;
    onDelete: (doc: ApiDocument) => void;
}

export const DocumentRow = ({ doc, onDownload, onDelete }: Props) => {
    const uploadDate = doc.created_at
        ? new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';

    return (
        <div
            className="grid items-center gap-4 py-3 px-2 border-b border-border/50 hover:bg-hover transition-colors"
            style={{ gridTemplateColumns: '32px 2fr 1.2fr 1fr 80px 80px' }}
        >
            <FileIcon filename={doc.filename} />

            <div className="min-w-0">
                <p className="text-sm font-bold text-text-primary truncate">{doc.filename}</p>
                <p className="text-[11px] text-text-muted mt-0.5 capitalize">{doc.type.replace(/_/g, ' ')}</p>
            </div>

            <span className="text-xs text-text-muted">{uploadDate}</span>

            <div className="flex items-center gap-2">
                {doc.uploaded_by && (
                    <>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 bg-slate-700">
                            {doc.uploaded_by.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-xs text-text-secondary truncate">{doc.uploaded_by.name}</span>
                    </>
                )}
            </div>

            <span className="text-xs text-text-muted text-right">{doc.formatted_size}</span>

            <div className="flex items-center justify-end gap-1">
                <button
                    className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                    title="Download"
                    onClick={(e) => { e.stopPropagation(); onDownload(doc); }}
                >
                    <Icon name="download" className="w-3.5 h-3.5" />
                </button>
                <button
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="Delete"
                    onClick={(e) => { e.stopPropagation(); onDelete(doc); }}
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
