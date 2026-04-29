import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { trackingApi } from '../../tracking/api/trackingApi';
import { trackingKeys } from '../../tracking/utils/queryKeys';
import {
    applyQueueFilter,
    buildExportQueueRows,
    buildImportQueueRows,
    compareQueueRows,
    type QueueFilter,
    type QueueView,
    type SelectedTransaction,
} from '../utils/accountingTransaction.utils';

export function useAccountingTaskQueue() {
    const [view, setView] = useState<QueueView>('import');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<QueueFilter>('all');
    const [selectedTx, setSelectedTx] = useState<SelectedTransaction | null>(null);

    const deferredSearch = useDeferredValue(search);

    const importsQuery = useQuery({
        queryKey: [...trackingKeys.imports.list(), 'accounting-queue'],
        queryFn: () => trackingApi.getAllImports({ exclude_statuses: 'completed,cancelled', operational_scope: 'workspace' }),
    });

    const exportsQuery = useQuery({
        queryKey: [...trackingKeys.exports.list(), 'accounting-queue'],
        queryFn: () => trackingApi.getAllExports({ exclude_statuses: 'completed,cancelled', operational_scope: 'workspace' }),
    });

    const importRows = useMemo(
        () => buildImportQueueRows(importsQuery.data ?? []),
        [importsQuery.data],
    );
    const exportRows = useMemo(
        () => buildExportQueueRows(exportsQuery.data ?? []),
        [exportsQuery.data],
    );

    const activeRows = view === 'import' ? importRows : exportRows;
    const activeQuery = view === 'import' ? importsQuery : exportsQuery;

    const searchedRows = useMemo(() => {
        const term = deferredSearch.trim().toLowerCase();

        if (!term) {
            return activeRows;
        }

        return activeRows.filter((row) => row.searchableText.includes(term));
    }, [activeRows, deferredSearch]);

    const filterCounts = useMemo(() => ({
        all: searchedRows.length,
        ready: searchedRows.filter((row) => row.state === 'ready').length,
        blocked: searchedRows.filter((row) => row.state === 'waiting').length,
        overdue: searchedRows.filter((row) => row.isOverdue).length,
    }), [searchedRows]);

    const filteredRows = useMemo(() => applyQueueFilter(searchedRows, filter), [searchedRows, filter]);

    const readyRows = useMemo(
        () => filteredRows.filter((row) => row.state === 'ready').sort(compareQueueRows),
        [filteredRows],
    );
    const waitingRows = useMemo(
        () => filteredRows.filter((row) => row.state === 'waiting').sort(compareQueueRows),
        [filteredRows],
    );

    const queueSummary = useMemo(() => ({
        visible: filteredRows.length,
        ready: readyRows.length,
        waiting: waitingRows.length,
        overdue: filteredRows.filter((row) => row.isOverdue).length,
    }), [filteredRows, readyRows.length, waitingRows.length]);

    return {
        view,
        setView,
        search,
        setSearch,
        filter,
        setFilter,
        selectedTx,
        setSelectedTx,
        importCount: importRows.length,
        exportCount: exportRows.length,
        filterCounts,
        queueSummary,
        isLoading: activeQuery.isLoading,
        isError: activeQuery.isError,
        activeRows,
        filteredRows,
        readyRows,
        waitingRows,
    };
}
