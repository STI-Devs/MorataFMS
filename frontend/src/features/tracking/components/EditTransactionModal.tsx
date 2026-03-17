import React, { useEffect, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { Spinner } from '../../../components/Spinner';
import { useAuth } from '../../auth/hooks/useAuth';
import { useClients } from '../hooks/useClients';
import { useCountries } from '../hooks/useCountries';
import { useUpdateTransaction } from '../hooks/useUpdateTransaction';
import type { ApiExportTransaction, ApiImportTransaction, CreateExportPayload, CreateImportPayload } from '../types';

interface EditTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'import' | 'export';
    transaction: ApiImportTransaction | ApiExportTransaction | null;
}

export default function EditTransactionModal({ isOpen, onClose, type, transaction }: EditTransactionModalProps) {
    const { user } = useAuth();
    const isEncoder = user?.role === 'encoder';

    const { data: importerClients } = useClients('importer');
    const { data: exporterClients } = useClients('exporter');
    const { data: countries } = useCountries('export_destination', isOpen);

    const updateMutation = useUpdateTransaction(type);

    // Form state
    const [refNo, setRefNo] = useState('');
    const [blNo, setBlNo] = useState('');
    const [blsc, setBlsc] = useState('yellow'); // default
    const [importerId, setImporterId] = useState('');
    const [shipperId, setShipperId] = useState('');
    const [originCountryId, setOriginCountryId] = useState('');
    const [destCountryId, setDestCountryId] = useState('');
    const [vessel, setVessel] = useState('');
    const [arrivalDate, setArrivalDate] = useState('');

    useEffect(() => {
        if (isOpen && transaction) {
            if (type === 'import') {
                const t = transaction as ApiImportTransaction;
                setRefNo(t.customs_ref_no || '');
                setBlNo(t.bl_no || '');
                setBlsc(t.selective_color || 'yellow');
                setImporterId(t.importer?.id?.toString() || '');
                setOriginCountryId(t.origin_country?.id?.toString() || '');
                setArrivalDate(t.arrival_date || '');
            } else {
                const t = transaction as ApiExportTransaction;
                setBlNo(t.bl_no || '');
                setShipperId(t.shipper?.id?.toString() || '');
                setVessel(t.vessel || '');
                setDestCountryId(t.destination_country?.id?.toString() || '');
            }
        }
    }, [isOpen, transaction, type]);

    if (!isOpen || !transaction) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (type === 'import') {
                const payload: CreateImportPayload = {
                    customs_ref_no: refNo.trim(),
                    bl_no: blNo.trim(),
                    selective_color: blsc as 'green' | 'yellow' | 'red',
                    importer_id: Number(importerId),
                    origin_country_id: Number(originCountryId),
                    arrival_date: arrivalDate,
                };
                await updateMutation.mutateAsync({ id: transaction.id, data: payload });
            } else {
                const payload: CreateExportPayload = {
                    shipper_id: Number(shipperId),
                    bl_no: blNo.trim(),
                    vessel: vessel.trim(),
                    destination_country_id: Number(destCountryId),
                };
                await updateMutation.mutateAsync({ id: transaction.id, data: payload });
            }
            onClose();
        } catch (error) {
            console.error('Failed to update transaction:', error);
        }
    };

    const isPending = updateMutation.isPending;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop-in">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={!isPending ? onClose : undefined} />
            <div className="relative bg-surface rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-border flex flex-col max-h-[90vh] animate-modal-in">
                <div className="p-4 sm:p-5 flex items-center justify-between border-b border-border bg-surface shrink-0">
                    <h2 className="text-xl font-bold text-text-primary">
                        Edit {type === 'import' ? 'Import' : 'Export'} Transaction
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={isPending}
                        className="p-2 text-text-muted hover:text-text-primary hover:bg-hover rounded-full transition-colors disabled:opacity-50"
                    >
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 sm:p-5 overflow-y-auto">
                    {updateMutation.isError && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                            {(updateMutation.error as any)?.response?.data?.message || 'Failed to update transaction. Please check the inputs.'}
                        </div>
                    )}

                    <form id="edit-transaction-form" onSubmit={handleSubmit} className="space-y-4">
                        {type === 'import' ? (
                            <>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Customs Ref No</label>
                                    <input
                                        type="text"
                                        required
                                        value={refNo}
                                        onChange={(e) => setRefNo(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        placeholder="e.g. REF-2024-001"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Bill of Lading (BL)</label>
                                        <input
                                            type="text"
                                            required
                                            value={blNo}
                                            onChange={(e) => setBlNo(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                            placeholder="e.g. BL-12345"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Selective Color</label>
                                            {isEncoder && (
                                                <span
                                                    title="Selectivity color is a BOC classification. Only admins can change this."
                                                    className="text-text-muted cursor-help"
                                                >
                                                    <Icon name="lock" className="w-3 h-3" />
                                                </span>
                                            )}
                                        </div>
                                        <select
                                            value={blsc}
                                            disabled={isEncoder}
                                            onChange={(e) => setBlsc(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <option value="green">Green</option>
                                            <option value="yellow">Yellow</option>
                                            <option value="red">Red</option>
                                        </select>
                                        {isEncoder && (
                                            <p className="text-xs text-text-muted">
                                                Set by BOC — contact an admin to update.
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Importer</label>
                                    <select
                                        required
                                        value={importerId}
                                        onChange={(e) => setImporterId(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    >
                                        <option value="">Select an importer</option>
                                        {importerClients?.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Origin</label>
                                        <select
                                            required
                                            value={originCountryId}
                                            onChange={(e) => setOriginCountryId(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        >
                                            <option value="">Select origin</option>
                                            {countries?.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Arrival Date</label>
                                        <input
                                            type="date"
                                            required
                                            value={arrivalDate}
                                            onChange={(e) => setArrivalDate(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 [color-scheme:light] dark:[color-scheme:dark]"
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Bill of Lading (BL)</label>
                                    <input
                                        type="text"
                                        required
                                        value={blNo}
                                        onChange={(e) => setBlNo(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        placeholder="e.g. BL-12345"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Shipper</label>
                                    <select
                                        required
                                        value={shipperId}
                                        onChange={(e) => setShipperId(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    >
                                        <option value="">Select a shipper</option>
                                        {exporterClients?.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Vessel</label>
                                    <input
                                        type="text"
                                        required
                                        value={vessel}
                                        onChange={(e) => setVessel(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        placeholder="e.g. MV Pacific Star"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Destination</label>
                                    <select
                                        required
                                        value={destCountryId}
                                        onChange={(e) => setDestCountryId(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    >
                                        <option value="">Select destination</option>
                                        {countries?.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                    </form>
                </div>

                <div className="p-4 sm:p-5 border-t border-border bg-background/50 flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="px-5 py-2.5 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="edit-transaction-form"
                        disabled={isPending}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-50"
                    >
                        {isPending ? <Spinner size={20} color="#fff" /> : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
