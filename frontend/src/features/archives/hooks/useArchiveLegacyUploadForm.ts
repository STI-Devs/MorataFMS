import React, { useEffect, useState } from 'react';

import { MAX_MULTI_UPLOAD_FILES } from '../../../lib/uploads';
import type {
    ArchiveFormState,
    StageUpload,
    TransactionType,
} from '../../documents/types/document.types';
import {
    EXPORT_STAGES,
    IMPORT_STAGES,
} from '../../documents/types/document.types';
import { trackingApi } from '../../tracking/api/trackingApi';
import type { ApiClient, ApiCountry, ApiLocationOfGoods } from '../../tracking/types';
import type { ArchiveUploadSuccessTarget } from '../utils/archive.utils';
import {
    ENCODER_OWNED_OPTIONAL_ARCHIVE_STAGES,
    archiveStageIsResolvedForSave,
    buildSubmissionIssues,
    makeInitialForm,
    resolveFileDate,
} from '../utils/legacyUploadForm.utils';

type DateMode = 'month' | 'exact';

interface UseArchiveLegacyUploadFormArgs {
    defaultYear: number;
}

export function useArchiveLegacyUploadForm({ defaultYear }: UseArchiveLegacyUploadFormArgs) {
    const [form, setForm] = useState<ArchiveFormState>(makeInitialForm(defaultYear));
    const [stageUploads, setStageUploads] = useState<Record<string, StageUpload>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successTarget, setSuccessTarget] = useState<ArchiveUploadSuccessTarget | null>(null);

    const [dateMode, setDateMode] = useState<DateMode>('month');
    const [monthYear, setMonthYear] = useState<string>(`${defaultYear}-01`);

    const [clients, setClients] = useState<ApiClient[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<number | ''>('');

    const [countries, setCountries] = useState<ApiCountry[]>([]);
    const [selectedCountryId, setSelectedCountryId] = useState<number | ''>('');
    const [locationsOfGoods, setLocationsOfGoods] = useState<ApiLocationOfGoods[]>([]);
    const [selectedLocationOfGoodsId, setSelectedLocationOfGoodsId] = useState<number | ''>('');

    const isImport = form.type === 'import';

    const set = <K extends keyof ArchiveFormState>(key: K, value: ArchiveFormState[K]) =>
        setForm((currentForm) => ({ ...currentForm, [key]: value }));

    useEffect(() => {
        const clientType = isImport ? 'importer' : 'exporter';
        trackingApi.getClients(clientType).then(setClients).catch(() => setClients([]));
        setSelectedClientId('');
        set('client', '');
    }, [isImport]);

    useEffect(() => {
        if (!isImport) {
            trackingApi.getCountries('export_destination').then(setCountries).catch(() => setCountries([]));
        }
    }, [isImport]);

    useEffect(() => {
        if (isImport) {
            trackingApi.getLocationsOfGoods().then(setLocationsOfGoods).catch(() => setLocationsOfGoods([]));
            return;
        }

        setLocationsOfGoods([]);
        setSelectedLocationOfGoodsId('');
    }, [isImport]);

    const setStageUpload = (key: string, next: StageUpload) =>
        setStageUploads((currentUploads) => ({ ...currentUploads, [key]: next }));

    const handleMonthYearChange = (value: string) => {
        setMonthYear(value);
        const year = value ? parseInt(value.split('-')[0], 10) : defaultYear;
        set('year', year);
        set('fileDate', '');
    };

    const handleDateModeChange = (mode: DateMode) => {
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
        setSelectedLocationOfGoodsId('');
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
    const unresolvedOptionalArchiveStages = stages.filter((stage) =>
        ENCODER_OWNED_OPTIONAL_ARCHIVE_STAGES[form.type].has(stage.key)
        && !archiveStageIsResolvedForSave(form.type, stage.key, stageUploads[stage.key]),
    );

    const hasClient = selectedClientId !== '';
    const hasBl = form.bl.trim().length >= 4;
    const blValid = /^[A-Za-z0-9-]+$/.test(form.bl.trim());
    const hasCountry = isImport || selectedCountryId !== '';
    const hasBlsc = !isImport || form.blsc !== '';
    const hasDate = dateMode === 'month' ? monthYear.length > 0 : form.fileDate.length > 0;
    const hasStartedDraft = uploadedCount > 0
        || form.bl.trim().length > 0
        || selectedClientId !== ''
        || selectedCountryId !== ''
        || dateMode === 'exact';

    const canSubmit = hasClient
        && hasBl
        && blValid
        && hasCountry
        && hasBlsc
        && hasDate
        && uploadedCount > 0
        && unresolvedOptionalArchiveStages.length === 0
        && !hasInvalidStageUpload
        && !isSubmitting;

    const submissionIssues = buildSubmissionIssues({
        isImport,
        dateMode,
        hasClient,
        hasBl,
        hasCountry,
        hasBlsc,
        hasDate,
        blValid,
        blTrimmedLength: form.bl.trim().length,
        uploadedCount,
        unresolvedOptionalArchiveStages,
        hasInvalidStageUpload,
    });

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!canSubmit) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const clientId = Number(selectedClientId);

            const { fileDate, year, month } = resolveFileDate(dateMode, form.fileDate, monthYear);

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
                    vessel_name: form.vessel || undefined,
                    selective_color: (form.blsc as 'green' | 'yellow' | 'orange' | 'red') || 'green',
                    importer_id: clientId,
                    location_of_goods_id: selectedLocationOfGoodsId === '' ? undefined : Number(selectedLocationOfGoodsId),
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

                if (response.status === 422) {
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

    return {
        // form state
        form,
        set,
        stageUploads,
        setStageUpload,
        isImport,
        // submission state
        isSubmitting,
        error,
        successTarget,
        setSuccessTarget,
        // date mode
        dateMode,
        monthYear,
        handleMonthYearChange,
        handleDateModeChange,
        handleExactDateChange,
        // selections
        clients,
        selectedClientId,
        handleClientSelect,
        countries,
        selectedCountryId,
        setSelectedCountryId,
        locationsOfGoods,
        selectedLocationOfGoodsId,
        setSelectedLocationOfGoodsId,
        // type change
        handleTypeChange,
        // derived data
        stages,
        uploadedCount,
        blValid,
        hasStartedDraft,
        canSubmit,
        submissionIssues,
        // submit
        handleSubmit,
    };
}
