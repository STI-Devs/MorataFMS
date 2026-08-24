import { useState, useMemo } from 'react';
import {
    Ban,
    CheckCircle2,
    MapPin,
    Pencil,
    Plus,
    Search,
    UserX,
    X,
} from 'lucide-react';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { Pagination } from '../../../components/Pagination';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../components/ui/table';
import { useConfirmationModal } from '../../../hooks/useConfirmationModal';
import {
    useCreateLocationOfGoods,
    useLocationsOfGoodsAdmin,
    useToggleLocationOfGoods,
    useUpdateLocationOfGoods,
} from '../hooks/useLocationsOfGoodsAdmin';
import type {
    CreateLocationOfGoodsData,
    LocationOfGoods,
    UpdateLocationOfGoodsData,
} from '../types/locationOfGoods.types';
import { LocationOfGoodsFormModal } from './LocationOfGoodsFormModal';

const STATUS_FILTER_OPTIONS: Array<{ key: 'all' | 'active' | 'inactive'; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
];

export const LocationOfGoodsManagement = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedLocation, setSelectedLocation] = useState<LocationOfGoods | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(30);

    const { data: locationsOfGoods = [], isLoading, isError } = useLocationsOfGoodsAdmin();
    const createLocationOfGoods = useCreateLocationOfGoods();
    const updateLocationOfGoods = useUpdateLocationOfGoods();
    const toggleLocationOfGoods = useToggleLocationOfGoods();
    const { openModal, modalProps } = useConfirmationModal();

    const handleCreateLocation = async (data: CreateLocationOfGoodsData | UpdateLocationOfGoodsData) => {
        await createLocationOfGoods.mutateAsync(data as CreateLocationOfGoodsData);
        setIsFormModalOpen(false);
    };

    const handleUpdateLocation = async (data: CreateLocationOfGoodsData | UpdateLocationOfGoodsData) => {
        if (!selectedLocation) {
            return;
        }

        await updateLocationOfGoods.mutateAsync({
            id: selectedLocation.id,
            data: data as UpdateLocationOfGoodsData,
        });
        setIsFormModalOpen(false);
    };

    const handleToggleActive = (location: LocationOfGoods) => {
        const action = location.is_active ? 'deactivate' : 'activate';
        openModal({
            title: `${action === 'deactivate' ? 'Deactivate' : 'Activate'} Location?`,
            message: `Are you sure you want to ${action} ${location.name}? ${
                action === 'deactivate'
                    ? 'It will be hidden from import declaration dropdowns.'
                    : 'It will become selectable for new import declarations.'
            }`,
            confirmText: action === 'deactivate' ? 'Deactivate' : 'Activate',
            confirmButtonClass: action === 'deactivate' ? 'bg-destructive hover:bg-destructive/90' : 'bg-emerald-600 hover:bg-emerald-700',
            onConfirm: async () => {
                await toggleLocationOfGoods.mutateAsync(location.id);
            },
        });
    };

    const handleEdit = (location: LocationOfGoods) => {
        setSelectedLocation(location);
        setModalMode('edit');
        setIsFormModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedLocation(null);
        setModalMode('create');
        setIsFormModalOpen(true);
    };

    const metrics = useMemo(() => {
        const total = locationsOfGoods.length;
        const active = locationsOfGoods.filter((l) => l.is_active).length;
        const inactive = total - active;
        const activePct = total > 0 ? Math.round((active / total) * 100) : 0;

        return {
            total,
            active,
            inactive,
            activePct,
        };
    }, [locationsOfGoods]);

    const statusCounts = useMemo(() => {
        return {
            all: locationsOfGoods.length,
            active: locationsOfGoods.filter((l) => l.is_active).length,
            inactive: locationsOfGoods.filter((l) => !l.is_active).length,
        };
    }, [locationsOfGoods]);

    const filteredLocations = useMemo(() => {
        const search = searchTerm.toLowerCase();
        return locationsOfGoods.filter((location) => {
            const matchesSearch = location.name.toLowerCase().includes(search);
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && location.is_active) ||
                (statusFilter === 'inactive' && !location.is_active);

            return matchesSearch && matchesStatus;
        });
    }, [locationsOfGoods, searchTerm, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredLocations.length / perPage));
    const paginatedLocations = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredLocations.slice(start, start + perPage);
    }, [filteredLocations, currentPage, perPage]);

    const isFiltered = searchTerm.trim() !== '' || statusFilter !== 'all';

    const handleResetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setCurrentPage(1);
    };

    return (
        <div className="w-full space-y-4 pb-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Location of Goods</h1>
                <p className="text-sm text-muted-foreground">
                    Manage physical ports, warehouses, and examination yards used across import declarations.
                </p>
            </div>

            {/* Section 1: KPI Metric Cards */}
            <div className="grid gap-3 sm:grid-cols-3">
                {/* 1. Total Locations */}
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Total Locations</CardTitle>
                        <MapPin className="size-4 text-muted-foreground/70" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {isLoading ? '—' : metrics.total.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Ports, warehouses, and examination sites
                        </p>
                    </CardContent>
                </Card>

                {/* 2. Active */}
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Active</CardTitle>
                        <CheckCircle2 className="size-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {isLoading ? '—' : metrics.active.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {metrics.total > 0 ? `${metrics.activePct}% usable in import forms` : 'Active status'}
                        </p>
                    </CardContent>
                </Card>

                {/* 3. Inactive */}
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Inactive</CardTitle>
                        <UserX className={`size-4 ${metrics.inactive > 0 ? 'text-rose-500' : 'text-muted-foreground/70'}`} />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div
                            className={`text-2xl font-bold tracking-tight tabular-nums ${
                                metrics.inactive > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
                            }`}
                        >
                            {isLoading ? '—' : metrics.inactive.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {metrics.inactive === 0 ? 'No archived entries' : `${metrics.inactive} hidden from dropdowns`}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Section 2: Main Content Area */}
            <div className="flex flex-col gap-3">
                {/* Search & Filter Toolbar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                        <div className="relative w-full sm:w-[240px] lg:w-[300px]">
                            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search locations, ports, yards..."
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-8 pl-8 text-xs"
                            />
                        </div>

                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                            {STATUS_FILTER_OPTIONS.map((option) => {
                                const isSelected = statusFilter === option.key;
                                const count = statusCounts[option.key];
                                return (
                                    <Button
                                        key={option.key}
                                        variant={isSelected ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                            setStatusFilter(option.key);
                                            setCurrentPage(1);
                                        }}
                                        className={`h-8 px-2.5 text-xs gap-1.5 font-medium shrink-0 shadow-2xs transition-all cursor-pointer ${
                                            !isSelected
                                                ? 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border-border/80'
                                                : ''
                                        }`}
                                    >
                                        {option.label}
                                        <span
                                            className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold tabular-nums ${
                                                isSelected
                                                    ? 'bg-primary-foreground/20 text-primary-foreground'
                                                    : 'bg-background/80 text-foreground border border-border/60'
                                            }`}
                                        >
                                            {count}
                                        </span>
                                    </Button>
                                );
                            })}
                        </div>

                        {isFiltered ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleResetFilters}
                                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                                Reset
                                <X className="ml-1 size-3.5" />
                            </Button>
                        ) : null}
                    </div>

                    <Button
                        size="sm"
                        onClick={handleCreate}
                        className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
                    >
                        <Plus className="size-3.5" />
                        Add Location
                    </Button>
                </div>

                {/* Table Card */}
                <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
                    {isLoading ? (
                        <div className="flex min-h-[280px] flex-col items-center justify-center p-12">
                            <div className="h-7 w-7 rounded-full border-2 border-border border-t-emerald-500 animate-spin" />
                            <p className="mt-3 text-xs font-medium text-muted-foreground">Loading locations...</p>
                        </div>
                    ) : isError ? (
                        <div className="p-12 text-center">
                            <p className="text-sm font-medium text-rose-500">Failed to load locations of goods. Please try again.</p>
                            <p className="mt-1 text-xs text-muted-foreground">Please check your connection and try again.</p>
                        </div>
                    ) : filteredLocations.length === 0 ? (
                        <div className="flex min-h-[280px] flex-col items-center justify-center p-8 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted/30 text-muted-foreground shadow-2xs">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">No locations found</h3>
                            <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
                                {isFiltered
                                    ? 'No location entries match the current filter criteria.'
                                    : 'Add your first port or warehouse location using the button above.'}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow className="hover:bg-transparent border-b border-border/80">
                                            <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[65%] min-w-[280px]">
                                                Location
                                            </TableHead>
                                            <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[20%] min-w-[120px] text-center">
                                                Status
                                            </TableHead>
                                            <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[15%] min-w-[100px] text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedLocations.map((location) => (
                                            <TableRow
                                                key={location.id}
                                                className="hover:bg-muted/50 border-b border-border/60 transition-colors"
                                            >
                                                {/* Location Name & Initial Avatar */}
                                                <TableCell className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-bold shrink-0">
                                                            {location.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span
                                                                className="font-semibold text-xs text-foreground truncate block"
                                                                title={location.name}
                                                            >
                                                                {location.name}
                                                            </span>
                                                            <span className="text-[11px] text-muted-foreground">
                                                                Port / Warehouse facility
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Status */}
                                                <TableCell className="py-3 px-4 text-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                                                            location.is_active
                                                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                                                : 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full ${location.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                        />
                                                        {location.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            type="button"
                                                            title="Edit Location"
                                                            onClick={() => handleEdit(location)}
                                                            className="rounded-md border border-border bg-card p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer shadow-2xs"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </button>
                                                        {location.is_active ? (
                                                            <button
                                                                type="button"
                                                                title="Deactivate Location"
                                                                onClick={() => handleToggleActive(location)}
                                                                disabled={toggleLocationOfGoods.isPending}
                                                                className="rounded-md border border-amber-500/20 bg-amber-500/10 p-1.5 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                                                            >
                                                                <Ban className="h-3.5 w-3.5" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                title="Activate Location"
                                                                onClick={() => handleToggleActive(location)}
                                                                disabled={toggleLocationOfGoods.isPending}
                                                                className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                                                            >
                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Footer */}
                            {filteredLocations.length > 0 ? (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 border-t border-border/80 bg-muted/20">
                                    <p className="text-xs text-muted-foreground">
                                        Showing {Math.min((currentPage - 1) * perPage + 1, filteredLocations.length)} to{' '}
                                        {Math.min(currentPage * perPage, filteredLocations.length)} of {filteredLocations.length} locations
                                    </p>
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        perPage={perPage}
                                        onPageChange={setCurrentPage}
                                        onPerPageChange={(newPerPage) => {
                                            setPerPage(newPerPage);
                                            setCurrentPage(1);
                                        }}
                                        perPageOptions={[15, 30, 50, 100]}
                                        compact
                                    />
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>

            <LocationOfGoodsFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={modalMode === 'create' ? handleCreateLocation : handleUpdateLocation}
                locationOfGoods={selectedLocation}
                mode={modalMode}
            />

            <ConfirmationModal {...modalProps} />
        </div>
    );
};
