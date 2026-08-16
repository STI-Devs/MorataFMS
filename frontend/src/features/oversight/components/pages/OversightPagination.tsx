import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../../components/ui/select';

interface OversightPaginationProps {
    currentPage: number;
    totalPages: number;
    perPage: number;
    totalRecords: number;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
}

const PER_PAGE_OPTIONS = [50, 75, 100];

export const OversightPagination = ({
    currentPage,
    totalPages,
    perPage,
    totalRecords,
    onPageChange,
    onPerPageChange,
}: OversightPaginationProps) => {
    const isFirstPage = currentPage <= 1;
    const isLastPage = currentPage >= totalPages;

    return (
        <div className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between bg-muted/20">
            <span className="text-xs font-medium text-muted-foreground">
                Showing {totalRecords} transaction{totalRecords === 1 ? '' : 's'}
            </span>

            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Rows per page</span>
                    <Select
                        value={String(perPage)}
                        onValueChange={(value) => onPerPageChange(Number(value))}
                    >
                        <SelectTrigger className="h-8 w-[72px] text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {PER_PAGE_OPTIONS.map((option) => (
                                <SelectItem key={option} value={String(option)} className="text-xs">
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label="First page"
                        onClick={() => onPageChange(1)}
                        disabled={isFirstPage}
                        className="size-8"
                    >
                        <ChevronsLeft className="size-3.5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label="Previous page"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={isFirstPage}
                        className="size-8"
                    >
                        <ChevronLeft className="size-3.5" />
                    </Button>
                    <span className="px-2 text-xs font-medium text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label="Next page"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={isLastPage}
                        className="size-8"
                    >
                        <ChevronRight className="size-3.5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label="Last page"
                        onClick={() => onPageChange(totalPages)}
                        disabled={isLastPage}
                        className="size-8"
                    >
                        <ChevronsRight className="size-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
