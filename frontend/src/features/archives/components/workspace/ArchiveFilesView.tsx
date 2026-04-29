import type { ArchiveDocument } from '../../../documents/types/document.types';
import type { DrillState } from '../../utils/archive.utils';
import { ArchiveDocumentRow } from '../documents/ArchiveDocumentRow';
import { EmptyState } from '../ui/EmptyState';
import { ArchiveRecordOverview } from './ArchiveRecordOverview';

type FilesDrill = Extract<DrillState, { level: 'files' }>;

type Props = {
    drill: FilesDrill;
    userId?: number;
    canDeleteDocument: (doc: ArchiveDocument, userId?: number) => boolean;
    canReplaceDocument: (doc: ArchiveDocument, userId?: number) => boolean;
    onEditRecord: (doc: ArchiveDocument) => void;
    onDeleteDoc: (docId: number) => void;
    onReplaceDoc: (doc: ArchiveDocument) => void;
    onAddDoc: (blNo: string, type: ArchiveDocument['type'], docs: ArchiveDocument[]) => void;
};

export const ArchiveFilesView = ({
    drill,
    userId,
    canDeleteDocument,
    canReplaceDocument,
    onEditRecord,
    onDeleteDoc,
    onReplaceDoc,
    onAddDoc,
}: Props) => {
    const fileDocs = drill.year.documents.filter((doc: ArchiveDocument) =>
        doc.type === drill.type && doc.month === drill.month && (doc.bl_no || '(no BL)') === drill.bl,
    );

    if (fileDocs.length === 0) {
        return <EmptyState icon="file-text" title="No files in this folder" />;
    }

    return (
        <div>
            <ArchiveRecordOverview docs={fileDocs} canEdit onEdit={onEditRecord} />
            <div
                className="grid items-center gap-3 border-b border-border bg-surface px-4 py-2 sticky top-0 z-10"
                style={{ gridTemplateColumns: '28px minmax(0,1fr) minmax(180px,260px) 92px' }}
            >
                <span />
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">File</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Stage</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted text-right">Actions</span>
            </div>
            {fileDocs.map((doc: ArchiveDocument) => (
                <ArchiveDocumentRow
                    key={doc.id}
                    doc={doc}
                    canDelete={canDeleteDocument(doc, userId)}
                    onDelete={onDeleteDoc}
                    canReplace={canReplaceDocument(doc, userId)}
                    onReplace={onReplaceDoc}
                />
            ))}
            <button
                onClick={() => onAddDoc(drill.bl, drill.type, fileDocs)}
                className="group flex w-full items-center justify-center gap-2.5 border-t-2 border-dashed border-border px-4 py-4 text-sm font-bold text-text-muted transition-all hover:border-blue-400/50 hover:bg-blue-500/5 hover:text-blue-500"
            >
                <svg className="h-4 w-4 transition-colors group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Add document to this BL
            </button>
        </div>
    );
};
