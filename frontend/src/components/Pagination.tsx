interface PaginationProps {
    currentPage: number;
    totalPages: number;
    perPage: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    compact?: boolean;
}

export const Pagination = ({
    currentPage,
    totalPages,
    perPage,
    onPageChange,
    onPerPageChange,
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
                <span className="text-sm font-bold text-text-primary transition-colors">Show</span>
                <select
                    value={perPage}
                    onChange={(e) => onPerPageChange(Number(e.target.value))}
                    className="cursor-pointer rounded-lg border border-border-strong bg-surface-secondary p-1 px-2 text-xs font-bold text-text-primary outline-none transition-colors focus:border-blue-500 focus:ring-blue-500"
                >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                </select>
                <span className="text-sm font-bold text-text-primary transition-colors">of {totalPages} pages</span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    className="rounded-lg p-2 text-text-muted transition-colors hover:bg-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                        <button
                            key={index}
                            onClick={() => typeof page === 'number' && onPageChange(page)}
                            disabled={typeof page !== 'number'}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                                page === currentPage
                                    ? 'bg-[#1a2332] text-white shadow-sm'
                                    : typeof page === 'number'
                                        ? 'text-text-primary hover:bg-hover'
                                        : 'cursor-default text-text-primary'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
                <button
                    className="rounded-lg p-2 text-text-muted transition-colors hover:bg-hover hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
