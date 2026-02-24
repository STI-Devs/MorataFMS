import React, { useState } from 'react';
import { Icon } from '../../../../components/Icon';
import { trackingApi } from '../../api/trackingApi';
import type { DocumentableType } from '../../types';
import type {
    ArchiveFormState,
    StageUpload,
    TransactionType,
} from '../../types/document.types';
import {
    ARCHIVE_YEARS,
    BLSC_OPTIONS,
    EXPORT_STAGES,
    IMPORT_STAGES,
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
    blsc: '',
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

    const set = <K extends keyof ArchiveFormState>(key: K, value: ArchiveFormState[K]) =>
        setForm(f => ({ ...f, [key]: value }));

    const setStageUpload = (key: string, next: StageUpload) =>
        setStageUploads(prev => ({ ...prev, [key]: next }));

    const handleTypeChange = (t: TransactionType) => {
        set('type', t);
        setStageUploads({});
    };

    const isImport     = form.type === 'import';
    const stages       = isImport ? IMPORT_STAGES : EXPORT_STAGES;
    const uploadedCount = Object.values(stageUploads).filter(u => u.file !== null).length;
    const canSubmit    = form.client.trim() !== '' && uploadedCount > 0 && !isSubmitting;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // 1. Create the transaction first
            let transactionId: number;
            let documentableType: DocumentableType;

            if (isImport) {
                // For archive imports, create a basic import transaction
                const clientsData = await trackingApi.getClients('importer');
                const matchedClient = clientsData.find(
                    c => c.name.toLowerCase() === form.client.toLowerCase(),
                );

                const importData = await trackingApi.createImport({
                    customs_ref_no: form.refNo || `ARCH-${form.year}-${Date.now().toString(36).toUpperCase()}`,
                    bl_no: form.bl || 'N/A',
                    selective_color: (form.blsc as 'green' | 'yellow' | 'red') || 'green',
                    importer_id: matchedClient?.id ?? 0,
                    arrival_date: form.fileDate || `${form.year}-01-01`,
                    notes: `Legacy archive (${form.year})`,
                });
                transactionId = importData.id;
                documentableType = 'App\\Models\\ImportTransaction';
            } else {
                const clientsData = await trackingApi.getClients('exporter');
                const matchedClient = clientsData.find(
                    c => c.name.toLowerCase() === form.client.toLowerCase(),
                );

                const exportData = await trackingApi.createExport({
                    bl_no: form.bl || 'N/A',
                    vessel: form.vessel || 'N/A',
                    shipper_id: matchedClient?.id ?? 0,
                    notes: `Legacy archive (${form.year})`,
                });
                transactionId = exportData.id;
                documentableType = 'App\\Models\\ExportTransaction';
            }

            // 2. Upload all files to S3
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
            const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
            setError(message);
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

                        <div className="space-y-2">
                            <label className={labelClass}>Year</label>
                            <div className="relative">
                                <select value={form.year} onChange={e => set('year', Number(e.target.value))} className={selectClass}>
                                    {ARCHIVE_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <Icon name="chevron-down" className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {isImport && (
                            <div className="space-y-2">
                                <label className={labelClass}>BLSC (Selective Color)</label>
                                <div className="relative">
                                    <select value={form.blsc} onChange={e => set('blsc', e.target.value)} className={selectClass}>
                                        <option value="">Select Color</option>
                                        {BLSC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                    <Icon name="chevron-down" className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {isImport && (
                            <div className="space-y-2">
                                <label className={labelClass}>Customs Ref No. <span className="normal-case font-normal opacity-60">(optional)</span></label>
                                <input type="text" value={form.refNo} onChange={e => set('refNo', e.target.value)}
                                    placeholder="e.g. IMP-2023-055" className={inputClass} />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className={labelClass}>{isImport ? 'Importer' : 'Shipper'}</label>
                            <input type="text" required value={form.client} onChange={e => set('client', e.target.value)}
                                placeholder={`Enter ${isImport ? 'importer' : 'shipper'} name`} className={inputClass} />
                        </div>

                        <div className="space-y-2">
                            <label className={labelClass}>Bill of Lading <span className="normal-case font-normal opacity-60">(optional)</span></label>
                            <input type="text" value={form.bl} onChange={e => set('bl', e.target.value)}
                                placeholder="e.g. BL-78542136" className={inputClass} />
                        </div>

                        {!isImport && (
                            <div className="space-y-2">
                                <label className={labelClass}>Vessel <span className="normal-case font-normal opacity-60">(optional)</span></label>
                                <input type="text" value={form.vessel} onChange={e => set('vessel', e.target.value)}
                                    placeholder="Enter vessel name" className={inputClass} />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className={labelClass}>File Date <span className="normal-case font-normal opacity-60">(optional)</span></label>
                            <input type="date" value={form.fileDate} onChange={e => set('fileDate', e.target.value)} className={inputClass} />
                        </div>
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
