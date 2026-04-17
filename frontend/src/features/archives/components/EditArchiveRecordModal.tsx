import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../../components/Icon';
import type { ArchiveDocument } from '../../documents/types/document.types';
import { useCountries } from '../../tracking/hooks/useCountries';
import { useClients } from '../../tracking/hooks/useClients';
import { useLocationsOfGoods } from '../../tracking/hooks/useLocationsOfGoods';
import { trackingApi } from '../../tracking/api/trackingApi';

const inputClass =
    'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40';

const labelClass = 'text-xs font-bold uppercase tracking-wider text-text-secondary';

interface EditArchiveRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: ArchiveDocument | null;
}

export const EditArchiveRecordModal: React.FC<EditArchiveRecordModalProps> = ({
    isOpen,
    onClose,
    record,
}) => {
    const queryClient = useQueryClient();
    const isImport = record?.type === 'import';

    const { data: clients = [] } = useClients(isImport ? 'importer' : 'exporter', isOpen && !!record);
    const { data: importCountries = [] } = useCountries('import_origin', isOpen && isImport);
    const { data: exportCountries = [] } = useCountries('export_destination', isOpen && !isImport && !!record);
    const { data: locationsOfGoods = [] } = useLocationsOfGoods(isOpen && isImport);

    const [customsRefNo, setCustomsRefNo] = useState('');
    const [blNo, setBlNo] = useState('');
    const [clientId, setClientId] = useState('');
    const [selectiveColor, setSelectiveColor] = useState<'green' | 'yellow' | 'orange' | 'red'>('green');
    const [vesselName, setVesselName] = useState('');
    const [originCountryId, setOriginCountryId] = useState('');
    const [destinationCountryId, setDestinationCountryId] = useState('');
    const [locationOfGoodsId, setLocationOfGoodsId] = useState('');
    const [fileDate, setFileDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!record || !isOpen) {
            return;
        }

        setCustomsRefNo(record.customs_ref_no ?? '');
        setBlNo(record.bl_no ?? '');
        setClientId(record.client_id ? String(record.client_id) : '');
        setSelectiveColor(record.selective_color ?? 'green');
        setVesselName(record.vessel_name ?? '');
        setOriginCountryId(record.origin_country_id ? String(record.origin_country_id) : '');
        setDestinationCountryId(record.destination_country_id ? String(record.destination_country_id) : '');
        setLocationOfGoodsId(record.location_of_goods_id ? String(record.location_of_goods_id) : '');
        setFileDate(record.transaction_date ?? '');
        setError(null);
    }, [isOpen, record]);

    const clientOptions = useMemo(() => {
        if (!record) {
            return clients;
        }

        return mergeCurrentOption(clients, record.client_id, record.client);
    }, [clients, record]);

    const originCountryOptions = useMemo(() => {
        if (!record) {
            return importCountries;
        }

        return mergeCurrentOption(importCountries, record.origin_country_id, record.origin_country);
    }, [importCountries, record]);

    const destinationCountryOptions = useMemo(() => {
        if (!record) {
            return exportCountries;
        }

        return mergeCurrentOption(exportCountries, record.destination_country_id, record.destination_country);
    }, [exportCountries, record]);

    const locationOptions = useMemo(() => {
        if (!record) {
            return locationsOfGoods;
        }

        return mergeCurrentOption(locationsOfGoods, record.location_of_goods_id, record.location_of_goods);
    }, [locationsOfGoods, record]);

    if (!isOpen || !record) {
        return null;
    }

    const handleClose = () => {
        if (isSaving) {
            return;
        }

        onClose();
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        setIsSaving(true);
        setError(null);

        try {
            if (record.type === 'import') {
                await trackingApi.updateArchiveImport(record.transaction_id, {
                    customs_ref_no: customsRefNo.trim() || null,
                    bl_no: blNo.trim(),
                    vessel_name: vesselName.trim() || null,
                    selective_color: selectiveColor,
                    importer_id: Number(clientId),
                    origin_country_id: originCountryId ? Number(originCountryId) : undefined,
                    location_of_goods_id: locationOfGoodsId ? Number(locationOfGoodsId) : undefined,
                    file_date: fileDate,
                });
            } else {
                await trackingApi.updateArchiveExport(record.transaction_id, {
                    bl_no: blNo.trim(),
                    vessel: vesselName.trim() || null,
                    shipper_id: Number(clientId),
                    destination_country_id: Number(destinationCountryId),
                    file_date: fileDate,
                });
            }

            await Promise.all([
                queryClient.refetchQueries({ queryKey: ['archives'] }),
                queryClient.refetchQueries({ queryKey: ['my-archives'] }),
            ]);

            onClose();
        } catch (err: unknown) {
            const responseData = (err as {
                response?: {
                    data?: {
                        message?: string;
                        errors?: Record<string, string[]>;
                    };
                };
            })?.response?.data;

            const validationMessage = responseData?.errors
                ? Object.values(responseData.errors).flat().find((message) => message.trim().length > 0)
                : null;

            setError(validationMessage ?? responseData?.message ?? 'Failed to update archive record.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop-in">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-modal-in">
                <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                    <div>
                        <h2 className="text-lg font-black text-text-primary">Edit Archive</h2>
                        <p className="mt-1 text-sm text-text-muted">
                            Update the stored archive details for <span className="font-semibold text-text-secondary">{record.bl_no}</span>
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSaving}
                        className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
                    >
                        <Icon name="x" className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto px-5 py-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {record.type === 'import' && (
                            <div className="space-y-1.5">
                                <label htmlFor="archive-edit-customs-ref" className={labelClass}>Customs Ref No.</label>
                                <input
                                    id="archive-edit-customs-ref"
                                    type="text"
                                    value={customsRefNo}
                                    onChange={(event) => setCustomsRefNo(event.target.value)}
                                    placeholder="e.g. IMP-2023-055"
                                    className={inputClass}
                                />
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label htmlFor="archive-edit-bl" className={labelClass}>Bill of Lading</label>
                            <input
                                id="archive-edit-bl"
                                type="text"
                                value={blNo}
                                onChange={(event) => setBlNo(event.target.value)}
                                className={inputClass}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="archive-edit-client" className={labelClass}>{record.type === 'import' ? 'Importer' : 'Shipper'}</label>
                            <select
                                id="archive-edit-client"
                                value={clientId}
                                onChange={(event) => setClientId(event.target.value)}
                                className={inputClass}
                                required
                            >
                                <option value="">Select {record.type === 'import' ? 'importer' : 'shipper'}</option>
                                {clientOptions.map((client) => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="archive-edit-date" className={labelClass}>{record.type === 'import' ? 'Arrival Date' : 'Export Date'}</label>
                            <input
                                id="archive-edit-date"
                                type="date"
                                value={fileDate}
                                onChange={(event) => setFileDate(event.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`}
                                required
                            />
                        </div>

                        {record.type === 'import' && (
                            <>
                                <div className="space-y-1.5">
                                    <label htmlFor="archive-edit-selective-color" className={labelClass}>Selective Color</label>
                                    <select
                                        id="archive-edit-selective-color"
                                        value={selectiveColor}
                                        onChange={(event) => setSelectiveColor(event.target.value as typeof selectiveColor)}
                                        className={inputClass}
                                        required
                                    >
                                        <option value="green">Green</option>
                                        <option value="yellow">Yellow</option>
                                        <option value="orange">Orange</option>
                                        <option value="red">Red</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="archive-edit-vessel-name" className={labelClass}>Vessel Name</label>
                                    <input
                                        id="archive-edit-vessel-name"
                                        type="text"
                                        value={vesselName}
                                        onChange={(event) => setVesselName(event.target.value)}
                                        placeholder="e.g. MV Golden Tide"
                                        className={inputClass}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="archive-edit-origin-country" className={labelClass}>Origin Country</label>
                                    <select
                                        id="archive-edit-origin-country"
                                        value={originCountryId}
                                        onChange={(event) => setOriginCountryId(event.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="">Select origin country</option>
                                        {originCountryOptions.map((country) => (
                                            <option key={country.id} value={country.id}>{country.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="archive-edit-location-of-goods" className={labelClass}>Location of Goods</label>
                                    <select
                                        id="archive-edit-location-of-goods"
                                        value={locationOfGoodsId}
                                        onChange={(event) => setLocationOfGoodsId(event.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="">Select location of goods</option>
                                        {locationOptions.map((location) => (
                                            <option key={location.id} value={location.id}>{location.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}

                        {record.type === 'export' && (
                            <>
                                <div className="space-y-1.5">
                                    <label htmlFor="archive-edit-vessel" className={labelClass}>Vessel</label>
                                    <input
                                        id="archive-edit-vessel"
                                        type="text"
                                        value={vesselName}
                                        onChange={(event) => setVesselName(event.target.value)}
                                        placeholder="Enter vessel name"
                                        className={inputClass}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="archive-edit-destination-country" className={labelClass}>Destination Country</label>
                                    <select
                                        id="archive-edit-destination-country"
                                        value={destinationCountryId}
                                        onChange={(event) => setDestinationCountryId(event.target.value)}
                                        className={inputClass}
                                        required
                                    >
                                        <option value="">Select destination country</option>
                                        {destinationCountryOptions.map((country) => (
                                            <option key={country.id} value={country.id}>{country.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-bold text-text-secondary transition-colors hover:text-text-primary disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex min-w-[148px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    Saving...
                                </>
                            ) : 'Save Archive'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

function mergeCurrentOption<T extends { id: number; name: string }>(
    options: T[],
    currentId?: number | null,
    currentName?: string | null,
): T[] {
    if (!currentId || !currentName || options.some((option) => option.id === currentId)) {
        return options;
    }

    return [{ id: currentId, name: currentName } as T, ...options];
}
