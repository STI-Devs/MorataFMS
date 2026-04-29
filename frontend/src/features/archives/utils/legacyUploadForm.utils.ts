import { MAX_MULTI_UPLOAD_FILES } from '../../../lib/uploads';
import type {
    ArchiveFormState,
    StageUpload,
    TransactionType,
} from '../../documents/types/document.types';

export const EMPTY_STAGE_UPLOAD: StageUpload = { files: [], notApplicable: false };

export const PROCESSOR_OWNED_OPTIONAL_ARCHIVE_STAGES: Record<TransactionType, Set<string>> = {
    import: new Set(['ppa', 'port_charges']),
    export: new Set(['dccci']),
};

export const ENCODER_OWNED_OPTIONAL_ARCHIVE_STAGES: Record<TransactionType, Set<string>> = {
    import: new Set(['bonds']),
    export: new Set(['phytosanitary', 'co']),
};

export const makeInitialForm = (year: number): ArchiveFormState => ({
    type: 'import',
    year,
    blsc: 'green',
    refNo: '',
    bl: '',
    vessel: '',
    client: '',
    fileDate: '',
});

export const getStageSupportText = (type: TransactionType, stageKey: string): string | null => {
    if (type === 'import') {
        if (stageKey === 'ppa' || stageKey === 'port_charges') {
            return 'If unavailable now, this can be completed later by processor.';
        }

        if (stageKey === 'billing') {
            return 'If unavailable now, this can be completed later by accounting.';
        }

        return null;
    }

    if (stageKey === 'cil') {
        return 'Certificate of Inspection and Loading for export release. If unavailable now, this can be completed later by processor.';
    }

    if (stageKey === 'billing') {
        return 'If unavailable now, this can be completed later by accounting.';
    }

    return null;
};

export const canArchiveUploaderMarkStageNotApplicable = (
    type: TransactionType,
    stageKey: string,
    userRole?: string,
): boolean => {
    if (userRole === 'admin') {
        return true;
    }

    return !PROCESSOR_OWNED_OPTIONAL_ARCHIVE_STAGES[type].has(stageKey);
};

export const archiveStageIsResolvedForSave = (
    type: TransactionType,
    stageKey: string,
    upload: StageUpload | undefined,
): boolean => {
    if (!ENCODER_OWNED_OPTIONAL_ARCHIVE_STAGES[type].has(stageKey)) {
        return true;
    }

    return (upload?.files.length ?? 0) > 0 || upload?.notApplicable === true;
};

export type SubmissionIssuesInput = {
    isImport: boolean;
    dateMode: 'month' | 'exact';
    hasClient: boolean;
    hasBl: boolean;
    hasCountry: boolean;
    hasBlsc: boolean;
    hasDate: boolean;
    blValid: boolean;
    blTrimmedLength: number;
    uploadedCount: number;
    unresolvedOptionalArchiveStages: { label: string }[];
    hasInvalidStageUpload: boolean;
};

export const buildSubmissionIssues = (input: SubmissionIssuesInput): string[] => {
    const issues = [
        !input.hasClient ? `Select an ${input.isImport ? 'importer' : 'shipper'} from the list.` : null,
        input.blTrimmedLength === 0
            ? 'Enter a Bill of Lading number.'
            : input.blTrimmedLength < 4
                ? 'Bill of Lading must be at least 4 characters.'
                : !input.blValid
                    ? 'Bill of Lading may only contain letters, numbers, and hyphens.'
                    : null,
        !input.hasBlsc ? 'Select a BLSC color.' : null,
        !input.hasDate ? `Select an archive ${input.dateMode === 'month' ? 'month' : 'date'}.` : null,
        !input.hasCountry ? 'Select a destination country.' : null,
        input.uploadedCount === 0 ? 'Attach at least one file to save the archive record.' : null,
        ...input.unresolvedOptionalArchiveStages.map(
            (stage) => `Upload files for ${stage.label} or mark it as N/A before saving the archive.`,
        ),
        input.hasInvalidStageUpload ? `Reduce any stage that exceeds ${MAX_MULTI_UPLOAD_FILES} files.` : null,
    ];

    return issues.filter((issue): issue is string => issue !== null);
};

export const resolveFileDate = (
    dateMode: 'month' | 'exact',
    formFileDate: string,
    monthYear: string,
): { fileDate: string; year: number; month: number } => {
    const [year, month] = monthYear.split('-').map(Number);

    if (dateMode === 'exact' && formFileDate) {
        return { fileDate: formFileDate, year, month };
    }

    const lastDay = new Date(year, month, 0).getDate();
    const today = new Date();
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
    const fileDate = isCurrentMonth
        ? today.toISOString().split('T')[0]
        : `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    return { fileDate, year, month };
};
