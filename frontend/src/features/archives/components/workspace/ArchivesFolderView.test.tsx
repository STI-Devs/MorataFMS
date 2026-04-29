import { render, screen, within } from '@testing-library/react';
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
                showAuditButton
            />,
        );

        const yearPanel = screen.getByTestId('archive-year-panel-2025');
        const subfolderRow = screen.getByTestId('archive-subfolder-row-1|import');

        expect(yearPanel).toBeInTheDocument();
        expect(yearPanel).toHaveClass('rounded-xl');
        expect(within(yearPanel).getByText('Folders in FY 2025')).toBeInTheDocument();
        expect(subfolderRow).toBeInTheDocument();
        expect(subfolderRow).toHaveClass('px-4', 'py-2.5');
        expect(within(subfolderRow).getByRole('button', { name: 'JAN 2025 IMPORTS' })).toBeInTheDocument();
    });
});
