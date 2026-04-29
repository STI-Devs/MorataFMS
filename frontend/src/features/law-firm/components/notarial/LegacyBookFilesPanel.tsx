import type { InputHTMLAttributes } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    useCreateLegacyBookFiles,
    useDeleteLegacyBookFile,
    useLegacyBookFiles,
} from '../../hooks/useLegalWorkspace';
import type { LegalBook, LegalLegacyBookFile } from '../../types/legalRecords.types';

type LegacyBookFilesPanelProps = {
    book: LegalBook;
    canManage: boolean;
};

const folderUploadProps = {
    webkitdirectory: 'true',
    directory: 'true',
} as unknown as InputHTMLAttributes<HTMLInputElement>;

const getErrorMessage = (error: unknown): string => {
    const responseData = (error as {
        response?: {
            data?: {
                message?: string;
                errors?: Record<string, string[]>;
            };
        };
    })?.response?.data;

    const firstValidationMessage = responseData?.errors
        ? Object.values(responseData.errors).flat()[0]
        : null;

    return firstValidationMessage ?? responseData?.message ?? 'Unable to save the legacy scanned files.';
};

export const LegacyBookFilesPanel = ({ book, canManage }: LegacyBookFilesPanelProps) => {
    const [files, setFiles] = useState<File[]>([]);

    const legacyFilesQuery = useLegacyBookFiles(book.id);
    const createLegacyFiles = useCreateLegacyBookFiles();
    const deleteLegacyFile = useDeleteLegacyBookFile();

    const legacyFiles = legacyFilesQuery.data ?? [];

    const handleUpload = async () => {
        if (! files.length) {
            return;
        }

        try {
            await createLegacyFiles.mutateAsync({
                bookId: book.id,
                data: { files },
            });

            toast.success('Legacy scanned files uploaded.');
            setFiles([]);
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    const handleDelete = async (file: LegalLegacyBookFile) => {
        if (! window.confirm(`Delete "${file.filename}" from Book ${book.book_number}?`)) {
            return;
        }

        try {
            await deleteLegacyFile.mutateAsync({
                fileId: file.id,
                bookId: book.id,
            });
            toast.success('Legacy scanned file deleted.');
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    return (
        <div className="rounded-2xl border border-border bg-surface-secondary/20 px-4 py-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Archive Files</p>
                    <p className="mt-1 text-xs text-text-muted">Keep the scanned PDFs and images grouped under the matching book.</p>
                </div>
                <p className="text-xs text-text-muted">{legacyFiles.length} file{legacyFiles.length === 1 ? '' : 's'}</p>
            </div>

            {legacyFiles.length > 0 ? (
                <div className="mt-3 space-y-2">
                    {legacyFiles.map((file) => (
                        <div
                            key={file.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-2.5"
                        >
                            <div>
                                <p className="text-sm font-semibold text-text-primary">{file.filename}</p>
                                <p className="mt-0.5 text-xs text-text-muted">
                                    {file.formatted_size}
                                    {file.uploaded_by ? ` • by ${file.uploaded_by.name}` : ''}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={file.download_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-secondary/30"
                                >
                                    Download
                                </a>
                                {canManage ? (
                                    <button
                                        type="button"
                                        onClick={() => void handleDelete(file)}
                                        disabled={deleteLegacyFile.isPending}
                                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                                    >
                                        Delete
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="mt-3 text-sm text-text-muted">No archive files uploaded yet for this book.</p>
            )}

            {canManage ? (
                <div className="mt-4 rounded-xl border border-dashed border-border bg-surface px-3 py-3">
                    <label className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Book Folder / Multi-file Upload</span>
                        <input
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
                            className="block w-full text-xs text-text-primary file:mr-3 file:rounded-lg file:border-0 file:bg-surface-secondary file:px-2.5 file:py-1.5 file:text-xs file:font-semibold"
                        />
                    </label>

                    <label className="mt-3 block space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Folder Upload (Chromium)</span>
                        <input
                            type="file"
                            multiple
                            {...folderUploadProps}
                            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
                            className="block w-full text-xs text-text-primary file:mr-3 file:rounded-lg file:border-0 file:bg-surface-secondary file:px-2.5 file:py-1.5 file:text-xs file:font-semibold"
                        />
                    </label>

                    <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-text-muted">
                            {files.length > 0
                                ? `${files.length} file${files.length === 1 ? '' : 's'} selected for Book ${book.book_number}.`
                                : 'Select one or more files to add under this book.'}
                        </p>
                        <button
                            type="button"
                            onClick={() => void handleUpload()}
                            disabled={! files.length || createLegacyFiles.isPending}
                            className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Upload Files
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
