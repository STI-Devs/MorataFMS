import { Search, LayoutGrid, List, Plus, X } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../../components/ui/select';

export type ViewMode = 'grouped' | 'flat';

export type StatusFilter = 'all' | 'active' | 'blocked' | 'completed';
export type TimeFilter = 'all' | 'today' | 'week' | 'delayed';

export interface VesselListFilters {
    search: string;
    status: StatusFilter;
    time: TimeFilter;
}

interface VesselListToolbarProps {
    type: 'import' | 'export';
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    filters: VesselListFilters;
    onFiltersChange: (filters: Partial<VesselListFilters>) => void;
    onEncode: () => void;
    encodeLabel: string;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active Workload' },
    { value: 'blocked', label: 'Needs Review' },
    { value: 'completed', label: 'Completed' },
];

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
    { value: 'all', label: 'All Timelines' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'delayed', label: 'Delayed' },
];

export function VesselListToolbar({
    type,
    viewMode,
    onViewModeChange,
    filters,
    onFiltersChange,
    onEncode,
    encodeLabel,
}: VesselListToolbarProps) {
    const searchPlaceholder =
        type === 'import'
            ? 'Search vessel, BL, customs ref, importer…'
            : 'Search vessel, BL, ED no., shipper…';

    const hasActiveFilters =
        Boolean(filters.search) || filters.status !== 'all' || filters.time !== 'all';

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Left filter group */}
            <div className="flex flex-1 flex-wrap items-center gap-2">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[220px] max-w-sm">
                    <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={filters.search}
                        onChange={(e) => onFiltersChange({ search: e.target.value })}
                        className="pl-9 h-9 text-xs bg-card"
                    />
                </div>

                {/* Status Select */}
                <Select
                    value={filters.status}
                    onValueChange={(val) => onFiltersChange({ status: val as StatusFilter })}
                >
                    <SelectTrigger className="h-9 w-[135px] text-xs bg-card">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent side="bottom" className="text-xs">
                        {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Time Select */}
                <Select
                    value={filters.time}
                    onValueChange={(val) => onFiltersChange({ time: val as TimeFilter })}
                >
                    <SelectTrigger className="h-9 w-[130px] text-xs bg-card">
                        <SelectValue placeholder="All Timelines" />
                    </SelectTrigger>
                    <SelectContent side="bottom" className="text-xs">
                        {TIME_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Clear all */}
                {hasActiveFilters && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            onFiltersChange({
                                search: '',
                                status: 'all',
                                time: 'all',
                            })
                        }
                        className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
                    >
                        <X className="size-3.5" />
                        Clear
                    </Button>
                )}
            </div>

            {/* Right controls: View mode + Encode button */}
            <div className="flex items-center gap-2 shrink-0">
                {/* View Mode Toggle */}
                <div className="flex items-center rounded-lg border border-border bg-card p-0.5 shadow-2xs">
                    <Button
                        type="button"
                        variant={viewMode === 'grouped' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => onViewModeChange('grouped')}
                        className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-2xs cursor-pointer"
                        title="Group by vessel"
                    >
                        <LayoutGrid className="size-3.5" />
                        Grouped
                    </Button>
                    <Button
                        type="button"
                        variant={viewMode === 'flat' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => onViewModeChange('flat')}
                        className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-2xs cursor-pointer"
                        title="Flat list"
                    >
                        <List className="size-3.5" />
                        Flat
                    </Button>
                </div>

                {/* Encode Button */}
                <Button
                    type="button"
                    onClick={onEncode}
                    size="sm"
                    className="h-9 px-3.5 text-xs font-semibold gap-1.5 cursor-pointer"
                >
                    <Plus className="size-3.5" />
                    {encodeLabel}
                </Button>
            </div>
        </div>
    );
}
