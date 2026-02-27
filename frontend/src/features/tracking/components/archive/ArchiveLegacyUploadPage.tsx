import React, { useEffect, useState } from 'react';
import { Icon } from '../../../../components/Icon';
import { trackingApi } from '../../api/trackingApi';
import type { ApiClient, ApiCountry, DocumentableType } from '../../types';
import type {
    ArchiveFormState,
    StageUpload,
    TransactionType,
} from '../../types/document.types';
import {
    BLSC_OPTIONS,
    EXPORT_STAGES,
    IMPORT_STAGES
} from '../../types/document.types';
import { StageUploadRow } from '../documents/StageUploadRow';
import { ArchiveTypeCard } from './ArchiveTypeCard';

// ─── Style tokens ─────────────────────────────────────────────────────────────

const inputClass =
    'w-full px-4 py-3 bg-input-bg border border-border-strong rounded-lg text-sm font-bold text-text-primary focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all placeholder:text-text-muted';

const selectClass = `${inputClass} appearance-none cursor-pointer`;

const labelClass =
    'text-[11px] font-black text-text-muted uppercase tracking-widest ml-1';

// ─── Section header ────────────────────────────────────────────────────────────

const SectionHeader = ({ step, label }: { step: number; label: string }) => (
    <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-surface-secondary border border-border-strong">
            <span className="text-xs font-black text-text-muted">{step}</span>
        </div>
        <h3 className="text-xs font-black text-text-muted uppercase tracking-widest">{label}</h3>
        <div className="flex-1 h-px bg-border" />
    </div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_STAGE_UPLOAD: StageUpload = { file: null };

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

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
    defaultYear?: number;
    onBack: () => void;
    onSubmit: () => void;
}

export const ArchiveLegacyUploadPage: React.FC<Props> = ({ defaultYear = 2024, onBack, onSubmit }) => {
    const [form, setForm]               = useState<ArchiveFormState>(makeInitialForm(defaultYear));
    const [stageUploads, setStageUploads] = useState<Record<string, StageUpload>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError]             = useState<string | null>(null);

    // Smart date picker mode: 'month' = month-only precision, 'exact' = full date
    const [dateMode, setDateMode] = useState<'month' | 'exact'>('month');

    // Month-year picker (determines the year used for S3 path)
    const [monthYear, setMonthYear] = useState<string>(`${defaultYear}-01`);

    const handleMonthYearChange = (val: string) => {
        setMonthYear(val);
        const y = val ? parseInt(val.split('-')[0], 10) : defaultYear;
        set('year', y);
        set('fileDate', ''); // Clear exact date when period changes
    };

    // When switching to exact mode, derive initial date from month picker
    // When switching to month mode, derive monthYear from exact date
    const handleDateModeChange = (mode: 'month' | 'exact') => {
        if (mode === 'exact' && monthYear) {
            // Pre-fill with first day of selected month
            set('fileDate', `${monthYear}-01`);
        } else if (mode === 'month' && form.fileDate) {
            // Derive monthYear from exact date
            const d = new Date(form.fileDate + 'T00:00:00');
            const my = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            setMonthYear(my);
            set('year', d.getFullYear());
            set('fileDate', '');
        }
        setDateMode(mode);
    };

    // Handle exact date change — also keep monthYear in sync
    const handleExactDateChange = (val: string) => {
        set('fileDate', val);
        if (val) {
            const d = new Date(val + 'T00:00:00');
            const my = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            setMonthYear(my);
            set('year', d.getFullYear());
        }
    };

    // Client dropdown state
    const [clients, setClients]         = useState<ApiClient[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<number | ''>('');
    const [useCustomClient, setUseCustomClient]   = useState(false);

    // Country dropdown for exports
    const [countries, setCountries]     = useState<ApiCountry[]>([]);
    const [selectedCountryId, setSelectedCountryId] = useState<number | ''>('');

    const isImport = form.type === 'import';

    // Fetch clients when type changes
    useEffect(() => {
        const clientType = isImport ? 'importer' : 'exporter';
        trackingApi.getClients(clientType).then(setClients).catch(() => setClients([]));
        setSelectedClientId('');
        setUseCustomClient(false);
        set('client', '');
    }, [isImport]);

    // Fetch countries for exports
    useEffect(() => {
        if (!isImport) {
            trackingApi.getCountries('export_destination').then(setCountries).catch(() => setCountries([]));
        }
    }, [isImport]);

    const set = <K extends keyof ArchiveFormState>(key: K, value: ArchiveFormState[K]) =>
        setForm(f => ({ ...f, [key]: value }));

    const setStageUpload = (key: string, next: StageUpload) =>
        setStageUploads(prev => ({ ...prev, [key]: next }));

    const handleTypeChange = (t: TransactionType) => {
        set('type', t);
        setStageUploads({});
        setSelectedCountryId('');
    };

    const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = Number(e.target.value);
        setSelectedClientId(id || '');
        const found = clients.find(c => c.id === id);
        set('client', found?.name ?? '');
    };

    const stages       = isImport ? IMPORT_STAGES : EXPORT_STAGES;
    const uploadedCount = Object.values(stageUploads).filter(u => u.file !== null).length;

    // ── Validation ────────────────────────────────────────────────────────────
    const hasClient  = useCustomClient ? form.client.trim().length > 0 : selectedClientId !== '';
    const hasBl      = form.bl.trim().length >= 4;
    const blValid    = /^[A-Za-z0-9-]+$/.test(form.bl.trim());
    const hasCountry = isImport || selectedCountryId !== '';
    const hasBlsc    = !isImport || form.blsc !== '';
    const hasDate    = dateMode === 'month' ? monthYear.length > 0 : form.fileDate.length > 0;

    const canSubmit  = hasClient && hasBl && blValid && hasCountry && hasBlsc && hasDate && uploadedCount > 0 && !isSubmitting;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // 1. Resolve client ID — create new client if using custom name
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

            // 2. Create the transaction via the dedicated archive endpoint
            // (backend enforces file_date must be past-or-today — cannot be bypassed)
            let transactionId: number;
            let documentableType: DocumentableType;

            // Derive file_date based on date mode
            const [y, m] = monthYear.split('-').map(Number);
            let fileDate: string;
            if (dateMode === 'exact' && form.fileDate) {
                // User provided an exact date
                fileDate = form.fileDate;
            } else {
                // Month mode — last day of month, clamped to today
                const lastDay = new Date(y, m, 0).getDate();
                const today = new Date();
                const isCurrentMonth = y === today.getFullYear() && m === today.getMonth() + 1;
                fileDate = isCurrentMonth
                    ? today.toISOString().split('T')[0]
                    : `${y}-${String(m).padStart(2, '0')}-${lastDay}`;
            }

            if (isImport) {
                const importData = await trackingApi.createArchiveImport({
                    customs_ref_no: form.refNo || undefined,
                    bl_no: form.bl,
                    selective_color: (form.blsc as 'green' | 'yellow' | 'red') || 'green',
                    importer_id: clientId,
                    file_date: fileDate,
                    notes: `Legacy archive (${y})`,
                });
                transactionId = importData.id;
                documentableType = 'App\\Models\\ImportTransaction';
            } else {
                const exportData = await trackingApi.createArchiveExport({
                    bl_no: form.bl,
                    vessel: form.vessel || undefined,
                    shipper_id: clientId,
                    destination_country_id: Number(selectedCountryId),
                    file_date: fileDate,
                    notes: `Legacy archive (${y})`,
                });
                transactionId = exportData.id;
                documentableType = 'App\\Models\\ExportTransaction';
            }


            // 3. Upload all files to S3
            const filesToUpload = Object.entries(stageUploads)
                .filter(([, upload]) => upload.file !== null)
                .map(([stageKey, upload]) => ({
                    file: upload.file!,
                    type: stageKey,
                    documentable_type: documentableType,
                    documentable_id: transactionId,
                }));

            await Promise.all(
                filesToUpload.map(payload => trackingApi.uploadDocument(payload)),
            );

            onSubmit();
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const res = (err as { response: { status: number; data?: { message?: string } } }).response;
                if (res.status === 403) {
                    setError('You don\'t have permission to create new clients. Please select from the dropdown or ask a supervisor to add the client first.');
                } else if (res.status === 422) {
                    const msg = res.data?.message || 'Validation error. Please check your inputs.';
                    setError(msg);
                } else {
                    setError(res.data?.message || 'Upload failed. Please try again.');
                }
            } else {
                const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
                setError(message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 p-4 pb-12">
            {/* Page header */}
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="p-2 text-text-muted hover:text-text-secondary hover:bg-hover rounded-lg transition-all"
                >
                    <Icon name="chevron-left" className="w-5 h-5" />
                </button>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ring-4 ring-surface"
                    style={{ backgroundColor: '#ff9f0a' }}>
                    <Icon name="clock" className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-text-primary">Upload Legacy Document</h2>
                    <p className="text-xs text-text-muted font-medium">Add files from the 2022–2025 physical archive</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* ── 1. Transaction Type ──────────────────────────────────── */}
                <div>
                    <SectionHeader step={1} label="Transaction Type" />
                    <div className="flex flex-col sm:flex-row gap-3">
                        <ArchiveTypeCard type="import" isActive={isImport}  onClick={() => handleTypeChange('import')} />
                        <ArchiveTypeCard type="export" isActive={!isImport} onClick={() => handleTypeChange('export')} />
                    </div>
                </div>

                {/* ── 2. Transaction Details ───────────────────────────────── */}
                <div>
                    <SectionHeader step={2} label="Transaction Details" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                        {/* ── Archive Date — full width ─────────────────────── */}
                        <div className="sm:col-span-2 space-y-2">
                            <label className={labelClass}>Archive Date <span className="text-red-400">*</span></label>
                            {/* Toggle: Month / Exact */}
                            <div className="inline-flex bg-surface-subtle p-1 rounded-lg border border-border">
                                <button type="button"
                                    onClick={() => handleDateModeChange('month')}
                                    className={`px-4 py-1.5 text-xs font-bold tracking-wide transition-all rounded-md border ${
                                        dateMode === 'month'
                                            ? 'bg-white dark:bg-zinc-800 shadow border-green-500 text-text-primary'
                                            : 'border-transparent text-text-muted hover:text-text-primary'
                                    }`}>
                                    Month
                                </button>
                                <button type="button"
                                    onClick={() => handleDateModeChange('exact')}
                                    className={`px-4 py-1.5 text-xs font-bold tracking-wide transition-all rounded-md border ${
                                        dateMode === 'exact'
                                            ? 'bg-white dark:bg-zinc-800 shadow border-green-500 text-text-primary'
                                            : 'border-transparent text-text-muted hover:text-text-primary'
                                    }`}>
                                    Exact Date
                                </button>
                            </div>
                            {/* Month picker */}
                            {dateMode === 'month' && (
                                <>
                                    <div className="max-w-xs">
                                        <input
                                            type="month"
                                            required
                                            value={monthYear}
                                            min="2015-01"
                                            max={(() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`; })()}
                                            onChange={e => handleMonthYearChange(e.target.value)}
                                            className={inputClass}
                                        />
                                    </div>
                                    <p className="text-[10px] text-text-muted ml-1">Select the month and year of the archived document</p>
                                </>
                            )}
                            {/* Exact date picker */}
                            {dateMode === 'exact' && (
                                <>
                                    <div className="max-w-xs">
                                        <input
                                            type="date"
                                            required
                                            value={form.fileDate}
                                            onChange={e => handleExactDateChange(e.target.value)}
                                            min="2015-01-01"
                                            max={new Date().toISOString().split('T')[0]}
                                            className={inputClass}
                                        />
                                    </div>
                                    <p className="text-[10px] text-text-muted ml-1">Enter the exact arrival/export date if known</p>
                                </>
                            )}
                        </div>

                        {/* ── Row 2: Customs Ref No. | Bill of Lading ──────── */}
                        {isImport && (
                            <div className="space-y-2">
                                <label className={labelClass}>Customs Ref No. <span className="normal-case font-normal opacity-60">(optional)</span></label>
                                <input type="text" value={form.refNo} onChange={e => set('refNo', e.target.value)}
                                    placeholder="e.g. IMP-2023-055" className={inputClass} />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className={labelClass}>Bill of Lading <span className="text-red-400">*</span></label>
                            <input type="text" required minLength={4} maxLength={50}
                                pattern="[A-Za-z0-9\-]+"
                                value={form.bl} onChange={e => set('bl', e.target.value)}
                                placeholder="e.g. MAEU123456789" className={inputClass} />
                            {form.bl.length > 0 && form.bl.length < 4 && (
                                <p className="text-[10px] text-red-400 ml-1 font-semibold">Must be at least 4 characters</p>
                            )}
                            {form.bl.length >= 4 && !blValid && (
                                <p className="text-[10px] text-red-400 ml-1 font-semibold">Only letters, numbers, and hyphens allowed</p>
                            )}
                        </div>

                        {/* ── Row 3: BLSC | Importer ───────────────────────── */}
                        {isImport && (
                            <div className="space-y-2">
                                <label className={labelClass}>BLSC (Selective Color) <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <select required value={form.blsc} onChange={e => set('blsc', e.target.value)} className={selectClass}>
                                        {BLSC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                    <Icon name="chevron-down" className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {/* Client — Dropdown with checkbox fallback */}
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
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <Icon name="chevron-down" className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            )}
                            {/* Checkbox: not in list */}
                            <label className="flex items-center gap-2 cursor-pointer mt-1.5 select-none">
                                <input
                                    type="checkbox"
                                    checked={useCustomClient}
                                    onChange={e => {
                                        setUseCustomClient(e.target.checked);
                                        if (!e.target.checked) {
                                            setSelectedClientId('');
                                            set('client', '');
                                        }
                                    }}
                                    className="w-3.5 h-3.5 rounded accent-amber-500 cursor-pointer"
                                />
                                <span className="text-xs text-text-muted font-semibold">Not in list — enter name manually</span>
                            </label>
                            {useCustomClient && (
                                <input
                                    type="text"
                                    required
                                    value={form.client}
                                    onChange={e => set('client', e.target.value)}
                                    placeholder={`Enter ${isImport ? 'importer' : 'shipper'} name`}
                                    className={inputClass}
                                    autoFocus
                                />
                            )}
                        </div>

                        {/* ── Row 4 (export only): Vessel | Destination Country */}
                        {!isImport && (
                            <div className="space-y-2">
                                <label className={labelClass}>Vessel <span className="normal-case font-normal opacity-60">(optional)</span></label>
                                <input type="text" value={form.vessel} onChange={e => set('vessel', e.target.value)}
                                    placeholder="Enter vessel name" className={inputClass} />
                            </div>
                        )}

                        {!isImport && (
                            <div className="space-y-2">
                                <label className={labelClass}>Destination Country <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <select
                                        value={selectedCountryId}
                                        onChange={e => setSelectedCountryId(Number(e.target.value) || '')}
                                        className={selectClass}
                                        required
                                    >
                                        <option value="">Select country</option>
                                        {countries.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <Icon name="chevron-down" className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* ── 3. Stage Documents ───────────────────────────────────── */}
                <div>
                    <SectionHeader step={3} label="Stage Documents" />
                    <p className="text-xs text-text-muted mb-4 -mt-2 ml-1">
                        Attach a file to each stage that has a document to archive.
                        {uploadedCount > 0 && (
                            <span
                                className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{ backgroundColor: 'rgba(255,159,10,0.12)', color: '#ff9f0a' }}
                            >
                                {uploadedCount} file{uploadedCount !== 1 ? 's' : ''} attached
                            </span>
                        )}
                    </p>
                    <div className="space-y-3">
                        {stages.map(s => (
                            <StageUploadRow
                                key={s.key}
                                stageKey={s.key}
                                label={s.label}
                                upload={stageUploads[s.key] ?? EMPTY_STAGE_UPLOAD}
                                onChange={next => setStageUpload(s.key, next)}
                            />
                        ))}
                    </div>
                </div>

                {/* ── Actions ──────────────────────────────────────────────── */}
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
                        className="flex-1 px-6 py-4 text-white rounded-lg text-sm font-bold transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-90"
                        style={{ backgroundColor: '#ff9f0a' }}
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
        </div>
    );
};
