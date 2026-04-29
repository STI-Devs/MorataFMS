import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import type { ArchiveDocument, ArchiveYear, TransactionType } from '../../documents/types/document.types';
import { trackingApi } from '../../tracking/api/trackingApi';
import {
    archiveGroupMatchesSearch,
    type ArchiveUploadSuccessTarget,
    type DocStatusFilter,
    type DrillState,
    type SortKey,
    type ViewMode,
    getArchiveBlCompletion,
    prefetchArchiveEditLookups,
    resolveArchiveDrillTarget,
    syncArchiveDrillState,
} from '../utils/archive.utils';

interface UseArchiveWorkspaceArgs {
    archiveData: ArchiveYear[];
    queryKey: readonly unknown[];
}

export type ConfirmModalState = {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmButtonClass?: string;
    onConfirm: () => void | Promise<void>;
};

export type AddDocModalState = {
    isOpen: boolean;
    blNo: string;
    type: TransactionType;
    docs: ArchiveDocument[];
};

export type ReplaceDocModalState = {
    isOpen: boolean;
    document: ArchiveDocument | null;
};

export type EditRecordModalState = {
    isOpen: boolean;
    record: ArchiveDocument | null;
};

export function useArchiveWorkspace({ archiveData, queryKey }: UseArchiveWorkspaceArgs) {
    const queryClient = useQueryClient();

    const [drill, setDrill] = useState<DrillState>({ level: 'years' });
    const [showLegacyUpload, setShowLegacyUpload] = useState(false);
    const [search, setSearch] = useState('');
    const [globalSearch, setGlobalSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('period');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [viewMode, setViewMode] = useState<ViewMode>('folder');
    const [filterYear, setFilterYear] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<DocStatusFilter>('all');
    const [incompleteFilterActive, setIncompleteFilterActive] = useState(false);
    const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
    const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);

    const [addDocModal, setAddDocModal] = useState<AddDocModalState>({
        isOpen: false, blNo: '', type: 'import', docs: [],
    });

    const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
        isOpen: false, title: '', message: '', onConfirm: () => {},
    });

    const [replaceDocModal, setReplaceDocModal] = useState<ReplaceDocModalState>({
        isOpen: false, document: null,
    });

    const [editRecordModal, setEditRecordModal] = useState<EditRecordModalState>({
        isOpen: false, record: null,
    });

    const currentDrill = useMemo(
        () => syncArchiveDrillState(drill, archiveData),
        [drill, archiveData],
    );

    useEffect(() => {
        if (currentDrill.level !== 'files') {
            return;
        }

        const currentRecord = currentDrill.year.documents.find((doc) =>
            doc.type === currentDrill.type
            && doc.month === currentDrill.month
            && (doc.bl_no || '(no BL)') === currentDrill.bl,
        );

        if (!currentRecord) {
            return;
        }

        void prefetchArchiveEditLookups(queryClient, currentRecord);
    }, [currentDrill, queryClient]);

    const toggleYear = (year: number) =>
        setExpandedYears((prev) => {
            const next = new Set(prev);
            if (next.has(year)) {
                next.delete(year);
            } else {
                next.add(year);
            }
            return next;
        });

    const handleArchiveUploadSuccess = async (target: ArchiveUploadSuccessTarget) => {
        await queryClient.invalidateQueries({ queryKey: [...queryKey] });

        const refreshedArchiveData = queryClient.getQueryData<ArchiveYear[]>([...queryKey]) ?? [];
        const nextDrill = resolveArchiveDrillTarget(refreshedArchiveData, target);

        setShowLegacyUpload(false);
        setViewMode('folder');
        setGlobalSearch('');
        setSearch('');
        setFilterYear(String(target.year));
        setFilterType(target.type);
        setFilterStatus('all');
        setIncompleteFilterActive(false);
        setExpandedYears(new Set([target.year]));

        if (nextDrill) {
            setDrill(nextDrill);
            return;
        }

        setDrill({ level: 'years' });
    };

    const handleDeleteArchiveDoc = (docId: number) =>
        setConfirmModal({
            isOpen: true,
            title: 'Delete Archive Document',
            message: 'This will permanently remove this archived document. Continue?',
            confirmText: 'Delete',
            confirmButtonClass: 'bg-red-600 hover:bg-red-700',
            onConfirm: async () => {
                await trackingApi.deleteDocument(docId);
                await queryClient.invalidateQueries({ queryKey: [...queryKey] });
            },
        });

    const handleReplaceArchiveDoc = (doc: ArchiveDocument) => {
        setReplaceDocModal({ isOpen: true, document: doc });
    };

    const handleEditArchiveRecord = (doc: ArchiveDocument) => {
        void prefetchArchiveEditLookups(queryClient, doc);
        setEditRecordModal({ isOpen: true, record: doc });
    };

    const nav = (next: DrillState) => {
        setDrill(next);
        setSearch('');
        setGlobalSearch('');
        setIncompleteFilterActive(false);
    };

    const navToYear = (yr: ArchiveYear) => {
        nav({ level: 'years' });
        setExpandedYears((prev) => new Set([...prev, yr.year]));
    };

    const globalResults = useMemo(() => {
        const q = globalSearch.trim().toLowerCase();
        if (!q) return [];
        const seen = new Map<string, {
            blNo: string;
            client: string;
            type: TransactionType;
            year: ArchiveYear;
            month: number;
            docs: ArchiveDocument[];
        }>();

        for (const yearData of archiveData) {
            for (const doc of yearData.documents) {
                const blNo = doc.bl_no || '(no BL)';
                const key = `${blNo}|${doc.type}|${yearData.year}|${doc.month}`;
                if (!seen.has(key)) {
                    seen.set(key, { blNo, client: doc.client, type: doc.type, year: yearData, month: doc.month, docs: [] });
                }
                seen.get(key)!.docs.push(doc);
            }
        }

        return [...seen.values()]
            .filter((record) => archiveGroupMatchesSearch(record.docs, q, record.year.year))
            .map(({ docs, ...record }) => ({
                ...record,
                fileCount: docs.length,
            }));
    }, [globalSearch, archiveData]);

    const flatDocumentList = useMemo(() => {
        const blMap = new Map<string, { blNo: string; client: string; type: TransactionType; year: number; month: number; docs: ArchiveDocument[]; yearData: ArchiveYear }>();
        for (const yearData of archiveData) {
            for (const doc of yearData.documents) {
                const blNo = doc.bl_no || '(no BL)';
                const key = `${blNo}|${doc.type}|${yearData.year}`;
                if (!blMap.has(key)) {
                    blMap.set(key, { blNo, client: doc.client, type: doc.type, year: yearData.year, month: doc.month, docs: [], yearData });
                }
                blMap.get(key)!.docs.push(doc);
            }
        }
        return [...blMap.values()].filter((r) => {
            const q = globalSearch.trim().toLowerCase();
            if (q && !archiveGroupMatchesSearch(r.docs, q, r.year)) return false;
            if (filterYear !== 'all' && String(r.year) !== filterYear) return false;
            if (filterType !== 'all' && r.type !== filterType) return false;
            const completion = getArchiveBlCompletion(r.docs, r.type);
            if (filterStatus === 'complete' && !completion.isComplete) return false;
            if (filterStatus === 'incomplete' && completion.isComplete) return false;
            if (incompleteFilterActive && completion.isComplete) return false;
            return true;
        });
    }, [archiveData, globalSearch, filterYear, filterType, filterStatus, incompleteFilterActive]);

    return {
        // drill & view state
        drill,
        currentDrill,
        viewMode,
        setViewMode,
        // search & filters
        search,
        setSearch,
        globalSearch,
        setGlobalSearch,
        sortKey,
        setSortKey,
        sortDir,
        setSortDir,
        filterYear,
        setFilterYear,
        filterType,
        setFilterType,
        filterStatus,
        setFilterStatus,
        incompleteFilterActive,
        setIncompleteFilterActive,
        // year expansion
        expandedYears,
        toggleYear,
        // menu state
        openMenuKey,
        setOpenMenuKey,
        // legacy upload toggle
        showLegacyUpload,
        setShowLegacyUpload,
        // modal state
        addDocModal,
        setAddDocModal,
        confirmModal,
        setConfirmModal,
        replaceDocModal,
        setReplaceDocModal,
        editRecordModal,
        setEditRecordModal,
        // handlers
        nav,
        navToYear,
        handleArchiveUploadSuccess,
        handleDeleteArchiveDoc,
        handleReplaceArchiveDoc,
        handleEditArchiveRecord,
        // derived
        globalResults,
        flatDocumentList,
    };
}
