import {
    CheckCircle2,
    CircleDashed,
    CircleOff,
    Layers,
    LayoutGrid,
    List,
    Search,
    Timer,
    X,
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { DataTableFacetedFilter } from '../../../../components/data-table/DataTableFacetedFilter';
import type { StatusFilter, TypeFilter } from '../../utils/oversightTransaction.utils';

export type ViewMode = 'table' | 'grouped';

interface OversightToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    typeFilter: TypeFilter;
    onTypeChange: (value: TypeFilter) => void;
    statusFilter: StatusFilter;
    onStatusChange: (value: StatusFilter) => void;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    resultCount?: number;
    onReset: () => void;
}

const STATUS_OPTIONS: {
    value: StatusFilter;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}[] = [
    { value: 'all', label: 'All Statuses', icon: Layers },
    { value: 'pending', label: 'Pending', icon: CircleDashed },
    { value: 'in_progress', label: 'In Progress', icon: Timer },
    { value: 'completed', label: 'Completed', icon: CheckCircle2 },
    { value: 'cancelled', label: 'Cancelled', icon: CircleOff },
];

export const OversightToolbar = ({
    searchTerm,
    onSearchChange,
    typeFilter,
    onTypeChange,
    statusFilter,
    onStatusChange,
    viewMode,
    onViewModeChange,
    onReset,
}: OversightToolbarProps) => {
    const isFiltered =
        searchTerm.trim() !== '' || typeFilter !== 'all' || statusFilter !== 'all';

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-[220px] lg:w-[280px]">
                    <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search transactions…"
                        value={searchTerm}
                        onChange={(event) => onSearchChange(event.target.value)}
                        className="h-8 pl-8 text-xs"
                    />
                </div>

                <Tabs
                    value={typeFilter}
                    onValueChange={(value) => onTypeChange(value as TypeFilter)}
                >
                    <TabsList className="h-8 p-0.5">
                        <TabsTrigger value="all" className="h-7 text-xs px-2.5">All</TabsTrigger>
                        <TabsTrigger value="import" className="h-7 text-xs px-2.5">Imports</TabsTrigger>
                        <TabsTrigger value="export" className="h-7 text-xs px-2.5">Exports</TabsTrigger>
                    </TabsList>
                </Tabs>

                <DataTableFacetedFilter
                    title="Status"
                    value={statusFilter}
                    options={STATUS_OPTIONS}
                    onSelect={(val) => onStatusChange(val as StatusFilter)}
                />

                {isFiltered && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onReset}
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                        Reset
                        <X className="ml-1 size-3.5" />
                    </Button>
                )}
            </div>

            <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border bg-muted/30 p-0.5">
                    <Button
                        type="button"
                        variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => onViewModeChange('table')}
                        className="h-7 px-2 text-xs gap-1.5"
                        title="Flat Table View"
                    >
                        <List className="size-3.5" />
                        Table
                    </Button>
                    <Button
                        type="button"
                        variant={viewMode === 'grouped' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => onViewModeChange('grouped')}
                        className="h-7 px-2 text-xs gap-1.5"
                        title="Grouped by Vessel View"
                    >
                        <LayoutGrid className="size-3.5" />
                        Grouped
                    </Button>
                </div>
            </div>
        </div>
    );
};
