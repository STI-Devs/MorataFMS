import type { QueryClient } from '@tanstack/react-query';
import {
    getRequiredArchiveStages,
    type ArchiveDocument,
    type ArchiveYear,
    type TransactionType,
} from '../../documents/types/document.types';
import { trackingApi } from '../../tracking/api/trackingApi';

export type DrillState =
    | { level: 'years' }
    | { level: 'types'; year: ArchiveYear }
    | { level: 'months'; year: ArchiveYear; type: TransactionType }
    | { level: 'bls'; year: ArchiveYear; type: TransactionType; month: number }
    | { level: 'files'; year: ArchiveYear; type: TransactionType; month: number; bl: string };

export type ViewMode = 'folder' | 'document';
export type DocStatusFilter = 'all' | 'complete' | 'incomplete';
export type SortKey = 'bl' | 'client' | 'period' | 'files';

export interface ArchiveUploadSuccessTarget {
    type: TransactionType;
    transactionId: number;
    blNo: string;
    year: number;
    month: number;
    uploadedCount: number;
}

const ROLE_RANK: Record<string, number> = {
    encoder: 1, paralegal: 2, admin: 3,
};
export const hasRoleAtLeast = (userRole: string | undefined, minRole: string): boolean =>
    (ROLE_RANK[userRole ?? ''] ?? 0) >= (ROLE_RANK[minRole] ?? 99);


export const FOLDER_COLOR = { import: '#16a34a', export: '#2563eb' } as const;
export const FOLDER_LABEL = { import: 'imports', export: 'exports' } as const;
export const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const toTitleCase = (str: string) =>
    str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

export const getArchiveBlCompletion = (
    blDocs: ArchiveDocument[],
    typeOverride?: TransactionType,
) => {
    const type = typeOverride ?? blDocs[0]?.type ?? 'import';
    const uploadedStages = new Set(blDocs.map((doc) => doc.stage));
    const notApplicableStages = [...new Set(blDocs.flatMap((doc) => doc.not_applicable_stages ?? []))];
    const requiredStages = getRequiredArchiveStages(type, notApplicableStages);
    const doneCount = requiredStages.filter((stage) => uploadedStages.has(stage.key)).length;

    return {
        type,
        uploadedStages,
        notApplicableStages,
        requiredStages,
        doneCount,
        isComplete: doneCount === requiredStages.length,
    };
};

export const computeGlobalCompleteness = (archiveData: ArchiveYear[]): number => {
    const blMap = new Map<string, { type: TransactionType; stages: Set<string>; notApplicableStages: Set<string> }>();
    for (const yearData of archiveData) {
        for (const doc of yearData.documents) {
            const key = `${doc.bl_no}|${doc.type}|${yearData.year}`;
            if (!blMap.has(key)) {
                blMap.set(key, { type: doc.type, stages: new Set(), notApplicableStages: new Set() });
            }
            blMap.get(key)!.stages.add(doc.stage);
            doc.not_applicable_stages?.forEach((stage) => blMap.get(key)!.notApplicableStages.add(stage));
        }
    }
    if (blMap.size === 0) return 0;
    let complete = 0;
    for (const { type, stages, notApplicableStages } of blMap.values()) {
        const required = getRequiredArchiveStages(type, [...notApplicableStages]);
        if (required.every(s => stages.has(s.key))) complete++;
    }
    return Math.round((complete / blMap.size) * 100);
};

export const countIncompleteBLs = (archiveData: ArchiveYear[]): number => {
    const blMap = new Map<string, { type: TransactionType; stages: Set<string>; notApplicableStages: Set<string> }>();
    for (const yearData of archiveData) {
        for (const doc of yearData.documents) {
            const key = `${doc.bl_no}|${doc.type}|${yearData.year}`;
            if (!blMap.has(key)) {
                blMap.set(key, { type: doc.type, stages: new Set(), notApplicableStages: new Set() });
            }
            blMap.get(key)!.stages.add(doc.stage);
            doc.not_applicable_stages?.forEach((stage) => blMap.get(key)!.notApplicableStages.add(stage));
        }
    }
    let incomplete = 0;
    for (const { type, stages, notApplicableStages } of blMap.values()) {
        const required = getRequiredArchiveStages(type, [...notApplicableStages]);
        if (!required.every(s => stages.has(s.key))) incomplete++;
    }
    return incomplete;
};

export const resolveArchiveDrillTarget = (
    archiveData: ArchiveYear[],
    target: ArchiveUploadSuccessTarget,
): DrillState | null => {
    const normalizedBl = target.blNo || '(no BL)';
    const yearMatch = archiveData.find((yearData) =>
        yearData.year === target.year
        && yearData.documents.some((doc) => doc.transaction_id === target.transactionId),
    );

    if (yearMatch) {
        const matchingDocument = yearMatch.documents.find((doc) => doc.transaction_id === target.transactionId);

        return {
            level: 'files',
            year: yearMatch,
            type: matchingDocument?.type ?? target.type,
            month: matchingDocument?.month ?? target.month,
            bl: matchingDocument?.bl_no || normalizedBl,
        };
    }

    const fallbackYear = archiveData.find((yearData) =>
        yearData.year === target.year
        && yearData.documents.some((doc) =>
            doc.type === target.type
            && doc.month === target.month
            && (doc.bl_no || '(no BL)') === normalizedBl,
        ),
    );

    if (!fallbackYear) {
        return null;
    }

    return {
        level: 'files',
        year: fallbackYear,
        type: target.type,
        month: target.month,
        bl: normalizedBl,
    };
};

export const prefetchArchiveEditLookups = async (
    queryClient: QueryClient,
    record: ArchiveDocument,
): Promise<void> => {
    const tasks: Promise<unknown>[] = [
        queryClient.prefetchQuery({
            queryKey: ['clients', record.type === 'import' ? 'importer' : 'exporter'],
            queryFn: () => trackingApi.getClients(record.type === 'import' ? 'importer' : 'exporter'),
            staleTime: Infinity,
        }),
    ];

    if (record.type === 'import') {
        tasks.push(
            queryClient.prefetchQuery({
                queryKey: ['countries', 'import_origin'],
                queryFn: () => trackingApi.getCountries('import_origin'),
                staleTime: Infinity,
            }),
            queryClient.prefetchQuery({
                queryKey: ['locations-of-goods'],
                queryFn: () => trackingApi.getLocationsOfGoods(),
                staleTime: Infinity,
            }),
        );
    } else {
        tasks.push(
            queryClient.prefetchQuery({
                queryKey: ['countries', 'export_destination'],
                queryFn: () => trackingApi.getCountries('export_destination'),
                staleTime: Infinity,
            }),
        );
    }

    await Promise.allSettled(tasks);
};

export const syncArchiveDrillState = (
    current: DrillState,
    archiveData: ArchiveYear[],
): DrillState => {
    if (current.level === 'years') {
        return current;
    }

    const refreshedYear = archiveData.find((yearData) => yearData.year === current.year.year);

    if (!refreshedYear) {
        return { level: 'years' };
    }

    if (current.level === 'types') {
        return refreshedYear === current.year
            ? current
            : { ...current, year: refreshedYear };
    }

    if (current.level === 'months') {
        return refreshedYear === current.year
            ? current
            : { ...current, year: refreshedYear };
    }

    if (current.level === 'bls') {
        return refreshedYear === current.year
            ? current
            : { ...current, year: refreshedYear };
    }

    const matchingDocumentExists = refreshedYear.documents.some((doc) =>
        doc.type === current.type
        && doc.month === current.month
        && (doc.bl_no || '(no BL)') === current.bl,
    );

    if (matchingDocumentExists) {
        return refreshedYear === current.year
            ? current
            : { ...current, year: refreshedYear };
    }

    const trackedTransactionId = current.year.documents.find((doc) =>
        doc.type === current.type
        && doc.month === current.month
        && (doc.bl_no || '(no BL)') === current.bl,
    )?.transaction_id;

    const relocatedDocument = archiveData
        .flatMap((yearData) => yearData.documents.map((doc) => ({ yearData, doc })))
        .find(({ doc }) => trackedTransactionId !== undefined && doc.transaction_id === trackedTransactionId);

    if (!relocatedDocument) {
        return { level: 'years' };
    }

    return {
        level: 'files',
        year: relocatedDocument.yearData,
        type: current.type,
        month: relocatedDocument.doc.month,
        bl: relocatedDocument.doc.bl_no || '(no BL)',
    };
};

