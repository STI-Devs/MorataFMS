import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ArchiveDocument, ArchiveYear } from '../../../documents/types/document.types';
import type { ArchiveDocumentIndexRow } from '../../types/archiveHistory.types';
import { useArchiveFolderHistory } from '../../hooks/useArchiveFolderHistory';
import { ArchivesBLView, ArchivesDocumentView } from './ArchivesViews';

vi.mock('../../hooks/useArchiveFolderHistory', () => ({
    useArchiveFolderHistory: vi.fn(),
}));

const useArchiveFolderHistoryMock = vi.mocked(useArchiveFolderHistory);

const makeDocument = (index: number): ArchiveDocument => ({
    id: index,
    type: 'export',
    bl_no: `BL-PAGE-${String(index).padStart(3, '0')}`,
    month: 1,
    client: `Client ${index}`,
    client_id: index,
    destination_country: 'Japan',
    destination_country_id: 1,
    vessel_name: 'MV Pagination',
    transaction_date: '2025-01-15',
    transaction_id: index,
    documentable_type: 'App\\Models\\ExportTransaction',
    stage: 'billing',
    filename: `billing-${index}.pdf`,
    formatted_size: '1 KB',
    size_bytes: 1024,
    archive_origin: 'direct_archive_upload',
    archived_at: '2025-01-15T00:00:00Z',
    uploaded_at: '2025-01-15T00:00:00Z',
    not_applicable_stages: ['boc', 'bl_generation', 'phytosanitary', 'co', 'cil', 'dccci'],
    uploader: { id: 1, name: 'Admin User' },
});

const yearData: ArchiveYear = {
    year: 2025,
    imports: 0,
    exports: 30,
    documents: [],
};

const records: ArchiveDocumentIndexRow[] = Array.from({ length: 30 }, (_, index) => {
    const doc = makeDocument(index + 1);

    return {
        bl_no: doc.bl_no,
        client: doc.client,
        type: doc.type,
        year: yearData.year,
        month: doc.month,
        transaction_id: doc.transaction_id,
        documentable_type: doc.documentable_type,
        not_applicable_stages: doc.not_applicable_stages ?? [],
        documents: [doc],
    };
});

describe('ArchivesDocumentView', () => {
    beforeEach(() => {
        useArchiveFolderHistoryMock.mockReset();
    });

    it('renders backend-paginated BL records and delegates page changes', () => {
        const onPageChange = vi.fn();
        const { rerender } = render(
            <ArchivesDocumentView
                rows={records.slice(0, 25)}
                meta={{
                    current_page: 1,
                    last_page: 2,
                    per_page: 25,
                    total: 30,
                    from: 1,
                    to: 25,
                }}
                isFetching={false}
                page={1}
                perPage={25}
                onPageChange={onPageChange}
                onPerPageChange={vi.fn()}
                getYearData={() => yearData}
                nav={vi.fn()}
                setViewMode={vi.fn()}
            />,
        );

        expect(screen.getByText('BL-PAGE-001')).toBeInTheDocument();
        expect(screen.getByText('BL-PAGE-025')).toBeInTheDocument();
        expect(screen.queryByText('BL-PAGE-026')).not.toBeInTheDocument();
        expect(screen.getByText('Showing 1-25 of 30 BL records')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Next' }));

        expect(onPageChange).toHaveBeenCalledWith(2);

        rerender(
            <ArchivesDocumentView
                rows={records.slice(25)}
                meta={{
                    current_page: 2,
                    last_page: 2,
                    per_page: 25,
                    total: 30,
                    from: 26,
                    to: 30,
                }}
                isFetching={false}
                page={2}
                perPage={25}
                onPageChange={onPageChange}
                onPerPageChange={vi.fn()}
                getYearData={() => yearData}
                nav={vi.fn()}
                setViewMode={vi.fn()}
            />,
        );

        expect(screen.queryByText('BL-PAGE-001')).not.toBeInTheDocument();
        expect(screen.getByText('BL-PAGE-026')).toBeInTheDocument();
        expect(screen.getByText('BL-PAGE-030')).toBeInTheDocument();
        expect(screen.getByText('Showing 26-30 of 30 BL records')).toBeInTheDocument();
    });

    it('renders folder BL records from the paginated folder history endpoint', () => {
        const nav = vi.fn();
        useArchiveFolderHistoryMock.mockReturnValue({
            data: {
                data: records.slice(0, 2).map((record) => ({
                    bl_no: record.bl_no,
                    type: record.type,
                    transaction_id: record.transaction_id,
                    documentable_type: record.documentable_type,
                    client: record.client,
                    transaction_date: record.documents[0].transaction_date,
                    not_applicable_stages: record.not_applicable_stages,
                    required_stages: ['billing'],
                    uploaded_stage_count: 1,
                    required_stage_count: 1,
                    is_complete: true,
                    latest_uploaded_at: record.documents[0].uploaded_at,
                    latest_uploader: { id: 1, name: 'Admin User' },
                    documents: record.documents,
                })),
                summary: {
                    total_bl_records: 30,
                    complete_bl_records: 30,
                    incomplete_bl_records: 0,
                    total_files: 30,
                    latest_uploaded_at: '2025-01-15T00:00:00Z',
                },
                meta: {
                    current_page: 1,
                    last_page: 15,
                    per_page: 2,
                    total: 30,
                    from: 1,
                    to: 2,
                },
            },
            isFetching: false,
        } as ReturnType<typeof useArchiveFolderHistory>);

        render(
            <ArchivesBLView
                drill={{ level: 'bls', year: yearData, type: 'export', month: 1 }}
                search=""
                sortKey="period"
                sortDir="desc"
                historyMine={false}
                filterStatus="all"
                nav={nav}
            />,
        );

        expect(useArchiveFolderHistoryMock).toHaveBeenCalledWith(expect.objectContaining({
            year: 2025,
            month: 1,
            type: 'export',
            page: 1,
            perPage: 25,
            sort: 'period',
            direction: 'desc',
        }));
        expect(screen.getByText('BL-PAGE-001/')).toBeInTheDocument();
        expect(screen.getByText('BL-PAGE-002/')).toBeInTheDocument();
        expect(screen.getByText('Showing 1-2 of 30 BL records')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'BL-PAGE-001/' }));

        expect(nav).toHaveBeenCalledWith({
            level: 'files',
            year: { ...yearData, documents: records[0].documents },
            type: 'export',
            month: 1,
            bl: 'BL-PAGE-001',
        });
    });
});
