import { startTransition, useDeferredValue, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CurrentDateTime } from '../../../../components/CurrentDateTime';
import { UploadModal } from '../../../../components/modals/UploadModal';
import { useDebounce } from '../../../../hooks/useDebounce';
import { useDocumentTransactions } from '../../hooks/useDocumentTransactions';
import { DocumentsStats } from './DocumentsShared';
import { DocumentsTable } from './DocumentsTable';
import { DocumentsToolbar } from './DocumentsToolbar';
import { buildDocumentStats, mapDocumentRows, type TypeFilter } from './documentsList.utils';

export const Documents = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const perPage = Number.parseInt(searchParams.get('per_page') || '10', 10);

    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

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

    const updateSearchParams = (updater: (params: URLSearchParams) => void) => {
        setSearchParams((previousParams) => {
            const nextParams = new URLSearchParams(previousParams);
            updater(nextParams);
            return nextParams;
        });
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
        setIsFilterOpen(false);
        startTransition(() => {
            setTypeFilter(value);
            updateSearchParams((params) => {
                params.set('page', '1');
            });
        });
    };

    return (
        <div className="space-y-5 p-4">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="mb-1 text-3xl font-bold text-text-primary">Documents</h1>
                    <p className="text-sm text-text-secondary">
                        Browse cleared shipments & manage files
                    </p>
                </div>
                <CurrentDateTime
                    className="hidden shrink-0 text-right sm:block"
                    timeClassName="text-2xl font-bold tabular-nums text-text-primary"
                    dateClassName="text-sm text-text-secondary"
                />
            </div>

            {isError ? (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    Failed to load completed transactions. Please refresh the page.
                </div>
            ) : null}

            <DocumentsStats stats={stats} isLoading={isLoading} />

            <div className="overflow-visible rounded-xl border border-border bg-surface shadow-sm">
                <DocumentsToolbar
                    searchQuery={searchQuery}
                    typeFilter={typeFilter}
                    isFilterOpen={isFilterOpen}
                    onSearchChange={handleSearchChange}
                    onToggleFilter={() => setIsFilterOpen((open) => !open)}
                    onTypeFilterChange={handleTypeFilterChange}
                />

                <DocumentsTable
                    rows={rows}
                    response={response}
                    isLoading={isLoading}
                    onPageChange={handlePageChange}
                    onPerPageChange={handlePerPageChange}
                />
            </div>

            <UploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                title="Select a transaction first"
                onUpload={() => setIsUploadOpen(false)}
            />
        </div>
    );
};
