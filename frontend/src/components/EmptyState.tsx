interface EmptyStateProps {
    label: string;
    message?: string;
}

/**
 * Minimal empty state shown inside data panels when no records are found.
 */
export function EmptyState({ label, message }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-text-muted">
            <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-semibold">{message ?? `No ${label} found`}</p>
        </div>
    );
}
