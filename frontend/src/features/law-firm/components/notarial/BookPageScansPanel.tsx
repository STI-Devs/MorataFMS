import { useState } from 'react';
import { toast } from 'sonner';
import {
    useBookPageScans,
    useCreateBookPageScan,
    useDeleteBookPageScan,
    useUpdateBookPageScan,
} from '../../hooks/useLegalWorkspace';
import type { LegalBook, LegalPageScan } from '../../types/legalRecords.types';

type BookPageScansPanelProps = {
    book: LegalBook;
    canManage: boolean;
};

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

    return firstValidationMessage ?? responseData?.message ?? 'Unable to save the page scan.';
};

export const BookPageScansPanel = ({ book, canManage }: BookPageScansPanelProps) => {
    const [pageStart, setPageStart] = useState('');
    const [pageEnd, setPageEnd] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editPageStart, setEditPageStart] = useState('');
    const [editPageEnd, setEditPageEnd] = useState('');
    const [editFile, setEditFile] = useState<File | null>(null);

    const scansQuery = useBookPageScans(book.id);
    const createScan = useCreateBookPageScan();
    const updateScan = useUpdateBookPageScan();
    const deleteScan = useDeleteBookPageScan();

    const scans = scansQuery.data ?? [];

    const resetCreateForm = () => {
        setPageStart('');
        setPageEnd('');
        setFile(null);
    };

    const startEdit = (scan: LegalPageScan) => {
        setEditingId(scan.id);
        setEditPageStart(String(scan.page_start));
        setEditPageEnd(String(scan.page_end));
        setEditFile(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditFile(null);
    };

    const handleCreate = async () => {
        if (! file || ! pageStart || ! pageEnd) {
            return;
        }

        try {
            await createScan.mutateAsync({
                bookId: book.id,
                data: {
                    page_start: Number(pageStart),
                    page_end: Number(pageEnd),
                    file,
                },
            });
            toast.success('Page scan uploaded.');
            resetCreateForm();
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    const handleUpdate = async (scan: LegalPageScan) => {
        try {
            await updateScan.mutateAsync({
                bookId: book.id,
                scanId: scan.id,
                data: {
                    page_start: Number(editPageStart),
                    page_end: Number(editPageEnd),
                    file: editFile,
                },
            });
            toast.success('Page scan updated.');
            cancelEdit();
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    const handleDelete = async (scan: LegalPageScan) => {
        if (! window.confirm(`Delete the scan covering ${scan.page_range_label}? This removes the PDF from storage.`)) {
            return;
        }

        try {
            await deleteScan.mutateAsync({ bookId: book.id, scanId: scan.id });
            toast.success('Page scan deleted.');
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    return (
        <div className="rounded-2xl border border-border bg-surface-secondary/20 px-4 py-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Page-Indexed Scans</p>
                    <p className="mt-1 text-xs text-text-muted">Keep scanned physical pages grouped by page range.</p>
                </div>
                <p className="text-xs text-text-muted">{scans.length} range{scans.length === 1 ? '' : 's'}</p>
            </div>

            {scans.length > 0 ? (
                <div className="mt-3 space-y-2">
                    {scans.map((scan) => (
                        <div
                            key={scan.id}
                            className="rounded-xl border border-border bg-surface px-3 py-2.5"
                        >
                            {editingId === scan.id ? (
                                <div className="grid gap-2 md:grid-cols-[100px_100px_1fr_auto] md:items-end">
                                    <label className="space-y-1">
                                        <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Start</span>
                                        <input
                                            type="number"
                                            min={1}
                                            value={editPageStart}
                                            onChange={(event) => setEditPageStart(event.target.value)}
                                            className="w-full rounded-lg border border-border bg-input-bg px-2.5 py-1.5 text-sm text-text-primary"
                                        />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">End</span>
                                        <input
                                            type="number"
                                            min={1}
                                            value={editPageEnd}
                                            onChange={(event) => setEditPageEnd(event.target.value)}
                                            className="w-full rounded-lg border border-border bg-input-bg px-2.5 py-1.5 text-sm text-text-primary"
                                        />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Replace File (optional)</span>
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(event) => setEditFile(event.target.files?.[0] ?? null)}
                                            className="block w-full text-xs text-text-primary file:mr-3 file:rounded-lg file:border-0 file:bg-surface-secondary file:px-2.5 file:py-1.5 file:text-xs file:font-semibold"
                                        />
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => void handleUpdate(scan)}
                                            disabled={updateScan.isPending}
                                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                                        >
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            onClick={cancelEdit}
                                            className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-text-primary hover:bg-surface-secondary/30"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary">{scan.page_range_label}</p>
                                        <p className="mt-0.5 text-xs text-text-muted">
                                            {scan.filename} • {scan.formatted_size}
                                            {scan.uploaded_by ? ` • by ${scan.uploaded_by.name}` : ''}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={scan.download_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-secondary/30"
                                        >
                                            Download
                                        </a>
                                        {canManage ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(scan)}
                                                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-secondary/30"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleDelete(scan)}
                                                    disabled={deleteScan.isPending}
                                                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        ) : null}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="mt-3 text-sm text-text-muted">No page-indexed scans uploaded yet.</p>
            )}

            {canManage ? (
                <div className="mt-4 grid gap-2 rounded-xl border border-dashed border-border bg-surface px-3 py-3 md:grid-cols-[100px_100px_1fr_auto] md:items-end">
                    <label className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Start Page</span>
                        <input
                            type="number"
                            min={1}
                            value={pageStart}
                            onChange={(event) => setPageStart(event.target.value)}
                            placeholder="1"
                            className="w-full rounded-lg border border-border bg-input-bg px-2.5 py-1.5 text-sm text-text-primary"
                        />
                    </label>
                    <label className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">End Page</span>
                        <input
                            type="number"
                            min={1}
                            value={pageEnd}
                            onChange={(event) => setPageEnd(event.target.value)}
                            placeholder="50"
                            className="w-full rounded-lg border border-border bg-input-bg px-2.5 py-1.5 text-sm text-text-primary"
                        />
                    </label>
                    <label className="space-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Scanned PDF / Image</span>
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                            className="block w-full text-xs text-text-primary file:mr-3 file:rounded-lg file:border-0 file:bg-surface-secondary file:px-2.5 file:py-1.5 file:text-xs file:font-semibold"
                        />
                    </label>
                    <button
                        type="button"
                        onClick={() => void handleCreate()}
                        disabled={! file || ! pageStart || ! pageEnd || createScan.isPending}
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Upload Range
                    </button>
                </div>
            ) : null}
        </div>
    );
};
