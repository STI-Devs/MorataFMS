import * as React from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type SortDirection = 'asc' | 'desc' | null;

interface DataTableColumnHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    sortKey?: string;
    currentSortKey?: string | null;
    currentSortDir?: SortDirection;
    onSort?: (key: string, direction: SortDirection) => void;
}

export function DataTableColumnHeader({
    title,
    sortKey,
    currentSortKey,
    currentSortDir,
    onSort,
    className,
}: DataTableColumnHeaderProps) {
    if (!sortKey || !onSort) {
        return <div className={`text-xs font-medium text-muted-foreground ${className ?? ''}`}>{title}</div>;
    }

    const isSorted = currentSortKey === sortKey && currentSortDir !== null;

    const handleAsc = () => onSort(sortKey, isSorted && currentSortDir === 'asc' ? null : 'asc');
    const handleDesc = () => onSort(sortKey, isSorted && currentSortDir === 'desc' ? null : 'desc');
    const handleReset = () => onSort(sortKey, null);

    return (
        <div className={`flex items-center space-x-1 ${className ?? ''}`}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 text-xs font-medium data-[state=open]:bg-accent"
                    >
                        <span>{title}</span>
                        {isSorted && currentSortDir === 'desc' ? (
                            <ArrowDown className="ml-1.5 size-3.5 text-foreground" />
                        ) : isSorted && currentSortDir === 'asc' ? (
                            <ArrowUp className="ml-1.5 size-3.5 text-foreground" />
                        ) : (
                            <ChevronsUpDown className="ml-1.5 size-3.5 text-muted-foreground/60" />
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-28">
                    <DropdownMenuItem onClick={handleAsc} className="cursor-pointer text-xs">
                        <ArrowUp className="mr-2 size-3.5 text-muted-foreground/70" />
                        Asc
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDesc} className="cursor-pointer text-xs">
                        <ArrowDown className="mr-2 size-3.5 text-muted-foreground/70" />
                        Desc
                    </DropdownMenuItem>
                    {isSorted && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleReset}
                                className="cursor-pointer text-xs text-muted-foreground"
                            >
                                <RotateCcw className="mr-2 size-3.5 text-muted-foreground/70" />
                                Reset
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
