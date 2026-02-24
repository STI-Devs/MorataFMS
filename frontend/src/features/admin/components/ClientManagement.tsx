import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '../../tracking/types';
import { useClients, useClientTransactions, useCreateClient, useToggleClient, useUpdateClient } from '../hooks/useClients';
import type { Client, CreateClientData, UpdateClientData } from '../types/client.types';
import { ClientFormModal } from './ClientFormModal';
import { TransactionHistoryModal } from './TransactionHistoryModal';

const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
    importer: { label: 'Importer', color: '#0a84ff', icon: 'M19 14l-7 7m0 0l-7-7m7 7V3' },
    exporter: { label: 'Exporter', color: '#30d158', icon: 'M5 10l7-7m0 0l7 7m-7-7v18' },
    both: { label: 'Both', color: '#ff9f0a', icon: 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4' },
};

function TypeBadge({ type }: { type: string }) {
    const cfg = typeConfig[type] ?? { label: type, color: '#8e8e93', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' };
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold capitalize"
            style={{ color: cfg.color, backgroundColor: `${cfg.color}18` }}
        >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
            </svg>
            {cfg.label}
        </span>
    );
}

export const ClientManagement = () => {
    const { dateTime } = useOutletContext<LayoutContext>();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [historyClientId, setHistoryClientId] = useState<number | null>(null);
    const [historyClientName, setHistoryClientName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const { data: clients = [], isLoading, isError } = useClients();
    const createClient = useCreateClient();
    const updateClient = useUpdateClient();
    const toggleClient = useToggleClient();
    const { data: transactionHistory } = useClientTransactions(historyClientId);

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

    const handleToggleActive = async (clientId: number) => {
        await toggleClient.mutateAsync(clientId);
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

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.country?.name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (client.contact_person?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-5 p-4">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-1 text-text-primary">Client Management</h1>
                    <p className="text-sm text-text-secondary">Manage clients, toggle status, and view transaction history</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-secondary">{dateTime.date}</p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Clients', value: clients.length, icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', color: '#0a84ff' },
                    { label: 'Active', value: clients.filter(c => c.is_active).length, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: '#30d158' },
                    { label: 'Importers', value: clients.filter(c => c.type === 'importer' || c.type === 'both').length, icon: 'M19 14l-7 7m0 0l-7-7m7 7V3', color: '#64d2ff' },
                    { label: 'Exporters', value: clients.filter(c => c.type === 'exporter' || c.type === 'both').length, icon: 'M5 10l7-7m0 0l7 7m-7-7v18', color: '#ff9f0a' },
                ].map(stat => (
                    <div key={stat.label} className="bg-surface-tint rounded-lg p-4 border border-border-tint">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-3xl font-bold tabular-nums text-text-primary">{stat.value}</p>
                                <p className="text-xs mt-1 text-text-secondary">{stat.label}</p>
                            </div>
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}20` }}>
                                <svg className="w-4.5 h-4.5" fill="none" stroke={stat.color} viewBox="0 0 24 24" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                                </svg>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-surface rounded-lg border border-border overflow-hidden">
                <div className="p-3 border-b border-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-surface-subtle">
                    <div className="relative flex-1 max-w-sm">
                        <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 h-9 rounded-md border border-border-strong bg-input-bg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-1.5 px-3.5 h-9 rounded-md text-xs font-bold transition-all shadow-sm"
                        style={{ backgroundColor: '#0a84ff', color: '#fff' }}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Client
                    </button>
                </div>

                {isLoading ? (
                    <div className="p-16 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#0a84ff' }} />
                    </div>
                ) : isError ? (
                    <div className="p-16 text-center">
                        <p className="text-sm text-red-500 font-medium">Failed to load clients. Please try again.</p>
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="p-16 text-center">
                        <svg className="w-10 h-10 mx-auto mb-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <p className="text-sm text-text-muted">
                            {searchTerm ? 'No clients match your search' : 'No clients found'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    {['Name', 'Type', 'Country', 'Contact', 'Status', 'Actions'].map((h, i) => (
                                        <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider ${i === 5 ? 'text-right' : 'text-left'} text-text-muted`}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClients.map((client, idx) => (
                                    <tr
                                        key={client.id}
                                        className={`border-b border-border/50 transition-colors hover:bg-hover ${idx % 2 !== 0 ? 'bg-surface-secondary/40' : ''}`}
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                                    style={{ backgroundColor: typeConfig[client.type]?.color ?? '#8e8e93' }}>
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-semibold text-text-primary">{client.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5"><TypeBadge type={client.type} /></td>
                                        <td className="px-5 py-3.5 text-sm text-text-secondary">
                                            {client.country?.name || <span className="text-text-muted">—</span>}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="text-sm text-text-primary">
                                                {client.contact_person && <div className="font-medium">{client.contact_person}</div>}
                                                {client.contact_email && <div className="text-xs text-text-muted">{client.contact_email}</div>}
                                                {!client.contact_person && !client.contact_email && <span className="text-text-muted">—</span>}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                                                style={client.is_active
                                                    ? { color: '#30d158', backgroundColor: 'rgba(48,209,88,0.12)' }
                                                    : { color: '#ff453a', backgroundColor: 'rgba(255,69,58,0.12)' }
                                                }
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: client.is_active ? '#30d158' : '#ff453a' }} />
                                                {client.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleEdit(client)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface-elevated border border-border text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleViewTransactions(client)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                                    style={{ backgroundColor: 'rgba(10,132,255,0.12)', color: '#0a84ff' }}
                                                >
                                                    History
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(client.id)}
                                                    disabled={toggleClient.isPending}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                                                    style={client.is_active
                                                        ? { backgroundColor: 'rgba(255,69,58,0.12)', color: '#ff453a' }
                                                        : { backgroundColor: 'rgba(48,209,88,0.12)', color: '#30d158' }
                                                    }
                                                >
                                                    {client.is_active ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="px-5 py-3 text-xs text-text-muted border-t border-border">
                            Showing {filteredClients.length} of {clients.length} clients
                        </div>
                    </div>
                )}
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
                onClose={() => { setIsHistoryModalOpen(false); setHistoryClientId(null); }}
                clientName={historyClientName}
                imports={transactionHistory?.transactions?.imports ?? []}
                exports={transactionHistory?.transactions?.exports ?? []}
            />
        </div>
    );
};
