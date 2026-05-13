import { useEffect, useRef } from 'react';
import { Icon } from '../../../../components/Icon';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    isPending?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const DeleteConfirmModal = ({
    isOpen,
    title,
    description,
    confirmLabel = 'Delete',
    isPending = false,
    onConfirm,
    onCancel,
}: DeleteConfirmModalProps) => {
    const cancelRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        cancelRef.current?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onCancel();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-description"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
            <div
                className="absolute inset-0 bg-neutral-950/55 backdrop-blur-[2px]"
                onClick={onCancel}
                aria-hidden="true"
            />

            <div className="relative w-full max-w-lg overflow-hidden rounded-[1.5rem] border border-border bg-surface-elevated shadow-[0_24px_80px_rgb(0,0,0,0.22)] dark:shadow-[0_24px_80px_rgb(0,0,0,0.55)]">
                <div className="p-6 sm:p-7">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isPending}
                        aria-label="Close delete confirmation"
                        className="absolute right-4 top-5 rounded-xl p-2 text-text-muted transition-colors hover:bg-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-text-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Icon name="x" className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <div className="flex items-start gap-4 pr-8">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500 shadow-inner">
                            <Icon name="trash" className="h-5 w-5" aria-hidden="true" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-500">
                                Permanent deletion
                            </p>
                            <h2
                                id="delete-modal-title"
                                className="text-lg font-semibold leading-6 tracking-tight text-text-primary"
                            >
                                {title}
                            </h2>
                            <p
                                id="delete-modal-description"
                                className="mt-2 text-sm leading-6 text-text-secondary"
                            >
                                {description}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-red-500/15 bg-red-500/[0.07] p-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                                <Icon name="alert-circle" className="h-4 w-4" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-text-primary">
                                    This action cannot be undone.
                                </p>
                                <p className="mt-1 text-xs leading-5 text-text-secondary">
                                    The file will be removed from storage and will no longer be available in this workspace.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            ref={cancelRef}
                            type="button"
                            onClick={onCancel}
                            disabled={isPending}
                            className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-surface px-5 text-sm font-semibold text-text-secondary shadow-sm transition-all hover:bg-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-text-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isPending}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgb(220,38,38,0.22)] transition-all hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/35 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
                        >
                            {isPending ? (
                                <>
                                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Icon name="trash" className="h-4 w-4" aria-hidden="true" />
                                    {confirmLabel}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
