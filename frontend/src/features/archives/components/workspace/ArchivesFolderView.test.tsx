import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ArchiveYear } from '../../../documents/types/document.types';
import { ArchivesFolderView } from './ArchivesFolderView';

vi.mock('../../../auth/hooks/useAuth', () => ({
    useAuth: () => ({
        user: {
            id: 1,
            role: 'admin',
            name: 'Admin User',
        },
    }),
}));

vi.mock('../legacy-upload/UploadHistoryPanel', () => ({
    UploadHistoryPanel: () => null,
}));

const archiveData: ArchiveYear[] = [
    {
        year: 2025,
        imports: 1,
        exports: 0,
        documents: [
            {
                id: 1,
                type: 'import',
                bl_no: 'BL-001',
                month: 1,
                client: 'Client One',
                client_id: 11,
                selective_color: 'green',
                vessel_name: 'MV Archive Pearl',
                location_of_goods: 'South Harbor Warehouse',
                transaction_date: '2025-01-31',
                transaction_id: 101,
                documentable_type: 'App\\Models\\ImportTransaction',
                stage: 'boc',
                filename: 'archive-boc.pdf',
                formatted_size: '100 KB',
                size_bytes: 102400,
                archive_origin: 'direct_archive_upload',
                archived_at: '2025-01-31T00:00:00Z',
                uploaded_at: '2025-01-31T00:00:00Z',
                uploader: { id: 1, name: 'Admin User' },
            },
            {
                id: 2,
                type: 'import',
                bl_no: 'BL-001',
                month: 1,
                client: 'Client One',
                client_id: 11,
                selective_color: 'green',
                vessel_name: 'MV Archive Pearl',
                location_of_goods: 'South Harbor Warehouse',
                transaction_date: '2025-01-31',
                transaction_id: 101,
                documentable_type: 'App\\Models\\ImportTransaction',
                stage: 'bill_of_lading',
                filename: 'archive-bl.pdf',
                formatted_size: '100 KB',
                size_bytes: 102400,
                archive_origin: 'direct_archive_upload',
                archived_at: '2025-01-31T00:00:00Z',
                uploaded_at: '2025-01-31T00:00:00Z',
                uploader: { id: 1, name: 'Admin User' },
            },
        ],
    },
];

describe('ArchivesFolderView', () => {
    it('renders expanded folder rows inside an inset nested panel under the year row', () => {
        render(
            <ArchivesFolderView
                archiveData={archiveData}
                filterYear="all"
                filterType="all"
                filterStatus="all"
                expandedYears={new Set([2025])}
                toggleYear={vi.fn()}
                nav={vi.fn()}
                openMenuKey={null}
                setOpenMenuKey={vi.fn()}
                onOpenUpload={vi.fn()}
                onRequestFolderZip={vi.fn()}
                preparingZipRequestKeys={new Set()}
            />,
        );

        const yearPanel = screen.getByTestId('archive-year-panel-2025');
        const subfolderRow = screen.getByTestId('archive-subfolder-row-1|import');

        expect(yearPanel).toBeInTheDocument();
        expect(yearPanel).toHaveClass('pb-3', 'pt-2');
        expect(within(yearPanel).queryByText('Folders in FY 2025')).not.toBeInTheDocument();
        expect(subfolderRow).toBeInTheDocument();
        expect(subfolderRow).toHaveClass('px-5', 'py-3');
        expect(within(subfolderRow).getByRole('button', { name: 'JAN 2025 IMPORTS' })).toBeInTheDocument();
    });

    it('requests an async ZIP for the whole filing year and no longer shows mark as audited', () => {
        const requestFolderZip = vi.fn();

        render(
            <ArchivesFolderView
                archiveData={archiveData}
                filterYear="all"
                filterType="all"
                filterStatus="all"
                expandedYears={new Set([2025])}
                toggleYear={vi.fn()}
                nav={vi.fn()}
                openMenuKey={null}
                setOpenMenuKey={vi.fn()}
                onOpenUpload={vi.fn()}
                onRequestFolderZip={requestFolderZip}
                preparingZipRequestKeys={new Set()}
            />,
        );

        expect(screen.queryByTitle(/mark as audited/i)).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /prepare fy 2025 zip/i }));

        expect(requestFolderZip).toHaveBeenCalledWith({
            scope: 'year',
            requestKey: 'year|2025',
            folderName: 'FY 2025',
            year: 2025,
            fileCount: 2,
            blCount: 1,
            filename: 'fy-2025-archive.zip',
        });
    });

    it('renders folder and year counts from backend summaries without document payloads', () => {
        const requestFolderZip = vi.fn();
        const summaryArchiveData: ArchiveYear[] = [{
            year: 2025,
            imports: 0,
            exports: 500,
            documents: [],
            file_count: 3500,
            bl_count: 500,
            completed_bl_count: 450,
            incomplete_bl_count: 50,
            total_size_bytes: 1048576,
            folders: [{
                year: 2025,
                month: 3,
                type: 'export',
                file_count: 3500,
                bl_count: 500,
                completed_bl_count: 450,
                incomplete_bl_count: 50,
                total_size_bytes: 1048576,
                latest_uploaded_at: '2025-03-31T00:00:00Z',
            }],
        }];

        render(
            <ArchivesFolderView
                archiveData={summaryArchiveData}
                filterYear="all"
                filterType="all"
                filterStatus="all"
                expandedYears={new Set([2025])}
                toggleYear={vi.fn()}
                nav={vi.fn()}
                openMenuKey={null}
                setOpenMenuKey={vi.fn()}
                onOpenUpload={vi.fn()}
                onRequestFolderZip={requestFolderZip}
                preparingZipRequestKeys={new Set()}
            />,
        );

        expect(screen.getAllByText('3,500 files')).toHaveLength(2);
        expect(screen.getAllByText('500 BLs')).toHaveLength(2);
        expect(screen.getAllByText('90% complete').length).toBeGreaterThan(0);

        fireEvent.click(screen.getByRole('button', { name: /prepare fy 2025 zip/i }));

        expect(requestFolderZip).toHaveBeenCalledWith(expect.objectContaining({
            fileCount: 3500,
            blCount: 500,
        }));
    });
});
