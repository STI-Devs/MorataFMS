import { useEffect, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { getApiError } from '../../../lib/apiErrors';
import { useClients } from '../hooks/useClients';
import { useCountries } from '../hooks/useCountries';
import { useLocationsOfGoods } from '../hooks/useLocationsOfGoods';
import type { CreateExportPayload, CreateImportPayload } from '../types';

interface EncodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'import' | 'export';
    onSave: (data: CreateImportPayload | CreateExportPayload) => void;
}

const inputCls =
    'w-full px-4 py-3 bg-input-bg border border-border-strong rounded-lg text-sm font-bold text-text-primary focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all placeholder:text-text-muted';

const labelCls = 'text-[11px] font-black text-text-muted uppercase tracking-widest ml-1';

const selectCls = `${inputCls} appearance-none cursor-pointer`;

export const EncodeModal: React.FC<EncodeModalProps> = ({ isOpen, onClose, type, onSave }) => {
    const isImport = type === 'import';
    const blscFieldId = `${type}-blsc`;
    const refFieldId = `${type}-customs-ref`;
    const clientFieldId = `${type}-client`;
    const blFieldId = `${type}-bill-of-lading`;
    const vesselFieldId = `${type}-vessel`;
    const originCountryFieldId = `${type}-origin-country`;
    const locationOfGoodsFieldId = `${type}-location-of-goods`;
    const destinationCountryFieldId = `${type}-destination-country`;
    const arrivalDateFieldId = `${type}-arrival-date`;
    const departureDateFieldId = `${type}-departure-date`;

    const [ref, setRef] = useState('');
    const [bl, setBl] = useState('');
    const [blsc, setBlsc] = useState('');
    const [clientId, setClientId] = useState<number | ''>('');
    const [arrivalDate, setArrivalDate] = useState('');
    const [departureDate, setDepartureDate] = useState('');
    const [vessel, setVessel] = useState('');
    const [originCountryId, setOriginCountryId] = useState<number | ''>('');
    const [locationOfGoodsId, setLocationOfGoodsId] = useState<number | ''>('');
    const [destinationCountryId, setDestinationCountryId] = useState<number | ''>('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: clients = [], isLoading: loadingClients } = useClients(isImport ? 'importer' : 'exporter');
    const { data: importCountries = [], isLoading: loadingImportCountries } = useCountries('import_origin', isImport);
    const { data: exportCountries = [], isLoading: loadingExportCountries } = useCountries('export_destination', !isImport);
    const { data: locationsOfGoods = [], isLoading: loadingLocationsOfGoods } = useLocationsOfGoods(isImport);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const main = document.getElementById('main-content');
        if (main) {
            main.style.overflow = 'hidden';
        }

        setRef('');
        setBl('');
        setBlsc('');
        setClientId('');
        setArrivalDate('');
        setDepartureDate('');
        setVessel('');
        setOriginCountryId('');
        setLocationOfGoodsId('');
        setDestinationCountryId('');
        setError(null);

        return () => {
            if (main) {
                main.style.overflow = '';
            }
        };
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (clientId === '') {
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            if (isImport) {
                await onSave({
                    customs_ref_no: ref,
                    bl_no: bl,
                    vessel_name: vessel.trim(),
                    selective_color: blsc as 'green' | 'yellow' | 'orange' | 'red',
                    importer_id: clientId as number,
                    ...(originCountryId !== '' && { origin_country_id: originCountryId }),
                    ...(locationOfGoodsId !== '' && { location_of_goods_id: locationOfGoodsId }),
                    arrival_date: arrivalDate,
                } satisfies CreateImportPayload);
            } else {
                await onSave({
                    shipper_id: clientId as number,
                    bl_no: bl,
                    vessel,
                    export_date: departureDate,
                    ...(destinationCountryId !== '' && { destination_country_id: destinationCountryId }),
                } satisfies CreateExportPayload);
            }
            onClose();
        } catch (err: unknown) {
            setError(getApiError(err, 'save transaction'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[150] p-4 overflow-hidden animate-backdrop-in"
            onClick={onClose}
        >
            <div
                className="bg-surface rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-border transition-all animate-modal-in"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ring-4 ring-surface bg-gradient-to-br from-blue-500 to-indigo-600">
                            <Icon name="plus" className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-text-primary">
                                Encode {isImport ? 'Import' : 'Export'}
                            </h3>
                            <p className="text-xs text-text-muted font-medium">
                                Please fill in the details of the new transaction
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-text-muted hover:text-text-secondary hover:bg-hover rounded-lg transition-all"
                    >
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {isImport && (
                            <div className="space-y-2 md:col-span-2">
                                <label htmlFor={blscFieldId} className={labelCls}>BLSC (Selective Color)</label>
                                <div className="relative">
                                    <select
                                        id={blscFieldId}
                                        required
                                        value={blsc}
                                        className={selectCls}
                                        onChange={(event) => setBlsc(event.target.value)}
                                    >
                                        <option value="">Select Color</option>
                                        <option value="green">Green</option>
                                        <option value="yellow">Yellow</option>
                                        <option value="orange">Orange</option>
                                        <option value="red">Red</option>
                                    </select>
                                    <Icon name="chevron-down" className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {isImport && (
                            <div className="space-y-2">
                                <label htmlFor={refFieldId} className={labelCls}>Customs Ref No.</label>
                                <input
                                    id={refFieldId}
                                    required
                                    type="text"
                                    value={ref}
                                    placeholder="e.g. REF-2024-001"
                                    className={inputCls}
                                    onChange={(event) => setRef(event.target.value)}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor={clientFieldId} className={labelCls}>{isImport ? 'Importer' : 'Shipper'}</label>
                            <div className="relative">
                                <select
                                    id={clientFieldId}
                                    required
                                    value={clientId}
                                    className={selectCls}
                                    disabled={loadingClients}
                                    onChange={(event) => setClientId(event.target.value ? Number(event.target.value) : '')}
                                >
                                    <option value="">
                                        {loadingClients ? 'Loading…' : `Select ${isImport ? 'Importer' : 'Shipper'}`}
                                    </option>
                                    {clients.map((client) => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                                <Icon name="chevron-down" className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor={blFieldId} className={labelCls}>Bill of Lading</label>
                            <input
                                id={blFieldId}
                                required
                                type="text"
                                value={bl}
                                placeholder="e.g. BL-78542136"
                                className={inputCls}
                                onChange={(event) => setBl(event.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor={vesselFieldId} className={labelCls}>{isImport ? 'Vessel Name' : 'Vessel'}</label>
                            <input
                                id={vesselFieldId}
                                type="text"
                                value={vessel}
                                placeholder="Enter Vessel Name"
                                className={inputCls}
                                onChange={(event) => setVessel(event.target.value)}
                                required
                            />
                        </div>

                        {isImport && (
                            <div className="space-y-2">
                                <label htmlFor={originCountryFieldId} className={labelCls}>Origin</label>
                                <div className="relative">
                                    <select
                                        id={originCountryFieldId}
                                        value={originCountryId}
                                        className={selectCls}
                                        disabled={loadingImportCountries}
                                        onChange={(event) => setOriginCountryId(event.target.value ? Number(event.target.value) : '')}
                                    >
                                        <option value="">
                                            {loadingImportCountries ? 'Loading…' : 'Select Origin Country'}
                                        </option>
                                        {importCountries.map((country) => (
                                            <option key={country.id} value={country.id}>{country.name}</option>
                                        ))}
                                    </select>
                                    <Icon name="chevron-down" className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {isImport && (
                            <div className="space-y-2">
                                <label htmlFor={locationOfGoodsFieldId} className={labelCls}>Location of Goods</label>
                                <div className="relative">
                                    <select
                                        id={locationOfGoodsFieldId}
                                        value={locationOfGoodsId}
                                        className={selectCls}
                                        disabled={loadingLocationsOfGoods}
                                        onChange={(event) => setLocationOfGoodsId(event.target.value ? Number(event.target.value) : '')}
                                    >
                                        <option value="">
                                            {loadingLocationsOfGoods ? 'Loading…' : 'Select Location of Goods'}
                                        </option>
                                        {locationsOfGoods.map((location) => (
                                            <option key={location.id} value={location.id}>{location.name}</option>
                                        ))}
                                    </select>
                                    <Icon name="chevron-down" className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {!isImport && (
                            <div className="space-y-2">
                                <label htmlFor={departureDateFieldId} className={labelCls}>Departure Date</label>
                                <input
                                    id={departureDateFieldId}
                                    required
                                    type="date"
                                    value={departureDate}
                                    className={inputCls}
                                    onChange={(event) => setDepartureDate(event.target.value)}
                                />
                            </div>
                        )}

                        {!isImport && (
                            <div className="space-y-2 md:col-span-2">
                                <label htmlFor={destinationCountryFieldId} className={labelCls}>Port of Destination</label>
                                <div className="relative">
                                    <select
                                        id={destinationCountryFieldId}
                                        required
                                        value={destinationCountryId}
                                        className={selectCls}
                                        disabled={loadingExportCountries}
                                        onChange={(event) => setDestinationCountryId(event.target.value ? Number(event.target.value) : '')}
                                    >
                                        <option value="">
                                            {loadingExportCountries ? 'Loading…' : 'Select Destination Country'}
                                        </option>
                                        {exportCountries.map((country) => (
                                            <option key={country.id} value={country.id}>{country.name}</option>
                                        ))}
                                    </select>
                                    <Icon name="chevron-down" className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {isImport && (
                            <div className="space-y-2 md:col-span-2">
                                <label htmlFor={arrivalDateFieldId} className={labelCls}>Arrival Date</label>
                                <input
                                    id={arrivalDateFieldId}
                                    required
                                    type="date"
                                    value={arrivalDate}
                                    className={inputCls}
                                    onChange={(event) => setArrivalDate(event.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="flex-1 px-6 py-4 bg-surface-secondary border border-border-strong text-text-secondary rounded-lg text-sm font-bold hover:bg-hover transition-all active:scale-95 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-6 py-4 text-white rounded-lg text-sm font-bold transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90"
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                                    Saving…
                                </>
                            ) : (
                                <>
                                    <Icon name="check-circle" className="w-4 h-4" />
                                    Encode
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
