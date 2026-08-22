import { startTransition, useDeferredValue, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '../../../hooks/useDebounce';
import { buildDocumentStats, mapDocumentRows, type TypeFilter } from '../components/document-list/documentsList.utils';
import { useDocumentTransactions } from './useDocumentTransactions';

/**
 * Orchestrates the Documents master-detail page: server-driven paging/search/
 * type filters live in the URL query params, and the selected document ref is
 * also synced to the URL (`?ref=`) so deep links and back navigation work.
 */
export function useDocumentsWorkspace() {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const perPage = Number.parseInt(searchParams.get('per_page') || '30', 10);
    const selectedRef = searchParams.get('ref');

    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

    const deferredSearchQuery = useDeferredValue(searchQuery);
    const debouncedSearch = useDebounce(deferredSearchQuery, 400);

    const { data: response, isLoading, isError } = useDocumentTransactions({
        search: debouncedSearch || undefined,
        type: typeFilter === 'all' ? undefined : typeFilter,
        page,
        per_page: perPage,
    });

    const rows = mapDocumentRows(response?.data ?? []);
    const stats = buildDocumentStats(response?.counts, rows);
    const meta = response?.meta;

    const updateSearchParams = (
        updater: (params: URLSearchParams) => void,
        options?: { replace?: boolean },
    ) => {
        setSearchParams(
            (previousParams) => {
                const nextParams = new URLSearchParams(previousParams);
                updater(nextParams);
                return nextParams;
            },
            options,
        );
    };

    const handlePageChange = (nextPage: number) => {
        startTransition(() => {
            updateSearchParams((params) => {
                params.set('page', String(nextPage));
            });
        });
    };

    const handlePerPageChange = (nextPerPage: number) => {
        startTransition(() => {
            updateSearchParams((params) => {
                params.set('per_page', String(nextPerPage));
                params.set('page', '1');
            });
        });
    };

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        startTransition(() => {
            updateSearchParams((params) => {
                params.set('page', '1');
            });
        });
    };

    const handleTypeFilterChange = (value: TypeFilter) => {
        startTransition(() => {
            setTypeFilter(value);
            updateSearchParams((params) => {
                params.set('page', '1');
            });
        });
    };

    const selectRef = (ref: string | null) => {
        startTransition(() => {
            updateSearchParams(
                (params) => {
                    if (ref) {
                        params.set('ref', ref);
                    } else {
                        params.delete('ref');
                    }
                },
                { replace: true },
            );
        });
    };

    return {
        response,
        rows,
        stats,
        meta,
        isLoading,
        isError,
        page,
        perPage,
        searchQuery,
        typeFilter,
        selectedRef,
        handleSearchChange,
        handleTypeFilterChange,
        handlePageChange,
        handlePerPageChange,
        selectRef,
    };
}
