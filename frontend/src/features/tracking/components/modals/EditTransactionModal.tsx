import React, { useState } from 'react';
import { Icon } from '../../../../components/Icon';
import { Spinner } from '../../../../components/Spinner';
import { useClients } from '../../hooks/useClients';
import { useCountries } from '../../hooks/useCountries';
import { useLocationsOfGoods } from '../../hooks/useLocationsOfGoods';
import { useUpdateTransaction } from '../../hooks/useUpdateTransaction';
import type { ApiExportTransaction, ApiImportTransaction, CreateExportPayload, CreateImportPayload } from '../../types';

interface EditTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'import' | 'export';
    transaction: ApiImportTransaction | ApiExportTransaction | null;
}

type SelectiveColor = 'green' | 'yellow' | 'orange' | 'red';

export default function EditTransactionModal({ isOpen, onClose, type, transaction }: EditTransactionModalProps) {
    const importTransaction = type === 'import' ? transaction as ApiImportTransaction | null : null;
    const exportTransaction = type === 'export' ? transaction as ApiExportTransaction | null : null;

    const { data: importerClients } = useClients('importer');
    const { data: exporterClients } = useClients('exporter');
    const { data: importCountries } = useCountries('import_origin', isOpen && type === 'import');
    const { data: exportCountries } = useCountries('export_destination', isOpen && type === 'export');
    const { data: locationsOfGoods } = useLocationsOfGoods(isOpen && type === 'import');

    const updateMutation = useUpdateTransaction(type);

    const [refNo, setRefNo] = useState(() => importTransaction?.customs_ref_no || '');
    const [blNo, setBlNo] = useState(() => (type === 'import' ? importTransaction?.bl_no : exportTransaction?.bl_no) || '');
    const [blsc, setBlsc] = useState<SelectiveColor>(() => importTransaction?.selective_color || 'yellow');
    const [importerId, setImporterId] = useState(() => importTransaction?.importer?.id?.toString() || '');
    const [shipperId, setShipperId] = useState(() => exportTransaction?.shipper?.id?.toString() || '');
    const [originCountryId, setOriginCountryId] = useState(() => importTransaction?.origin_country?.id?.toString() || '');
    const [destCountryId, setDestCountryId] = useState(() => exportTransaction?.destination_country?.id?.toString() || '');
    const [vessel, setVessel] = useState(() => (type === 'import' ? importTransaction?.vessel_name : exportTransaction?.vessel) || '');
    const [locationOfGoodsId, setLocationOfGoodsId] = useState(() => importTransaction?.location_of_goods?.id?.toString() || '');
    const [arrivalDate, setArrivalDate] = useState(() => importTransaction?.arrival_date || '');
    const [departureDate, setDepartureDate] = useState(() => exportTransaction?.export_date || '');

    if (!isOpen || !transaction) {
        return null;
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        try {
            if (type === 'import') {
                const payload: CreateImportPayload = {
                    customs_ref_no: refNo.trim(),
                    bl_no: blNo.trim(),
                    vessel_name: vessel.trim(),
                    selective_color: blsc as 'green' | 'yellow' | 'orange' | 'red',
                    importer_id: Number(importerId),
                    ...(originCountryId && { origin_country_id: Number(originCountryId) }),
                    ...(locationOfGoodsId && { location_of_goods_id: Number(locationOfGoodsId) }),
                    arrival_date: arrivalDate,
                };
                await updateMutation.mutateAsync({ id: transaction.id, data: payload });
            } else {
                const payload: CreateExportPayload = {
                    shipper_id: Number(shipperId),
                    bl_no: blNo.trim(),
                    vessel: vessel.trim(),
                    export_date: departureDate,
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
    const errorMessage = updateMutation.error
        ? (updateMutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update transaction. Please check the inputs.'
        : '';

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
                            {errorMessage}
                        </div>
                    )}

                    <form id="edit-transaction-form" onSubmit={handleSubmit} className="space-y-4">
                        {type === 'import' ? (
                            <>
                                <div className="space-y-1.5">
                                    <label htmlFor="edit-import-customs-ref" className="text-xs font-bold text-text-secondary uppercase tracking-wider">Customs Ref No</label>
                                    <input
                                        id="edit-import-customs-ref"
                                        type="text"
                                        required
                                        value={refNo}
                                        onChange={(event) => setRefNo(event.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        placeholder="e.g. REF-2024-001"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <label htmlFor="edit-import-bl" className="text-xs font-bold text-text-secondary uppercase tracking-wider">Bill of Lading (BL)</label>
                                        <input
                                            id="edit-import-bl"
                                            type="text"
                                            required
                                            value={blNo}
                                            onChange={(event) => setBlNo(event.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                            placeholder="e.g. BL-12345"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="edit-import-selective-color" className="text-xs font-bold text-text-secondary uppercase tracking-wider">Selective Color</label>
                                        <select
                                            id="edit-import-selective-color"
                                            value={blsc}
                                            onChange={(event) => setBlsc(event.target.value as SelectiveColor)}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        >
                                            <option value="green">Green</option>
                                            <option value="yellow">Yellow</option>
                                            <option value="orange">Orange</option>
                                            <option value="red">Red</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="edit-import-importer" className="text-xs font-bold text-text-secondary uppercase tracking-wider">Importer</label>
                                    <select
                                        id="edit-import-importer"
                                        required
                                        value={importerId}
                                        onChange={(event) => setImporterId(event.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    >
                                        <option value="">Select an importer</option>
                                        {importerClients?.map((client) => (
                                            <option key={client.id} value={client.id}>{client.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <label htmlFor="edit-import-origin" className="text-xs font-bold text-text-secondary uppercase tracking-wider">Origin</label>
                                        <select
                                            id="edit-import-origin"
                                            value={originCountryId}
                                            onChange={(event) => setOriginCountryId(event.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        >
                                            <option value="">Select origin</option>
                                            {importCountries?.map((country) => (
                                                <option key={country.id} value={country.id}>{country.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="edit-import-arrival-date" className="text-xs font-bold text-text-secondary uppercase tracking-wider">Arrival Date</label>
                                        <input
                                            id="edit-import-arrival-date"
                                            type="date"
                                            required
                                            value={arrivalDate}
                                            onChange={(event) => setArrivalDate(event.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 [color-scheme:light] dark:[color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <label htmlFor="edit-import-vessel-name" className="text-xs font-bold text-text-secondary uppercase tracking-wider">Vessel Name</label>
                                        <input
                                            id="edit-import-vessel-name"
                                            type="text"
                                            required
                                            value={vessel}
                                            onChange={(event) => setVessel(event.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                            placeholder="e.g. MV Pacific Star"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="edit-import-location-of-goods" className="text-xs font-bold text-text-secondary uppercase tracking-wider">Location of Goods</label>
                                        <select
                                            id="edit-import-location-of-goods"
                                            value={locationOfGoodsId}
                                            onChange={(event) => setLocationOfGoodsId(event.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        >
                                            <option value="">Select location of goods</option>
                                            {locationsOfGoods?.map((location) => (
                                                <option key={location.id} value={location.id}>{location.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-1.5">
                                    <label htmlFor="edit-export-bl" className="text-xs font-bold text-text-secondary uppercase tracking-wider">Bill of Lading (BL)</label>
                                    <input
                                        id="edit-export-bl"
                                        type="text"
                                        required
                                        value={blNo}
                                        onChange={(event) => setBlNo(event.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        placeholder="e.g. BL-12345"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="edit-export-shipper" className="text-xs font-bold text-text-secondary uppercase tracking-wider">Shipper</label>
                                    <select
                                        id="edit-export-shipper"
                                        required
                                        value={shipperId}
                                        onChange={(event) => setShipperId(event.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    >
                                        <option value="">Select a shipper</option>
                                        {exporterClients?.map((client) => (
                                            <option key={client.id} value={client.id}>{client.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="edit-export-vessel" className="text-xs font-bold text-text-secondary uppercase tracking-wider">Vessel</label>
                                    <input
                                        id="edit-export-vessel"
                                        type="text"
                                        required
                                        value={vessel}
                                        onChange={(event) => setVessel(event.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        placeholder="e.g. MV Pacific Star"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="edit-export-departure-date" className="text-xs font-bold text-text-secondary uppercase tracking-wider">Departure Date</label>
                                    <input
                                        id="edit-export-departure-date"
                                        type="date"
                                        required
                                        value={departureDate}
                                        onChange={(event) => setDepartureDate(event.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 [color-scheme:light] dark:[color-scheme:dark]"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="edit-export-destination" className="text-xs font-bold text-text-secondary uppercase tracking-wider">Destination</label>
                                    <select
                                        id="edit-export-destination"
                                        required
                                        value={destCountryId}
                                        onChange={(event) => setDestCountryId(event.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    >
                                        <option value="">Select destination</option>
                                        {exportCountries?.map((country) => (
                                            <option key={country.id} value={country.id}>{country.name}</option>
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
