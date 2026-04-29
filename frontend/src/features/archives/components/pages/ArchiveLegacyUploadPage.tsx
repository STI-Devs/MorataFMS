import React from 'react';

import { ConfirmationModal } from '../../../../components/ConfirmationModal';
import { Icon } from '../../../../components/Icon';
import { MAX_MULTI_UPLOAD_FILES } from '../../../../lib/uploads';
import { useAuth } from '../../../auth';
import { StageUploadRow } from '../../../documents/components/StageUploadRow';
import { BLSC_OPTIONS } from '../../../documents/types/document.types';
import { useArchiveLegacyUploadForm } from '../../hooks/useArchiveLegacyUploadForm';
import type { ArchiveUploadSuccessTarget } from '../../utils/archive.utils';
import {
    EMPTY_STAGE_UPLOAD,
    canArchiveUploaderMarkStageNotApplicable,
    getStageSupportText,
} from '../../utils/legacyUploadForm.utils';
import { ArchiveTypeCard } from '../workspace/ArchiveTypeCard';

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

interface Props {
    defaultYear?: number;
    onBack: () => void;
    onSubmit: (target: ArchiveUploadSuccessTarget) => Promise<void> | void;
}

export const ArchiveLegacyUploadPage: React.FC<Props> = ({ defaultYear = 2024, onBack, onSubmit }) => {
    const { user } = useAuth();
    const {
        form,
        set,
        stageUploads,
        setStageUpload,
        isImport,
        isSubmitting,
        error,
        successTarget,
        setSuccessTarget,
        dateMode,
        monthYear,
        handleMonthYearChange,
        handleDateModeChange,
        handleExactDateChange,
        clients,
        selectedClientId,
        handleClientSelect,
        countries,
        selectedCountryId,
        setSelectedCountryId,
        locationsOfGoods,
        selectedLocationOfGoodsId,
        setSelectedLocationOfGoodsId,
        handleTypeChange,
        stages,
        uploadedCount,
        blValid,
        hasStartedDraft,
        canSubmit,
        submissionIssues,
        handleSubmit,
    } = useArchiveLegacyUploadForm({ defaultYear });

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
                                <label className={labelClass}>Customs Ref No.</label>
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
                                <label className={labelClass}>Vessel Name</label>
                                <input
                                    type="text"
                                    value={form.vessel}
                                    onChange={(event) => set('vessel', event.target.value)}
                                    placeholder="e.g. MV Golden Tide"
                                    className={inputClass}
                                />
                            </div>
                        )}

                        {isImport && (
                            <div className="space-y-2">
                                <label className={labelClass}>Location of Goods</label>
                                <div className="relative">
                                    <select
                                        value={selectedLocationOfGoodsId}
                                        onChange={(event) => setSelectedLocationOfGoodsId(Number(event.target.value) || '')}
                                        className={selectClass}
                                    >
                                        <option value="">Select location of goods</option>
                                        {locationsOfGoods.map((location) => (
                                            <option key={location.id} value={location.id}>{location.name}</option>
                                        ))}
                                    </select>
                                    <Icon name="chevron-down" className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        )}

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
                            <div className="relative">
                                <select
                                    value={selectedClientId}
                                    onChange={handleClientSelect}
                                    className={selectClass}
                                >
                                    <option value="">Select {isImport ? 'importer' : 'shipper'}</option>
                                    {clients.map((client) => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                                <Icon name="chevron-down" className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            <p className="mt-1.5 text-xs font-semibold text-text-muted">Not in list? Contact Admin</p>
                        </div>

                        {!isImport && (
                            <div className="space-y-2">
                                <label className={labelClass}>Vessel</label>
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
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-700">Archive Workflow</p>
                        <p className="mt-2 text-sm font-semibold text-amber-950">
                            You can save this archive with only the files currently on hand.
                        </p>
                        <p className="mt-1 text-xs text-amber-800">
                            Missing processor- or accounting-owned files can be added later from their archive task pages.
                        </p>
                    </div>
                    <div className="space-y-3">
                        {stages.map((stage) => (
                            <StageUploadRow
                                key={stage.key}
                                stageKey={stage.key}
                                label={stage.label}
                                upload={stageUploads[stage.key] ?? EMPTY_STAGE_UPLOAD}
                                allowNotApplicable={stage.optional === true && canArchiveUploaderMarkStageNotApplicable(form.type, stage.key, user?.role)}
                                supportingText={getStageSupportText(form.type, stage.key) ?? undefined}
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

                {hasStartedDraft && !canSubmit && submissionIssues.length > 0 && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">Before You Save</p>
                        <ul className="mt-2 space-y-1.5 text-sm text-blue-950">
                            {submissionIssues.map((issue) => (
                                <li key={issue} className="flex items-start gap-2">
                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600" />
                                    <span>{issue}</span>
                                </li>
                            ))}
                        </ul>
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
