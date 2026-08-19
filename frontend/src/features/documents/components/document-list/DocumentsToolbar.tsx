import { Search } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../../components/ui/select';
import { FILTER_LABELS, type TypeFilter } from './documentsList.utils';

export const DocumentsToolbar = ({
    searchQuery,
    typeFilter,
    onSearchChange,
    onTypeFilterChange,
}: {
    searchQuery: string;
    typeFilter: TypeFilter;
    onSearchChange: (value: string) => void;
    onTypeFilterChange: (value: TypeFilter) => void;
}) => (
    <div className="flex flex-col items-stretch justify-between gap-3 border-b border-border bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                type="text"
                placeholder="Search by BL No. or client…"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                className="pl-9"
            />
        </div>

        <Select value={typeFilter} onValueChange={(value) => onTypeFilterChange(value as TypeFilter)}>
            <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {(Object.keys(FILTER_LABELS) as TypeFilter[]).map((category) => (
                    <SelectItem key={category} value={category}>
                        {FILTER_LABELS[category]}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
);
