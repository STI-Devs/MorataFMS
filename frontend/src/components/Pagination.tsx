interface PaginationProps {
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
}

export const Pagination = ({ currentPage = 1, totalPages = 10, onPageChange }: PaginationProps) => {
    return (
        <div className="mt-6 flex items-center justify-between border-t border-border pt-6 px-2 transition-colors duration-300">
            <div className="flex items-center gap-2">
                <span className="text-sm text-text-primary font-bold transition-colors">Show</span>
                <select className="bg-surface-secondary border border-border-strong text-text-primary text-xs rounded-lg focus:ring-blue-500 focus:border-blue-500 p-1 px-2 outline-none cursor-pointer font-bold transition-colors">
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                </select>
                <span className="text-sm text-text-primary font-bold transition-colors">of 100 pages</span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    className="p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-hover transition-colors"
                    onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex items-center gap-1">
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a2332] text-white text-sm font-bold shadow-sm transition-colors">1</button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-hover text-text-primary text-sm font-bold transition-colors">2</button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-hover text-text-primary text-sm font-bold transition-colors">3</button>
                    <span className="text-text-primary px-1 font-bold transition-colors">...</span>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-hover text-text-primary text-sm font-bold transition-colors">16</button>
                </div>
                <button
                    className="p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-hover transition-colors"
                    onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
};
