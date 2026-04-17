import { Icon } from '../Icon';

interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    /**
     * - `File`   → local file selected by user (before upload)
     * - `string` → authenticated preview URL returned by app routing
     * - `null`   → nothing to preview
     */
    file: File | string | null;
    fileName?: string;
    /** Called when the user wants to download the file instead. */
    onDownload?: () => void;
}

// File-type classification helpers
const EXT_RE = /\.([a-z0-9]+)$/i;
const getExt = (name: string) => (name.match(EXT_RE)?.[1] ?? '').toLowerCase();

const IMAGE_EXTS    = new Set(['jpeg', 'jpg', 'png', 'gif', 'webp', 'svg', 'bmp']);
const PDF_EXTS      = new Set(['pdf']);
const OFFICE_EXTS   = new Set(['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'csv']);

type PreviewType = 'image' | 'pdf' | 'office' | 'local-raw' | 'unsupported';

function classifyFile(name: string, isLocal: boolean): PreviewType {
    const ext = getExt(name);
    if (IMAGE_EXTS.has(ext))  return 'image';
    if (PDF_EXTS.has(ext))    return isLocal ? 'local-raw' : 'pdf';   // local PDF → raw blob
    if (OFFICE_EXTS.has(ext)) return isLocal ? 'unsupported' : 'office';
    return isLocal ? 'local-raw' : 'unsupported';
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
    isOpen, onClose, file, fileName, onDownload,
}) => {
    if (!isOpen) return null;

    const isLocalFile  = file instanceof File;
    // blob: URLs are created client-side and are not remotely accessible,
    // so treat them as local content.
    const isBlobUrl    = typeof file === 'string' && file.startsWith('blob:');
    const isRemoteUrl  = typeof file === 'string' && !isBlobUrl;

    // Derive a stable blob URL for local File objects
    const localBlobUrl = isLocalFile ? URL.createObjectURL(file) : null;

    const displayName  = fileName
        || (isLocalFile ? file.name : (isRemoteUrl ? fileName ?? 'Document' : 'Unknown File'));

    const previewType  = displayName ? classifyFile(displayName, isLocalFile || isBlobUrl) : 'unsupported';

    // Build the URL that the viewer will actually load
    const viewerUrl = (() => {
        if (isLocalFile && localBlobUrl) {
            // Local File object — images & PDFs render natively
            return localBlobUrl;
        }
        if (isBlobUrl) {
            // Local disk stream — same treatment as a local File; blob: URLs are
            // not remotely accessible, so treat them as local-only content.
            return file as string;
        }
        if (isRemoteUrl) {
            if (previewType === 'office') return null;
            return file as string;
        }
        return null;
    })();

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-backdrop-in"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden bg-surface border border-border animate-modal-in"
                onClick={e => e.stopPropagation()}
            >
                {/* ── Header ─────────────────────────────────────────── */}
                <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                            <Icon name="file-text" className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary truncate">{displayName}</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {onDownload && (
                            <button
                                onClick={onDownload}
                                title="Download file"
                                className="p-2 rounded-xl text-text-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                            >
                                <Icon name="download" className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-hover transition-all"
                        >
                            <Icon name="x" className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ── Content ────────────────────────────────────────── */}
                <div className="flex-1 overflow-hidden bg-surface-secondary min-h-[400px] flex items-center justify-center">
                    {previewType === 'image' && viewerUrl && (
                        <img
                            src={viewerUrl}
                            alt={displayName}
                            className="max-w-full max-h-[78vh] object-contain rounded-lg p-4"
                        />
                    )}

                    {(previewType === 'pdf' || previewType === 'local-raw') && viewerUrl && (
                        <iframe
                            src={viewerUrl}
                            className="w-full h-[78vh] border-none"
                            title="Document Preview"
                        />
                    )}

                    {previewType === 'unsupported' && (
                        <UnsupportedPreview name={displayName ?? ''} onDownload={onDownload} />
                    )}

                    {!viewerUrl && !['image', 'pdf', 'local-raw', 'office'].includes(previewType) && (
                        <UnsupportedPreview name={displayName ?? ''} onDownload={onDownload} />
                    )}
                </div>

            </div>
        </div>
    );
};

// ── Sub-component ────────────────────────────────────────────────────────────

const UnsupportedPreview: React.FC<{ name: string; onDownload?: () => void }> = ({ name, onDownload }) => (
    <div className="text-center p-10 flex flex-col items-center gap-4">
        <div className="w-16 h-16 p-3 rounded-2xl bg-surface border border-border flex items-center justify-center">
            <Icon name="file-text" className="w-full h-full text-text-muted" />
        </div>
        <div>
            <p className="text-text-secondary font-bold mb-1">Preview not available</p>
            <p className="font-mono text-sm text-text-muted">{name}</p>
        </div>
        {onDownload && (
            <button
                onClick={onDownload}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
                <Icon name="download" className="w-4 h-4" />
                Download to view
            </button>
        )}
    </div>
);
