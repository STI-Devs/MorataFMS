import { TriangleAlert } from 'lucide-react';
import { Card } from '../../../../components/ui/card';
import { Sheet, SheetContent } from '../../../../components/ui/sheet';
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
        <div className="space-y-3 pb-6">
            {/* Page Header */}
            <div className="flex flex-col gap-0.5">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Documents</h1>
                <p className="text-xs text-muted-foreground">
                    Browse cleared shipments and manage attached stage documents.
                </p>
            </div>

            {/* Error Banner */}
            {isError ? (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
                    <TriangleAlert className="size-4 shrink-0" />
                    Failed to load completed transactions. Please refresh the page.
                </div>
            ) : null}

            {/* 4-Card Compact KPI Stats */}
            <DocumentsStats stats={stats} isLoading={isLoading} />

            {/* Full-Width Data Table Card */}
            <Card className="p-0 py-0 gap-0 overflow-hidden shadow-2xs">
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
            </Card>

            {/* Slide-out Document Detail Drawer / Sheet */}
            <Sheet open={!!selectedRef} onOpenChange={(open) => !open && selectRef(null)}>
                <SheetContent side="right" className="sm:max-w-xl md:max-w-2xl w-full p-0 overflow-y-auto">
                    <DocumentDetailPane ref={selectedRef} onClose={() => selectRef(null)} />
                </SheetContent>
            </Sheet>

            {/* Hidden fallback pane for closed state */}
            {!selectedRef && (
                <div className="hidden" aria-hidden="true">
                    <DocumentDetailPane ref={null} />
                </div>
            )}
        </div>
    );
};
