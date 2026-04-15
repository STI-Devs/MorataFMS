import React, { useEffect, useState } from 'react';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { Icon } from '../../../components/Icon';
import { MAX_MULTI_UPLOAD_FILES } from '../../../lib/uploads';
import { StageUploadRow } from '../../documents/components/StageUploadRow';
import type {
    ArchiveFormState,
    StageUpload,
    TransactionType,
} from '../../documents/types/document.types';
import {
    BLSC_OPTIONS,
    EXPORT_STAGES,
    IMPORT_STAGES,
} from '../../documents/types/document.types';
import { trackingApi } from '../../tracking/api/trackingApi';
import type { ApiClient, ApiCountry } from '../../tracking/types';
import type { ArchiveUploadSuccessTarget } from '../utils/archive.utils';
import { ArchiveTypeCard } from './ArchiveTypeCard';

const inputClass =
    'w-full px-4 py-3 bg-input-bg border border-border-strong rounded-lg text-sm font-bold text-text-primary focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all placeholder:text-text-muted';

const selectClass = `${inputClass} appearance-none cursor-pointer`;

const labelClass =
    'text-[11px] font-black text-text-muted uppercase tracking-widest ml-1';

const SectionHeader = ({ step, label }: { step: number; label: string }) => (
    <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-surface-secondary border border-border-strong">
            <span className="text-xs font-black text-text-muted">{step}</span>
        </div>
        <h3 className="text-xs font-black text-text-muted uppercase tracking-widest">{label}</h3>
        <div className="flex-1 h-px bg-border" />
    </div>
);

const EMPTY_STAGE_UPLOAD: StageUpload = { files: [], notApplicable: false };

const makeInitialForm = (year: number): ArchiveFormState => ({
    type: 'import',
    year,
    blsc: 'green',
    refNo: '',
    bl: '',
    vessel: '',
    client: '',
    fileDate: '',
});

interface Props {
    defaultYear?: number;
    onBack: () => void;
    onSubmit: (target: ArchiveUploadSuccessTarget) => Promise<void> | void;
}

export const ArchiveLegacyUploadPage: React.FC<Props> = ({ defaultYear = 2024, onBack, onSubmit }) => {
    const [form, setForm] = useState<ArchiveFormState>(makeInitialForm(defaultYear));
    const [stageUploads, setStageUploads] = useState<Record<string, StageUpload>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successTarget, setSuccessTarget] = useState<ArchiveUploadSuccessTarget | null>(null);

    const [dateMode, setDateMode] = useState<'month' | 'exact'>('month');
    const [monthYear, setMonthYear] = useState<string>(`${defaultYear}-01`);

    const [clients, setClients] = useState<ApiClient[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<number | ''>('');
    const [useCustomClient, setUseCustomClient] = useState(false);

    const [countries, setCountries] = useState<ApiCountry[]>([]);
    const [selectedCountryId, setSelectedCountryId] = useState<number | ''>('');

    const isImport = form.type === 'import';

    useEffect(() => {
        const clientType = isImport ? 'importer' : 'exporter';
        trackingApi.getClients(clientType).then(setClients).catch(() => setClients([]));
        setSelectedClientId('');
        setUseCustomClient(false);
        set('client', '');
    }, [isImport]);

    useEffect(() => {
        if (!isImport) {
            trackingApi.getCountries('export_destination').then(setCountries).catch(() => setCountries([]));
        }
    }, [isImport]);

    const set = <K extends keyof ArchiveFormState>(key: K, value: ArchiveFormState[K]) =>
        setForm((currentForm) => ({ ...currentForm, [key]: value }));

    const setStageUpload = (key: string, next: StageUpload) =>
        setStageUploads((currentUploads) => ({ ...currentUploads, [key]: next }));

    const handleMonthYearChange = (value: string) => {
        setMonthYear(value);
        const year = value ? parseInt(value.split('-')[0], 10) : defaultYear;
        set('year', year);
        set('fileDate', '');
    };

    const handleDateModeChange = (mode: 'month' | 'exact') => {
        if (mode === 'exact' && monthYear) {
            set('fileDate', `${monthYear}-01`);
        } else if (mode === 'month' && form.fileDate) {
            const exactDate = new Date(`${form.fileDate}T00:00:00`);
            const nextMonthYear = `${exactDate.getFullYear()}-${String(exactDate.getMonth() + 1).padStart(2, '0')}`;
            setMonthYear(nextMonthYear);
            set('year', exactDate.getFullYear());
            set('fileDate', '');
        }

        setDateMode(mode);
    };

    const handleExactDateChange = (value: string) => {
        set('fileDate', value);

        if (!value) {
            return;
        }

        const exactDate = new Date(`${value}T00:00:00`);
        const nextMonthYear = `${exactDate.getFullYear()}-${String(exactDate.getMonth() + 1).padStart(2, '0')}`;
        setMonthYear(nextMonthYear);
        set('year', exactDate.getFullYear());
    };

    const handleTypeChange = (type: TransactionType) => {
        set('type', type);
        setStageUploads({});
        setSelectedCountryId('');
    };

    const handleClientSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const nextClientId = Number(event.target.value);
        setSelectedClientId(nextClientId || '');
        const selectedClient = clients.find((client) => client.id === nextClientId);
        set('client', selectedClient?.name ?? '');
    };

    const stages = isImport ? IMPORT_STAGES : EXPORT_STAGES;
    const uploadedCount = Object.values(stageUploads).reduce((count, upload) => count + upload.files.length, 0);
    const notApplicableStages = Object.entries(stageUploads)
        .filter(([, upload]) => upload.notApplicable)
        .map(([stage]) => stage);
    const hasInvalidStageUpload = Object.values(stageUploads).some(
        (upload) => upload.files.length > MAX_MULTI_UPLOAD_FILES,
    );

    const hasClient = useCustomClient ? form.client.trim().length > 0 : selectedClientId !== '';
    const hasBl = form.bl.trim().length >= 4;
    const blValid = /^[A-Za-z0-9-]+$/.test(form.bl.trim());
    const hasCountry = isImport || selectedCountryId !== '';
    const hasBlsc = !isImport || form.blsc !== '';
    const hasDate = dateMode === 'month' ? monthYear.length > 0 : form.fileDate.length > 0;

    const canSubmit = hasClient
        && hasBl
        && blValid
        && hasCountry
        && hasBlsc
        && hasDate
        && uploadedCount > 0
        && !hasInvalidStageUpload
        && !isSubmitting;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!canSubmit) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            let clientId: number;

            if (useCustomClient) {
                const clientType = isImport ? 'importer' : 'exporter';
                const newClient = await trackingApi.createClient({
                    name: form.client.trim(),
                    type: clientType,
                });
                clientId = newClient.id;
            } else {
                clientId = Number(selectedClientId);
            }

            const [year, month] = monthYear.split('-').map(Number);
            let fileDate: string;

            if (dateMode === 'exact' && form.fileDate) {
                fileDate = form.fileDate;
            } else {
                const lastDay = new Date(year, month, 0).getDate();
                const today = new Date();
                const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
                fileDate = isCurrentMonth
                    ? today.toISOString().split('T')[0]
                    : `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
            }

            const documents = Object.entries(stageUploads).flatMap(([stage, upload]) =>
                upload.files.map((file) => ({
                    file,
                    stage,
                })),
            );

            const transaction = isImport
                ? await trackingApi.createArchiveImportWithDocuments({
                    customs_ref_no: form.refNo || undefined,
                    bl_no: form.bl,
                    selective_color: (form.blsc as 'green' | 'yellow' | 'orange' | 'red') || 'green',
                    importer_id: clientId,
                    file_date: fileDate,
                    notes: `Legacy archive (${year})`,
                    documents,
                    not_applicable_stages: notApplicableStages,
                })
                : await trackingApi.createArchiveExportWithDocuments({
                    bl_no: form.bl,
                    vessel: form.vessel || undefined,
                    shipper_id: clientId,
                    destination_country_id: Number(selectedCountryId),
                    file_date: fileDate,
                    notes: `Legacy archive (${year})`,
                    documents,
                    not_applicable_stages: notApplicableStages,
                });

            setSuccessTarget({
                type: isImport ? 'import' : 'export',
                transactionId: transaction.id,
                blNo: form.bl,
                year,
                month,
                uploadedCount,
            });
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const response = (err as { response: { status: number; data?: { message?: string } } }).response;

                if (response.status === 403) {
                    setError('You don\'t have permission to create new clients. Please select from the dropdown or ask an admin to add the client first.');
                } else if (response.status === 422) {
                    setError(response.data?.message || 'Validation error. Please check your inputs.');
                } else {
                    setError(response.data?.message || 'Upload failed. Please try again.');
                }
            } else {
                setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 p-4 pb-12">
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="shrink-0 p-2 -ml-2 text-text-muted hover:text-text-secondary hover:bg-hover rounded-lg transition-all"
                >
                    <Icon name="chevron-left" className="w-5 h-5" />
                </button>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ring-4 ring-surface bg-gradient-to-br from-blue-600 to-indigo-600">
                    <Icon name="clock" className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-text-primary">Upload Legacy Document</h2>
                    <p className="text-xs text-text-muted font-medium">Add files from the 2022–2025 physical archive</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                    <SectionHeader step={1} label="Transaction Type" />
                    <div className="flex flex-col sm:flex-row gap-3">
                        <ArchiveTypeCard type="import" isActive={isImport} onClick={() => handleTypeChange('import')} />
                        <ArchiveTypeCard type="export" isActive={!isImport} onClick={() => handleTypeChange('export')} />
                    </div>
                </div>

                <div>
                    <SectionHeader step={2} label="Transaction Details" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="sm:col-span-2 space-y-2">
                            <label className={labelClass}>Archive Date <span className="text-red-400">*</span></label>
                            <div className="inline-flex bg-surface-subtle p-1 rounded-lg border border-border">
                                <button
                                    type="button"
                                    onClick={() => handleDateModeChange('month')}
                                    className={`px-4 py-1.5 text-xs font-bold tracking-wide transition-all rounded-md border ${dateMode === 'month'
                                        ? 'bg-white dark:bg-zinc-800 shadow border-green-500 text-text-primary'
                                        : 'border-transparent text-text-muted hover:text-text-primary'
                                    }`}
                                >
                                    Month
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDateModeChange('exact')}
                                    className={`px-4 py-1.5 text-xs font-bold tracking-wide transition-all rounded-md border ${dateMode === 'exact'
                                        ? 'bg-white dark:bg-zinc-800 shadow border-green-500 text-text-primary'
                                        : 'border-transparent text-text-muted hover:text-text-primary'
                                    }`}
                                >
                                    Exact Date
                                </button>
                            </div>
                            {dateMode === 'month' && (
                                <>
                                    <div className="max-w-xs">
                                        <input
                                            type="month"
                                            required
                                            value={monthYear}
                                            min="2015-01"
                                            max={(() => {
                                                const now = new Date();
                                                return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                                            })()}
                                            onChange={(event) => handleMonthYearChange(event.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <p className="text-[10px] text-text-muted ml-1">Select the month and year of the archived document</p>
                                </>
                            )}
                            {dateMode === 'exact' && (
                                <>
                                    <div className="max-w-xs">
                                        <input
                                            type="date"
                                            required
                                            value={form.fileDate}
                                            onChange={(event) => handleExactDateChange(event.target.value)}
                                            min="2015-01-01"
                                            max={new Date().toISOString().split('T')[0]}
                                            className={inputClass}
                                        />
                                    </div>
                                    <p className="text-[10px] text-text-muted ml-1">Enter the exact arrival/export date if known</p>
                                </>
                            )}
                        </div>

                        {isImport && (
                            <div className="space-y-2">
                                <label className={labelClass}>Customs Ref No. <span className="normal-case font-normal opacity-60">(optional)</span></label>
                                <input
                                    type="text"
                                    value={form.refNo}
                                    onChange={(event) => set('refNo', event.target.value)}
                                    placeholder="e.g. IMP-2023-055"
                                    className={inputClass}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className={labelClass}>Bill of Lading <span className="text-red-400">*</span></label>
                            <input
                                type="text"
                                required
                                minLength={4}
                                maxLength={50}
                                pattern="[A-Za-z0-9\\-]+"
                                value={form.bl}
                                onChange={(event) => set('bl', event.target.value)}
                                placeholder="e.g. MAEU123456789"
                                className={inputClass}
                            />
                            {form.bl.length > 0 && form.bl.length < 4 && (
                                <p className="text-[10px] text-red-400 ml-1 font-semibold">Must be at least 4 characters</p>
                            )}
                            {form.bl.length >= 4 && !blValid && (
                                <p className="text-[10px] text-red-400 ml-1 font-semibold">Only letters, numbers, and hyphens allowed</p>
                            )}
                        </div>

                        {isImport && (
                            <div className="space-y-2">
                                <label className={labelClass}>BLSC (Selective Color) <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <select
                                        required
                                        value={form.blsc}
                                        onChange={(event) => set('blsc', event.target.value)}
                                        className={selectClass}
                                    >
                                        {BLSC_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <Icon name="chevron-down" className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className={labelClass}>{isImport ? 'Importer' : 'Shipper'} <span className="text-red-400">*</span></label>
                            {!useCustomClient && (
                                <div className="relative">
                                    <select
                                        value={selectedClientId}
                                        onChange={handleClientSelect}
                                        disabled={useCustomClient}
                                        className={selectClass}
                                    >
                                        <option value="">Select {isImport ? 'importer' : 'shipper'}</option>
                                        {clients.map((client) => (
                                            <option key={client.id} value={client.id}>{client.name}</option>
                                        ))}
                                    </select>
                                    <Icon name="chevron-down" className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            )}
                            <label className="flex items-center gap-2 cursor-pointer mt-1.5 select-none">
                                <input
                                    type="checkbox"
                                    checked={useCustomClient}
                                    onChange={(event) => {
                                        setUseCustomClient(event.target.checked);

                                        if (!event.target.checked) {
                                            setSelectedClientId('');
                                            set('client', '');
                                        }
                                    }}
                                    className="w-3.5 h-3.5 rounded accent-amber-500 cursor-pointer"
                                />
                                <span className="text-xs text-text-muted font-semibold">Not in list - enter name manually</span>
                            </label>
                            {useCustomClient && (
                                <input
                                    type="text"
                                    required
                                    value={form.client}
                                    onChange={(event) => set('client', event.target.value)}
                                    placeholder={`Enter ${isImport ? 'importer' : 'shipper'} name`}
                                    className={inputClass}
                                    autoFocus
                                />
                            )}
                        </div>

                        {!isImport && (
                            <div className="space-y-2">
                                <label className={labelClass}>Vessel <span className="normal-case font-normal opacity-60">(optional)</span></label>
                                <input
                                    type="text"
                                    value={form.vessel}
                                    onChange={(event) => set('vessel', event.target.value)}
                                    placeholder="Enter vessel name"
                                    className={inputClass}
                                />
                            </div>
                        )}

                        {!isImport && (
                            <div className="space-y-2">
                                <label className={labelClass}>Destination Country <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <select
                                        value={selectedCountryId}
                                        onChange={(event) => setSelectedCountryId(Number(event.target.value) || '')}
                                        className={selectClass}
                                        required
                                    >
                                        <option value="">Select country</option>
                                        {countries.map((country) => (
                                            <option key={country.id} value={country.id}>{country.name}</option>
                                        ))}
                                    </select>
                                    <Icon name="chevron-down" className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <SectionHeader step={3} label="Stage Documents" />
                    <p className="text-xs text-text-muted mb-4 -mt-2 ml-1">
                        Attach one or more files to each stage that has documents to archive.
                        <span className="ml-1">Maximum {MAX_MULTI_UPLOAD_FILES} files per stage.</span>
                        {uploadedCount > 0 && (
                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500">
                                {uploadedCount} file{uploadedCount !== 1 ? 's' : ''} attached
                            </span>
                        )}
                    </p>
                    <div className="space-y-3">
                        {stages.map((stage) => (
                            <StageUploadRow
                                key={stage.key}
                                stageKey={stage.key}
                                label={stage.label}
                                upload={stageUploads[stage.key] ?? EMPTY_STAGE_UPLOAD}
                                allowNotApplicable={stage.optional === true}
                                onChange={(next) => setStageUpload(stage.key, next)}
                            />
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <Icon name="alert-circle" className="w-4 h-4 text-red-500 shrink-0" />
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <button
                        type="button"
                        onClick={onBack}
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-4 bg-surface-secondary border border-border-strong text-text-secondary rounded-lg text-sm font-bold hover:bg-hover transition-all active:scale-95 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="flex-1 px-6 py-4 text-white rounded-lg text-sm font-bold transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-90 bg-gradient-to-r from-blue-600 to-indigo-600"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Uploading to S3...
                            </>
                        ) : (
                            <>
                                <Icon name="check-circle" className="w-4 h-4" />
                                Save {uploadedCount > 0 ? `${uploadedCount} File${uploadedCount !== 1 ? 's' : ''}` : ''} to Archive
                            </>
                        )}
                    </button>
                </div>
            </form>

            <ConfirmationModal
                isOpen={successTarget !== null}
                onClose={() => setSuccessTarget(null)}
                onConfirm={async () => {
                    if (!successTarget) {
                        return;
                    }

                    await onSubmit(successTarget);
                }}
                title="Archive Upload Complete"
                message={successTarget
                    ? `${successTarget.uploadedCount} file${successTarget.uploadedCount !== 1 ? 's were' : ' was'} saved to ${successTarget.type} archive record ${successTarget.blNo}.`
                    : ''}
                confirmText="Open Uploaded Record"
                confirmButtonClass="bg-emerald-600 hover:bg-emerald-700"
                hideCancel
                icon="success"
            />
        </div>
    );
};
