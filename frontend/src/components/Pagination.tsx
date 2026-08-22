interface PaginationProps {
    currentPage: number;
    totalPages: number;
    perPage: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    perPageOptions?: number[];
    compact?: boolean;
}

export const Pagination = ({
    currentPage,
    totalPages,
    perPage,
    onPageChange,
    onPerPageChange,
    perPageOptions = [10, 25, 50],
    compact = false,
}: PaginationProps) => {
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else if (currentPage <= 3) {
            for (let i = 1; i <= 4; i++) pages.push(i);
            pages.push('...');
            pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
            pages.push(1);
            pages.push('...');
            for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            pages.push('...');
            pages.push(currentPage - 1);
            pages.push(currentPage);
            pages.push(currentPage + 1);
            pages.push('...');
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div
            className={`flex items-center justify-between transition-colors duration-300 ${
                compact
                    ? 'flex-col gap-3 px-0 pt-0 sm:flex-row'
                    : 'mt-6 border-t border-border px-2 pt-6'
            }`}
        >
            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground transition-colors">Show</span>
                <select
                    value={perPage}
                    onChange={(e) => onPerPageChange(Number(e.target.value))}
                    className="cursor-pointer rounded-md border border-border bg-card px-2 py-1 text-xs font-semibold text-foreground outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 shadow-2xs"
                >
                    {perPageOptions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <span className="text-xs font-semibold text-muted-foreground transition-colors">of {totalPages} pages</span>
            </div>
            <div className="flex items-center gap-1">
                <button
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                        <button
                            key={index}
                            onClick={() => typeof page === 'number' && onPageChange(page)}
                            disabled={typeof page !== 'number'}
                            className={`flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-xs font-semibold transition-colors cursor-pointer ${
                                page === currentPage
                                    ? 'bg-primary text-primary-foreground shadow-2xs'
                                    : typeof page === 'number'
                                        ? 'border border-border bg-card text-foreground hover:bg-muted'
                                        : 'cursor-default text-muted-foreground'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
                <button
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    aria-label="Next page"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
