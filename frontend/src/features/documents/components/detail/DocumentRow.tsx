import { Download, Eye } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { formatDate, STAGE_COLORS, type TransactionDoc } from '../../utils/documentsDetail.utils';
import { FileTypeIcon } from './FileTypeIcon';

type Props = {
    doc: TransactionDoc;
    isAlternate?: boolean;
    onDownload: (doc: TransactionDoc) => void;
    onPreview: (doc: TransactionDoc) => void;
};

export const DocumentRow = ({ doc, onDownload, onPreview }: Props) => {
    const stageColor = STAGE_COLORS[doc.stageKey] ?? {
        color: 'var(--muted-foreground)',
        bg: 'color-mix(in srgb, var(--muted-foreground) 10%, transparent)',
    };

    return (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: Icon + File Details */}
            <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="mt-0.5 shrink-0">
                    <FileTypeIcon type={doc.fileType} />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => onPreview(doc)}
                            className="font-medium text-xs text-primary hover:underline truncate max-w-[220px] sm:max-w-xs text-left cursor-pointer"
                            title={doc.name}
                        >
                            {doc.name}
                        </button>
                        <span
                            className="inline-flex shrink-0 items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            style={{ color: stageColor.color, backgroundColor: stageColor.bg }}
                            title={doc.stageLabel}
                        >
                            {doc.stageLabel}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-muted-foreground border rounded px-1 py-0.2">
                            {doc.size}
                        </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                        Uploaded by <strong className="font-medium text-foreground">{doc.uploader.name}</strong> · {formatDate(doc.date)}
                    </p>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs font-semibold cursor-pointer"
                    onClick={() => onPreview(doc)}
                    title="Preview file"
                >
                    <Eye className="mr-1 size-3" />
                    Preview
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs font-semibold cursor-pointer"
                    onClick={() => onDownload(doc)}
                    title="Download file"
                >
                    <Download className="mr-1 size-3" />
                    Download
                </Button>
            </div>
        </div>
    );
};
