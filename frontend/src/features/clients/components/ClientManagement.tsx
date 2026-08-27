import { useState, useMemo } from 'react';
import {
    ArrowDownLeft,
    ArrowLeftRight,
    ArrowUpRight,
    Globe,
    History,
    Mail,
    Pencil,
    Phone,
    Search,
    UserCheck,
    UserPlus,
    Users,
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
import { TransactionHistoryModal } from '../../oversight/components/modals/TransactionHistoryModal';
import {
    useClients,
    useClientTransactions,
    useCreateClient,
    useToggleClient,
    useUpdateClient,
} from '../hooks/useClients';
import type { Client, ClientType, CreateClientData, UpdateClientData } from '../types/client.types';
import { ClientFormModal } from './ClientFormModal';

const typeConfig: Record<
    ClientType,
    { label: string; className: string; avatarBg: string; icon: typeof ArrowLeftRight }
> = {
    importer: {
        label: 'Importer',
        className: 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400',
        avatarBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
        icon: ArrowDownLeft,
    },
    exporter: {
        label: 'Exporter',
        className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        avatarBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        icon: ArrowUpRight,
    },
    both: {
        label: 'Both',
        className: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
        avatarBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        icon: ArrowLeftRight,
    },
};

function TypeBadge({ type }: { type: ClientType }) {
    const cfg = typeConfig[type] ?? typeConfig.both;
    const IconComponent = cfg.icon;

    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg.className}`}>
            <IconComponent className="size-3 shrink-0" />
            {cfg.label}
        </span>
    );
}

const TYPE_FILTER_OPTIONS: Array<{ key: string; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'both', label: 'Both' },
    { key: 'importer', label: 'Importer' },
    { key: 'exporter', label: 'Exporter' },
];

export const ClientManagement = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [historyClientId, setHistoryClientId] = useState<number | null>(null);
    const [historyClientName, setHistoryClientName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(30);

    const { data: clients = [], isLoading, isError } = useClients();
    const createClient = useCreateClient();
    const updateClient = useUpdateClient();
    const toggleClient = useToggleClient();
    const { data: transactionHistory } = useClientTransactions(historyClientId);
    const { openModal, modalProps } = useConfirmationModal();

    const handleCreateClient = async (data: CreateClientData | UpdateClientData) => {
        await createClient.mutateAsync(data as CreateClientData);
        setIsFormModalOpen(false);
    };

    const handleUpdateClient = async (data: CreateClientData | UpdateClientData) => {
        if (selectedClient) {
            await updateClient.mutateAsync({ id: selectedClient.id, data: data as UpdateClientData });
            setIsFormModalOpen(false);
        }
    };

    const handleToggleActive = (client: Client) => {
        const action = client.is_active ? 'deactivate' : 'activate';
        openModal({
            title: `${action === 'deactivate' ? 'Deactivate' : 'Activate'} Client?`,
            message: `Are you sure you want to ${action} ${client.name}?`,
            confirmText: action === 'deactivate' ? 'Deactivate' : 'Activate',
            confirmButtonClass: action === 'deactivate' ? 'bg-destructive hover:bg-destructive/90' : 'bg-emerald-600 hover:bg-emerald-700',
            onConfirm: async () => {
                await toggleClient.mutateAsync(client.id);
            },
        });
    };

    const handleViewTransactions = (client: Client) => {
        setHistoryClientId(client.id);
        setHistoryClientName(client.name);
        setIsHistoryModalOpen(true);
    };

    const handleEdit = (client: Client) => {
        setSelectedClient(client);
        setModalMode('edit');
        setIsFormModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedClient(null);
        setModalMode('create');
        setIsFormModalOpen(true);
    };

    const metrics = useMemo(() => {
        const total = clients.length;
        const active = clients.filter((c) => c.is_active).length;
        const inactive = total - active;
        const importers = clients.filter((c) => c.type === 'importer' || c.type === 'both').length;
        const exporters = clients.filter((c) => c.type === 'exporter' || c.type === 'both').length;
        const bothTypes = clients.filter((c) => c.type === 'both').length;
        const activePct = total > 0 ? Math.round((active / total) * 100) : 0;

        return {
            total,
            active,
            inactive,
            importers,
            exporters,
            bothTypes,
            activePct,
        };
    }, [clients]);

    const typeCounts = useMemo(() => {
        return {
            all: clients.length,
            both: clients.filter((c) => c.type === 'both').length,
            importer: clients.filter((c) => c.type === 'importer').length,
            exporter: clients.filter((c) => c.type === 'exporter').length,
        };
    }, [clients]);

    const filteredClients = useMemo(() => {
        return clients.filter((client) => {
            const matchesSearch =
                client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (client.country?.name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
                (client.contact_person?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
                (client.contact_email?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
                (client.contact_phone?.toLowerCase() ?? '').includes(searchTerm.toLowerCase());

            const matchesType = typeFilter === 'all' || client.type === typeFilter;
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && client.is_active) ||
                (statusFilter === 'inactive' && !client.is_active);

            return matchesSearch && matchesType && matchesStatus;
        });
    }, [clients, searchTerm, typeFilter, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredClients.length / perPage));
    const paginatedClients = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredClients.slice(start, start + perPage);
    }, [filteredClients, currentPage, perPage]);

    const isFiltered = searchTerm.trim() !== '' || typeFilter !== 'all' || statusFilter !== 'all';

    const handleResetFilters = () => {
        setSearchTerm('');
        setTypeFilter('all');
        setStatusFilter('all');
        setCurrentPage(1);
    };

    return (
        <div className="w-full space-y-4 pb-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Brokerage Client Management</h1>
                <p className="text-sm text-muted-foreground">
                    Manage brokerage clients, assign operational types, and review transaction history.
                </p>
            </div>

            {/* Section 1: KPI Metric Cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Total Clients */}
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Total Clients</CardTitle>
                        <Users className="size-4 text-muted-foreground/70" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {isLoading ? '—' : metrics.total.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {metrics.total > 0
                                ? `${metrics.importers} importers · ${metrics.exporters} exporters`
                                : 'All registered clients'}
                        </p>
                    </CardContent>
                </Card>

                {/* 2. Active Accounts */}
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Active Accounts</CardTitle>
                        <UserCheck className="size-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {isLoading ? '—' : metrics.active.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {metrics.total > 0 ? `${metrics.activePct}% of total clients` : 'Active operations'}
                        </p>
                    </CardContent>
                </Card>

                {/* 3. Inactive Accounts */}
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
                            {metrics.inactive === 0 ? 'All clients active' : `${metrics.inactive} deactivated accounts`}
                        </p>
                    </CardContent>
                </Card>

                {/* 4. Dual Operations */}
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Dual Operations</CardTitle>
                        <ArrowLeftRight className="size-4 text-amber-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {isLoading ? '—' : metrics.bothTypes.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Import & export handlers
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
                                placeholder="Search client name, contact, country..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-8 pl-8 text-xs"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                            {TYPE_FILTER_OPTIONS.map((option) => {
                                const isSelected = typeFilter === option.key;
                                const count = typeCounts[option.key as keyof typeof typeCounts] ?? 0;
                                return (
                                    <Button
                                        key={option.key}
                                        variant={isSelected ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                            setTypeFilter(option.key);
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
                        <UserPlus className="size-3.5" />
                        Create Client
                    </Button>
                </div>

                {/* Table Card */}
                <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xs">
                    {isLoading ? (
                        <div className="flex min-h-[280px] flex-col items-center justify-center p-12">
                            <div className="h-7 w-7 rounded-full border-2 border-border border-t-emerald-500 animate-spin" />
                            <p className="mt-3 text-xs font-medium text-muted-foreground">Loading brokerage clients...</p>
                        </div>
                    ) : isError ? (
                        <div className="p-12 text-center">
                            <p className="text-sm font-medium text-rose-500">Failed to load brokerage clients.</p>
                            <p className="mt-1 text-xs text-muted-foreground">Please check your connection and try again.</p>
                        </div>
                    ) : filteredClients.length === 0 ? (
                        <div className="flex min-h-[280px] flex-col items-center justify-center p-8 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted/30 text-muted-foreground shadow-2xs">
                                <Users className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">No brokerage clients found</h3>
                            <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
                                {isFiltered
                                    ? 'No accounts match the current filter criteria.'
                                    : 'Create your first brokerage client account using the button above.'}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow className="hover:bg-transparent border-b border-border/80">
                                            <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[32%] min-w-[240px]">
                                                Client / Organization
                                            </TableHead>
                                            <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[15%] min-w-[130px]">
                                                Type
                                            </TableHead>
                                            <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[15%] min-w-[120px]">
                                                Country
                                            </TableHead>
                                            <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[20%] min-w-[160px]">
                                                Contact Info
                                            </TableHead>
                                            <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[10%] min-w-[90px]">
                                                Status
                                            </TableHead>
                                            <TableHead className="h-9 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[8%] min-w-[110px] text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedClients.map((client) => {
                                            const cfg = typeConfig[client.type] ?? typeConfig.both;

                                            return (
                                                <TableRow key={client.id} className="hover:bg-muted/50 border-b border-border/60 transition-colors">
                                                    {/* Client Name & Initial Avatar */}
                                                    <TableCell className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold shrink-0 ${cfg.avatarBg}`}
                                                            >
                                                                {client.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span className="font-semibold text-xs text-foreground truncate block" title={client.name}>
                                                                    {client.name}
                                                                </span>
                                                                {client.address ? (
                                                                    <p className="text-[11px] text-muted-foreground truncate max-w-xs mt-0.5" title={client.address}>
                                                                        {client.address}
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Type */}
                                                    <TableCell className="py-3 px-4">
                                                        <TypeBadge type={client.type} />
                                                    </TableCell>

                                                    {/* Country */}
                                                    <TableCell className="py-3 px-4 text-xs text-muted-foreground">
                                                        {client.country?.name ? (
                                                            <span className="inline-flex items-center gap-1.5 text-foreground font-medium">
                                                                <Globe className="size-3 text-muted-foreground shrink-0" />
                                                                {client.country.name}
                                                            </span>
                                                        ) : (
                                                            <span>—</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Contact Info */}
                                                    <TableCell className="py-3 px-4">
                                                        {client.contact_person || client.contact_email || client.contact_phone ? (
                                                            <div className="space-y-0.5 min-w-0">
                                                                {client.contact_person ? (
                                                                    <p className="text-xs font-medium text-foreground truncate" title={client.contact_person}>
                                                                        {client.contact_person}
                                                                    </p>
                                                                ) : null}
                                                                {client.contact_email ? (
                                                                    <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1" title={client.contact_email}>
                                                                        <Mail className="size-2.5 text-muted-foreground/80 shrink-0" />
                                                                        {client.contact_email}
                                                                    </p>
                                                                ) : null}
                                                                {client.contact_phone ? (
                                                                    <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1" title={client.contact_phone}>
                                                                        <Phone className="size-2.5 text-muted-foreground/80 shrink-0" />
                                                                        {client.contact_phone}
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">—</span>
                                                        )}
                                                    </TableCell>

                                                    {/* Status */}
                                                    <TableCell className="py-3 px-4">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                                                                client.is_active
                                                                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                                                    : 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`h-1.5 w-1.5 rounded-full ${client.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                            />
                                                            {client.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </TableCell>

                                                    {/* Actions */}
                                                    <TableCell className="py-3 px-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                type="button"
                                                                title="Edit Client"
                                                                onClick={() => handleEdit(client)}
                                                                className="rounded-md border border-border bg-card p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer shadow-2xs"
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                title="View History"
                                                                onClick={() => handleViewTransactions(client)}
                                                                className="rounded-md border border-blue-500/20 bg-blue-500/10 p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer shadow-2xs"
                                                            >
                                                                <History className="h-3.5 w-3.5" />
                                                            </button>
                                                            {client.is_active ? (
                                                                <button
                                                                    type="button"
                                                                    title="Deactivate Client"
                                                                    onClick={() => handleToggleActive(client)}
                                                                    disabled={toggleClient.isPending}
                                                                    className="rounded-md border border-amber-500/20 bg-amber-500/10 p-1.5 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                                                                >
                                                                    <UserX className="h-3.5 w-3.5" />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    title="Activate Client"
                                                                    onClick={() => handleToggleActive(client)}
                                                                    disabled={toggleClient.isPending}
                                                                    className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                                                                >
                                                                    <UserCheck className="h-3.5 w-3.5" />
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
                            {filteredClients.length > 0 ? (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 border-t border-border/80 bg-muted/20">
                                    <p className="text-xs text-muted-foreground">
                                        Showing {Math.min((currentPage - 1) * perPage + 1, filteredClients.length)} to{' '}
                                        {Math.min(currentPage * perPage, filteredClients.length)} of {filteredClients.length} clients
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

            <ClientFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={modalMode === 'create' ? handleCreateClient : handleUpdateClient}
                client={selectedClient}
                mode={modalMode}
            />

            <TransactionHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => {
                    setIsHistoryModalOpen(false);
                    setHistoryClientId(null);
                }}
                clientName={historyClientName}
                imports={transactionHistory?.transactions?.imports ?? []}
                exports={transactionHistory?.transactions?.exports ?? []}
            />

            <ConfirmationModal {...modalProps} />
        </div>
    );
};
