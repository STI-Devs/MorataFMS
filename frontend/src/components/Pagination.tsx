interface PaginationProps {
    currentPage: number;
    totalPages: number;
    perPage: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
}

export const Pagination = ({ 
    currentPage, 
    totalPages, 
    perPage, 
    onPageChange, 
    onPerPageChange 
}: PaginationProps) => {
    // Helper to generate page numbers
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5; // How many pages to show before/after ellipsis

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            // Always show first, last, and pages around current
            if (currentPage <= 3) {
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
        }
        return pages;
    };

    return (
        <div className="mt-6 flex items-center justify-between border-t border-border pt-6 px-2 transition-colors duration-300">
            <div className="flex items-center gap-2">
                <span className="text-sm text-text-primary font-bold transition-colors">Show</span>
                <select 
                    value={perPage}
                    onChange={(e) => onPerPageChange(Number(e.target.value))}
                    className="bg-surface-secondary border border-border-strong text-text-primary text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1 px-2 outline-none cursor-pointer font-bold transition-colors"
                >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                </select>
                <span className="text-sm text-text-primary font-bold transition-colors">of {totalPages} pages</span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    className="p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                        <button
                            key={index}
                            onClick={() => typeof page === 'number' && onPageChange(page)}
                            disabled={typeof page !== 'number'}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                                page === currentPage
                                    ? 'bg-[#1a2332] text-white shadow-sm'
                                    : typeof page === 'number'
                                    ? 'text-text-primary hover:bg-hover'
                                    : 'text-text-primary cursor-default'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
                <button
                    className="p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
