import React, { useEffect, useState } from 'react';
import { Icon } from '../../../../components/Icon';
import { useClients } from '../../hooks/useClients';
import { useCountries } from '../../hooks/useCountries';
import type { CreateExportPayload, CreateImportPayload } from '../../types';

interface EncodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'import' | 'export';
    onSave: (data: CreateImportPayload | CreateExportPayload) => void;
}

export const EncodeModal: React.FC<EncodeModalProps> = ({ isOpen, onClose, type, onSave }) => {
    const isImport = type === 'import';

    // Form state
    const [ref, setRef] = useState('');
    const [bl, setBl] = useState('');
    const [blsc, setBlsc] = useState('');
    const [clientId, setClientId] = useState<number | ''>('');
    const [arrivalDate, setArrivalDate] = useState('');
    const [vessel, setVessel] = useState('');
    const [destinationCountryId, setDestinationCountryId] = useState<number | ''>('');

    // TanStack Query hooks for dropdown data
    const { data: clients = [], isLoading: loadingClients } = useClients(isImport ? 'importer' : 'exporter', isOpen);
    const { data: countries = [], isLoading: loadingCountries } = useCountries('export_destination', isOpen && !isImport);

    // Submission state
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Scroll lock and form reset when modal opens
    useEffect(() => {
        if (isOpen) {
            // Lock background scroll (scrollbar-gutter in MainLayout handles the shift)
            const mainElement = document.getElementById('main-content');
            if (mainElement) {
                mainElement.style.overflow = 'hidden';
            }

            // Reset form
            setRef('');
            setBl('');
            setBlsc('');
            setClientId('');
            setArrivalDate('');
            setVessel('');
            setDestinationCountryId('');
            setError(null);
        }

        return () => {
            const mainElement = document.getElementById('main-content');
            if (mainElement) {
                mainElement.style.overflow = '';
            }
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // ── Inline validation ────────────────────────────────────────────────────
    const blTrimmed = bl.trim();
    const blLongEnough = blTrimmed.length >= 4;
    const blFormatValid = /^[A-Za-z0-9-]*$/.test(blTrimmed);
    const vesselValid = !isImport ? vessel.trim().length >= 2 : true;
    const hasClient = clientId !== '';
    const hasBlsc = isImport ? blsc !== '' : true;
    const hasCountry = isImport || destinationCountryId !== '';
    const hasArrival = !isImport || arrivalDate !== '';
    const canSubmit = hasClient && blLongEnough && blFormatValid && hasBlsc && hasCountry && hasArrival && vesselValid && !submitting;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setSubmitting(true);
        setError(null);

        try {
            if (isImport) {
                const payload: CreateImportPayload = {
                    customs_ref_no: ref,
                    bl_no: bl,
                    selective_color: blsc as 'green' | 'yellow' | 'red',
                    importer_id: clientId,
                    arrival_date: arrivalDate,
                };
                await onSave(payload);
            } else {
                const payload: CreateExportPayload = {
                    shipper_id: clientId,
                    bl_no: bl,
                    vessel: vessel,
                    ...(destinationCountryId !== '' && { destination_country_id: destinationCountryId }),
                };
                await onSave(payload);
            }
            onClose();
        } catch (err: unknown) {
            const msg =
                err instanceof Error
                    ? err.message
                    : 'Failed to save transaction. Please try again.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const blscOptions = [
        { value: 'green', label: 'Green' },
        { value: 'yellow', label: 'Yellow' },
        { value: 'red', label: 'Red' },
    ];

    const inputClass =
        'w-full px-4 py-3 bg-input-bg border border-border-strong rounded-lg text-sm font-bold text-text-primary focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all placeholder:text-text-muted';

    const labelClass =
        'text-[11px] font-black text-text-muted uppercase tracking-widest ml-1';

    const selectClass = `${inputClass} appearance-none cursor-pointer`;

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[150] p-4 overflow-hidden"
            onClick={onClose}
        >
            <div
                className="bg-surface rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border border-border transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ring-4 ring-surface" style={{ backgroundColor: '#0a84ff' }}>
                            <Icon name="plus" className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-text-primary transition-colors">
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
                    {/* Error Banner */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Import Only: BLSC (Selective Color) */}
                        {isImport && (
                            <div className="space-y-2 md:col-span-2">
                                <label className={labelClass}>BLSC (Selective Color)</label>
                                <div className="relative">
                                    <select
                                        required
                                        value={blsc}
                                        className={selectClass}
                                        onChange={(e) => setBlsc(e.target.value)}
                                    >
                                        <option value="">Select Color</option>
                                        {blscOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <Icon name="chevron-down" className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {/* Import Only: Customs Ref No (required, validated) */}
                        {isImport && (
                            <div className="space-y-2">
                                <label className={labelClass}>Customs Ref No. <span className="text-red-400">*</span></label>
                                <input
                                    required
                                    type="text"
                                    maxLength={50}
                                    pattern="[A-Za-z0-9\-\/]+"
                                    value={ref}
                                    placeholder="e.g. REF-2024-001"
                                    className={inputClass}
                                    onChange={(e) => setRef(e.target.value)}
                                />
                                {ref.length > 0 && !/^[A-Za-z0-9\-\/]+$/.test(ref) && (
                                    <p className="text-[10px] text-red-400 ml-1 font-semibold">Only letters, numbers, hyphens, and slashes allowed</p>
                                )}
                            </div>
                        )}

                        {/* Client Dropdown */}
                        <div className="space-y-2">
                            <label className={labelClass}>
                                {isImport ? 'Importer' : 'Shipper'}
                            </label>
                            <div className="relative">
                                <select
                                    required
                                    value={clientId}
                                    className={selectClass}
                                    onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : '')}
                                    disabled={loadingClients}
                                >
                                    <option value="">
                                        {loadingClients ? 'Loading...' : `Select ${isImport ? 'Importer' : 'Shipper'}`}
                                    </option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                                <Icon name="chevron-down" className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Bill of Lading — min 4 chars, alphanumeric + hyphen */}
                        <div className="space-y-2">
                            <label className={labelClass}>Bill of Lading <span className="text-red-400">*</span></label>
                            <input
                                required
                                type="text"
                                minLength={4}
                                maxLength={50}
                                pattern="[A-Za-z0-9\-]+"
                                value={bl}
                                placeholder="e.g. MAEU123456789"
                                className={inputClass}
                                onChange={(e) => setBl(e.target.value)}
                            />
                            {blTrimmed.length > 0 && blTrimmed.length < 4 && (
                                <p className="text-[10px] text-red-400 ml-1 font-semibold">Must be at least 4 characters</p>
                            )}
                            {blTrimmed.length >= 4 && !blFormatValid && (
                                <p className="text-[10px] text-red-400 ml-1 font-semibold">Only letters, numbers, and hyphens allowed</p>
                            )}
                        </div>

                        {/* Export Only: Vessel */}
                        {!isImport && (
                            <div className="space-y-2">
                                <label className={labelClass}>Vessel <span className="text-red-400">*</span></label>
                                <input
                                    required
                                    type="text"
                                    minLength={2}
                                    maxLength={100}
                                    value={vessel}
                                    placeholder="Enter Vessel Name"
                                    className={inputClass}
                                    onChange={(e) => setVessel(e.target.value)}
                                />
                                {vessel.length > 0 && vessel.trim().length < 2 && (
                                    <p className="text-[10px] text-red-400 ml-1 font-semibold">Must be at least 2 characters</p>
                                )}
                            </div>
                        )}

                        {/* Export Only: Port of Destination */}
                        {!isImport && (
                            <div className="space-y-2 md:col-span-2">
                                <label className={labelClass}>Port of Destination</label>
                                <div className="relative">
                                    <select
                                        required
                                        value={destinationCountryId}
                                        className={selectClass}
                                        onChange={(e) => setDestinationCountryId(e.target.value ? Number(e.target.value) : '')}
                                        disabled={loadingCountries}
                                    >
                                        <option value="">
                                            {loadingCountries ? 'Loading...' : 'Select Destination Country'}
                                        </option>
                                        {countries.map(country => (
                                            <option key={country.id} value={country.id}>{country.name}</option>
                                        ))}
                                    </select>
                                    <Icon name="chevron-down" className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {/* Import Only: Arrival Date */}
                        {isImport && (
                            <div className="space-y-2 md:col-span-2">
                                <label className={labelClass}>Arrival Date <span className="text-red-400">*</span></label>
                                <input
                                    required
                                    type="date"
                                    value={arrivalDate}
                                    min="2000-01-01"
                                    className={inputClass}
                                    onChange={(e) => setArrivalDate(e.target.value)}
                                />
                                <p className="text-[10px] text-text-muted ml-1">Expected vessel arrival date (ETA)</p>
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
                            disabled={!canSubmit}
                            className="flex-1 px-6 py-4 text-white rounded-lg text-sm font-bold transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-90"
                            style={{ backgroundColor: '#0a84ff' }}
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                                    Saving...
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
