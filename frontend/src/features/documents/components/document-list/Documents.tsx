import { TriangleAlert } from 'lucide-react';
import { CurrentDateTime } from '../../../../components/CurrentDateTime';
import { useDocumentsWorkspace } from '../../hooks/useDocumentsWorkspace';
import { DocumentDetailPane } from '../document-detail/DocumentDetailPane';
import { DocumentsStats } from './DocumentsStats';
import { DocumentsTable } from './DocumentsTable';
import { DocumentsToolbar } from './DocumentsToolbar';

export const Documents = () => {
    const {
        rows,
        stats,
        response,
        isLoading,
        isError,
        searchQuery,
        typeFilter,
        selectedRef,
        handleSearchChange,
        handleTypeFilterChange,
        handlePageChange,
        handlePerPageChange,
        selectRef,
    } = useDocumentsWorkspace();

    return (
        <div className="space-y-5">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Documents</h1>
                    <p className="text-sm text-muted-foreground">
                        Browse cleared shipments &amp; manage files
                    </p>
                </div>
                <CurrentDateTime
                    className="hidden shrink-0 text-right sm:block"
                    timeClassName="text-2xl font-bold tabular-nums text-foreground"
                    dateClassName="text-sm text-muted-foreground"
                />
            </div>

            {isError ? (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
                    <TriangleAlert className="size-4 shrink-0" />
                    Failed to load completed transactions. Please refresh the page.
                </div>
            ) : null}

            <DocumentsStats stats={stats} isLoading={isLoading} />

            <div className="flex flex-col gap-4 overflow-hidden lg:grid lg:grid-cols-[minmax(26rem,0.85fr)_minmax(0,1.15fr)] lg:items-start">
                {/* Left: the document list */}
                <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <DocumentsToolbar
                        searchQuery={searchQuery}
                        typeFilter={typeFilter}
                        onSearchChange={handleSearchChange}
                        onTypeFilterChange={handleTypeFilterChange}
                    />

                    <DocumentsTable
                        rows={rows}
                        response={response}
                        selectedRef={selectedRef}
                        isLoading={isLoading}
                        onSelect={(ref) => selectRef(ref)}
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                    />
                </div>

                {/* Right: the detail pane */}
                <div className="min-h-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <DocumentDetailPane ref={selectedRef} />
                </div>
            </div>
        </div>
    );
};
