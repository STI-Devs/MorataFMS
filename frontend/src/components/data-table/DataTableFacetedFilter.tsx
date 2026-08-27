import { Check, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

interface DataTableFacetedFilterProps {
    title: string;
    value: string;
    options: {
        label: string;
        value: string;
        icon?: React.ComponentType<{ className?: string }>;
    }[];
    onSelect: (value: string) => void;
}

export function DataTableFacetedFilter({
    title,
    value,
    options,
    onSelect,
}: DataTableFacetedFilterProps) {
    const activeOption = options.find((opt) => opt.value === value && opt.value !== 'all');
    const isFiltered = !!activeOption;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 border-dashed text-xs gap-1.5">
                    <Plus className="size-3.5" />
                    <span>{title}</span>
                    {isFiltered && (
                        <>
                            <Separator orientation="vertical" className="mx-1 h-3.5" />
                            <Badge
                                variant="secondary"
                                className="rounded-sm px-1.5 py-0 text-[10px] font-normal"
                            >
                                {activeOption.label}
                            </Badge>
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44 min-w-44 max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto p-1" align="start" side="bottom">
                {options.map((option) => {
                    const isSelected = value === option.value;
                    const Icon = option.icon;
                    return (
                        <DropdownMenuItem
                            key={option.value}
                            onSelect={() => onSelect(option.value)}
                            className="text-xs cursor-pointer flex items-center justify-between"
                        >
                            <div className="flex items-center gap-2">
                                {Icon && <Icon className="size-3.5 text-muted-foreground" />}
                                <span>{option.label}</span>
                            </div>
                            {isSelected && <Check className="size-3.5 text-primary" />}
                        </DropdownMenuItem>
                    );
                })}
                {isFiltered && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={() => onSelect('all')}
                            className="justify-center text-center text-xs text-muted-foreground font-medium cursor-pointer"
                        >
                            Clear filter
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
