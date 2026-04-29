import { STAGE_COLORS, formatDate, type TransactionDoc } from '../../utils/documentsDetail.utils';
import { FileTypeIcon } from './FileTypeIcon';

type Props = {
    doc: TransactionDoc;
    isAlternate: boolean;
    onDownload: (doc: TransactionDoc) => void;
    onPreview: (doc: TransactionDoc) => void;
};

export const DocumentRow = ({ doc, isAlternate, onDownload, onPreview }: Props) => {
    const stageColor = STAGE_COLORS[doc.stageKey] ?? { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' };

    return (
        <div
            className={`grid gap-4 px-6 py-3.5 items-center border-b border-border/50 transition-colors hover:bg-hover ${isAlternate ? 'bg-surface-secondary/40' : ''}`}
            style={{ gridTemplateColumns: '40px 2.5fr 1fr 1.4fr 80px 90px' }}
        >
            <FileTypeIcon type={doc.fileType} />
            <div className="min-w-0 flex items-center gap-2">
                <p className="min-w-0 truncate text-sm font-semibold text-text-primary">{doc.name}</p>
                <span
                    className="inline-flex shrink-0 items-center px-2 py-0.5 rounded-md text-[10px] font-semibold"
                    style={{ color: stageColor.color, backgroundColor: stageColor.bg }}
                    title={doc.stageLabel}
                >
                    {doc.stageLabel}
                </span>
            </div>
            <p className="text-sm font-semibold text-text-secondary">{formatDate(doc.date)}</p>
            <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${doc.uploader.avatarColor}`}>
                    {doc.uploader.initials}
                </div>
                <span className="text-sm font-semibold text-text-secondary truncate">{doc.uploader.name}</span>
            </div>
            <p className="text-sm font-semibold text-text-secondary">{doc.size}</p>
            <div className="flex items-center justify-center gap-1">
                <button
                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                    title="Download"
                    onClick={() => onDownload(doc)}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                </button>
                <button
                    className="p-1.5 text-text-secondary hover:bg-hover rounded-md transition-colors"
                    title="Preview"
                    onClick={() => onPreview(doc)}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
