import { Plus } from 'lucide-react';
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
            <div className="max-md:overflow-x-auto">
                <div className="min-w-[26rem]">
                    <div
                        className="grid items-center gap-3 border-b border-border/80 bg-muted/40 px-5 py-2.5 sticky top-0 z-10"
                        style={{ gridTemplateColumns: '28px minmax(0,1fr) minmax(180px,260px) 92px' }}
                    >
                        <span />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">File</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Stage</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</span>
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
                </div>
            </div>
            <button
                type="button"
                onClick={() => onAddDoc(drill.bl, drill.type, fileDocs)}
                className="group flex w-full items-center justify-center gap-2 border-t border-dashed border-border/80 py-3.5 text-xs font-semibold text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary cursor-pointer"
            >
                <Plus className="h-4 w-4" />
                Add document to this BL
            </button>
        </div>
    );
};

