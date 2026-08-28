import { useState, useMemo } from 'react';
import {
    ArrowDownLeft,
    ArrowLeftRight,
    ArrowUpRight,
    Ban,
    CheckCircle2,
    Globe,
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
    useCountriesAdmin,
    useCreateCountry,
    useToggleCountry,
    useUpdateCountry,
} from '../hooks/useCountriesAdmin';
import type { Country, CountryType, CreateCountryData, UpdateCountryData } from '../types/country.types';
import { CountryFormModal } from './CountryFormModal';

const typeConfig: Record<
    CountryType,
    { label: string; className: string; avatarBg: string; icon: typeof ArrowLeftRight }
> = {
    import_origin: {
        label: 'Import Origin',
        className: 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400',
        avatarBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
        icon: ArrowDownLeft,
    },
    export_destination: {
        label: 'Export Destination',
        className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        avatarBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        icon: ArrowUpRight,
    },
    both: {
        label: 'Both Flows',
        className: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
        avatarBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        icon: ArrowLeftRight,
    },
};

function TypeBadge({ type }: { type: CountryType }) {
    const cfg = typeConfig[type] ?? typeConfig.both;
    const IconComponent = cfg.icon;

    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg.className}`}>
            <IconComponent className="size-3 shrink-0" />
            {cfg.label}
        </span>
    );
}

const FLOW_FILTER_OPTIONS: Array<{ key: string; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'both', label: 'Both' },
    { key: 'import_origin', label: 'Import Origin' },
    { key: 'export_destination', label: 'Export Destination' },
];

export const CountryManagement = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [flowFilter, setFlowFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(30);

    const { data: countries = [], isLoading, isError } = useCountriesAdmin();
    const createCountry = useCreateCountry();
    const updateCountry = useUpdateCountry();
    const toggleCountry = useToggleCountry();
    const { openModal, modalProps } = useConfirmationModal();

    const handleCreateCountry = async (data: CreateCountryData | UpdateCountryData) => {
        await createCountry.mutateAsync(data as CreateCountryData);
        setIsFormModalOpen(false);
    };

    const handleUpdateCountry = async (data: CreateCountryData | UpdateCountryData) => {
        if (!selectedCountry) {
            return;
        }

        await updateCountry.mutateAsync({
            id: selectedCountry.id,
            data: data as UpdateCountryData,
        });
        setIsFormModalOpen(false);
    };

    const handleToggleActive = (country: Country) => {
        const action = country.is_active ? 'deactivate' : 'activate';
        openModal({
            title: `${action === 'deactivate' ? 'Deactivate' : 'Activate'} Country?`,
            message: `Are you sure you want to ${action} ${country.name}? ${
                action === 'deactivate'
                    ? 'It will be hidden from client and transaction dropdowns.'
                    : 'It will become selectable for new transactions.'
            }`,
            confirmText: action === 'deactivate' ? 'Deactivate' : 'Activate',
            confirmButtonClass: action === 'deactivate' ? 'bg-destructive hover:bg-destructive/90' : 'bg-emerald-600 hover:bg-emerald-700',
            onConfirm: async () => {
                await toggleCountry.mutateAsync(country.id);
            },
        });
    };

    const handleEdit = (country: Country) => {
        setSelectedCountry(country);
        setModalMode('edit');
        setIsFormModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedCountry(null);
        setModalMode('create');
        setIsFormModalOpen(true);
    };

    const metrics = useMemo(() => {
        const total = countries.length;
        const active = countries.filter((c) => c.is_active).length;
        const inactive = total - active;
        const importReady = countries.filter((c) => c.type === 'import_origin' || c.type === 'both').length;
        const exportReady = countries.filter((c) => c.type === 'export_destination' || c.type === 'both').length;
        const bothFlows = countries.filter((c) => c.type === 'both').length;
        const activePct = total > 0 ? Math.round((active / total) * 100) : 0;

        return {
            total,
            active,
            inactive,
            importReady,
            exportReady,
            bothFlows,
            activePct,
        };
    }, [countries]);

    const flowCounts = useMemo(() => {
        return {
            all: countries.length,
            both: countries.filter((c) => c.type === 'both').length,
            import_origin: countries.filter((c) => c.type === 'import_origin').length,
            export_destination: countries.filter((c) => c.type === 'export_destination').length,
        };
    }, [countries]);

    const filteredCountries = useMemo(() => {
        const search = searchTerm.toLowerCase();
        return countries.filter((country) => {
            const matchesSearch =
                country.name.toLowerCase().includes(search) ||
                (country.code?.toLowerCase() ?? '').includes(search) ||
                country.type.toLowerCase().includes(search) ||
                (country.type_label?.toLowerCase() ?? '').includes(search);

            const matchesFlow = flowFilter === 'all' || country.type === flowFilter;
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && country.is_active) ||
                (statusFilter === 'inactive' && !country.is_active);

            return matchesSearch && matchesFlow && matchesStatus;
        });
    }, [countries, searchTerm, flowFilter, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredCountries.length / perPage));
    const paginatedCountries = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredCountries.slice(start, start + perPage);
    }, [filteredCountries, currentPage, perPage]);

    const isFiltered = searchTerm.trim() !== '' || flowFilter !== 'all' || statusFilter !== 'all';

    const handleResetFilters = () => {
        setSearchTerm('');
        setFlowFilter('all');
        setStatusFilter('all');
        setCurrentPage(1);
    };

    return (
        <div className="w-full space-y-4 pb-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Country Management</h1>
                <p className="text-sm text-muted-foreground">
                    Manage origin and destination countries used across client and transaction forms.
                </p>
            </div>

            {/* Section 1: KPI Metric Cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Total Countries */}
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Total Countries</CardTitle>
                        <Globe className="size-4 text-muted-foreground/70" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {isLoading ? '—' : metrics.total.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {metrics.total > 0
                                ? `${metrics.importReady} import · ${metrics.exportReady} export ready`
                                : 'All registered countries'}
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
                            {metrics.total > 0 ? `${metrics.activePct}% usable now` : 'Active status'}
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

                {/* 4. Both Flows */}
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Both Flows</CardTitle>
                        <ArrowLeftRight className="size-4 text-amber-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {isLoading ? '—' : metrics.bothFlows.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Import and export enabled
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Section 2: Main Content Area */}
            <div className="flex flex-col gap-3">
                {/* Search & Filter Toolbar */}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                        <div className="relative w-full min-w-0 sm:w-[240px] lg:w-[300px]">
                            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search countries, ISO code..."
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-8 pl-8 text-xs"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                            {FLOW_FILTER_OPTIONS.map((option) => {
                                const isSelected = flowFilter === option.key;
                                const count = flowCounts[option.key as keyof typeof flowCounts] ?? 0;
                                return (
                                    <Button
                                        key={option.key}
                                        variant={isSelected ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                            setFlowFilter(option.key);
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
                        Add Country
                    </Button>
                </div>

                {/* Table Card */}
                <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
                    {isLoading ? (
                        <div className="flex min-h-[280px] flex-col items-center justify-center p-12">
                            <div className="h-7 w-7 rounded-full border-2 border-border border-t-emerald-500 animate-spin" />
                            <p className="mt-3 text-xs font-medium text-muted-foreground">Loading countries...</p>
                        </div>
                    ) : isError ? (
                        <div className="p-12 text-center">
                            <p className="text-sm font-medium text-rose-500">Failed to load countries. Please try again.</p>
                            <p className="mt-1 text-xs text-muted-foreground">Please check your connection and try again.</p>
                        </div>
                    ) : filteredCountries.length === 0 ? (
                        <div className="flex min-h-[280px] flex-col items-center justify-center p-8 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted/30 text-muted-foreground shadow-2xs">
                                <Globe className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">No countries found</h3>
                            <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
                                {isFiltered
                                    ? 'No country entries match the current filter criteria.'
                                    : 'Add your first trade partner country using the button above.'}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow className="hover:bg-transparent border-b border-border/80">
                                            <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[40%] min-w-[240px]">
                                                Country
                                            </TableHead>
                                            <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[15%] min-w-[100px] text-center">
                                                Code
                                            </TableHead>
                                            <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[20%] min-w-[150px] text-center">
                                                Usage
                                            </TableHead>
                                            <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[15%] min-w-[110px] text-center">
                                                Status
                                            </TableHead>
                                            <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[10%] min-w-[100px] text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedCountries.map((country) => {
                                            const cfg = typeConfig[country.type] ?? typeConfig.both;

                                            return (
                                                <TableRow
                                                    key={country.id}
                                                    className="hover:bg-muted/50 border-b border-border/60 transition-colors"
                                                >
                                                    {/* Country Name & Initial Avatar */}
                                                    <TableCell className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold shrink-0 ${cfg.avatarBg}`}
                                                            >
                                                                {country.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span
                                                                    className="font-semibold text-xs text-foreground truncate block"
                                                                    title={country.name}
                                                                >
                                                                    {country.name}
                                                                </span>
                                                                <span className="text-[11px] text-muted-foreground">
                                                                    {country.type_label ?? cfg.label}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* ISO Code */}
                                                    <TableCell className="py-3 px-4 text-center">
                                                        {country.code ? (
                                                            <span className="inline-flex items-center rounded-md border border-border/80 bg-muted/50 px-2 py-0.5 text-xs font-semibold text-foreground tracking-wider">
                                                                {country.code}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">—</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Usage Flow */}
                                                    <TableCell className="py-3 px-4 text-center">
                                                        <TypeBadge type={country.type} />
                                                    </TableCell>

                                                    {/* Status */}
                                                    <TableCell className="py-3 px-4 text-center">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                                                                country.is_active
                                                                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                                                    : 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`h-1.5 w-1.5 rounded-full ${country.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                            />
                                                            {country.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </TableCell>

                                                    {/* Actions */}
                                                    <TableCell className="py-3 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                type="button"
                                                                title="Edit Country"
                                                                onClick={() => handleEdit(country)}
                                                                className="rounded-md border border-border bg-card p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer shadow-2xs"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </button>
                                                            {country.is_active ? (
                                                                <button
                                                                    type="button"
                                                                    title="Deactivate Country"
                                                                    onClick={() => handleToggleActive(country)}
                                                                    disabled={toggleCountry.isPending}
                                                                    className="rounded-md border border-amber-500/20 bg-amber-500/10 p-1.5 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                                                                >
                                                                    <Ban className="h-3.5 w-3.5" />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    title="Activate Country"
                                                                    onClick={() => handleToggleActive(country)}
                                                                    disabled={toggleCountry.isPending}
                                                                    className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                                                                >
                                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Footer */}
                            {filteredCountries.length > 0 ? (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 border-t border-border/80 bg-muted/20">
                                    <p className="text-xs text-muted-foreground">
                                        Showing {Math.min((currentPage - 1) * perPage + 1, filteredCountries.length)} to{' '}
                                        {Math.min(currentPage * perPage, filteredCountries.length)} of {filteredCountries.length} countries
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

            <CountryFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={modalMode === 'create' ? handleCreateCountry : handleUpdateCountry}
                country={selectedCountry}
                mode={modalMode}
            />

            <ConfirmationModal {...modalProps} />
        </div>
    );
};
