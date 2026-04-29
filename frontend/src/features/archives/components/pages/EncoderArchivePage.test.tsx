import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    fireEvent, render, screen, waitFor, within,
} from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import type { ArchiveYear } from '../../../documents/types/document.types';
import { EncoderArchivePage } from './EncoderArchivePage';

let archiveData: ArchiveYear[] = [];

const { legacyUploadCleanupSpy } = vi.hoisted(() => ({
    legacyUploadCleanupSpy: vi.fn(),
}));

vi.mock('../../hooks/useMyArchives', () => ({
    useMyArchives: () => ({
        data: archiveData,
        isLoading: false,
        isError: false,
    }),
}));

vi.mock('../../../auth/hooks/useAuth', () => ({
    useAuth: () => ({
        user: {
            id: 7,
            role: 'encoder',
            name: 'Encoder User',
        },
    }),
}));

vi.mock('../../../tracking/api/trackingApi', () => ({
    trackingApi: {
        deleteDocument: vi.fn(),
    },
}));

vi.mock('../legacy-upload/LegacyFolderUploadView', () => ({
    LegacyFolderUploadView: ({ onOpenBatches }: { onOpenBatches: () => void }) => {
        useEffect(() => () => {
            legacyUploadCleanupSpy();
        }, []);

        return (
            <div>
                <span>Legacy Folder Upload Workspace</span>
                <button type="button" onClick={onOpenBatches}>Open batches</button>
            </div>
        );
    },
}));

vi.mock('./LegacyBatchesPage', () => ({
    LegacyBatchesPage: () => <div>Legacy Batches Workspace</div>,
}));

const createArchiveData = (clientName: string): ArchiveYear[] => ([
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
                client: clientName,
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
                uploader: { id: 7, name: 'Encoder User' },
            },
        ],
    },
]);

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

const renderEncoderArchivePage = (initialPath: string = appRoutes.encoderRecordsArchive) => render(
    <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
            <Route path={appRoutes.encoderRecordsWildcard} element={<EncoderArchivePage />} />
        </Routes>
    </MemoryRouter>,
    { wrapper: createWrapper() },
);

describe('EncoderArchivePage', () => {
    beforeEach(() => {
        archiveData = createArchiveData('Original Archive Client');
        legacyUploadCleanupSpy.mockClear();
    });

    it('refreshes the open file view when archive data changes after an edit', async () => {
        const { rerender } = renderEncoderArchivePage();

        fireEvent.click(screen.getByText('FY 2025'));
        fireEvent.click(screen.getByRole('button', { name: 'JAN 2025 IMPORTS' }));
        fireEvent.click(screen.getByRole('button', { name: 'BL-001/' }));

        expect(screen.getByText('Original Archive Client')).toBeInTheDocument();

        archiveData = createArchiveData('Updated Archive Client');
        rerender(
            <MemoryRouter initialEntries={[appRoutes.encoderRecordsArchive]}>
                <Routes>
                    <Route path={appRoutes.encoderRecordsWildcard} element={<EncoderArchivePage />} />
                </Routes>
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(screen.getByText('Updated Archive Client')).toBeInTheDocument();
        });
    });

    it('switches to the encoder legacy upload and legacy batches workspaces', () => {
        renderEncoderArchivePage(appRoutes.encoderLegacyFolderUpload);

        expect(screen.getByText('Legacy Folder Upload Workspace')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Open batches' }));

        expect(screen.getByText('Legacy Batches Workspace')).toBeInTheDocument();
    });

    it('keeps the encoder legacy upload workspace mounted while switching to legacy batches', () => {
        renderEncoderArchivePage(appRoutes.encoderLegacyFolderUpload);

        fireEvent.click(screen.getByRole('button', { name: 'Open batches' }));

        expect(screen.getByText('Legacy Folder Upload Workspace')).toBeInTheDocument();
        expect(screen.getByText('Legacy Batches Workspace')).toBeInTheDocument();
        expect(legacyUploadCleanupSpy).not.toHaveBeenCalled();
    });

    it('renders the encoder archive page with the shared records control shell', () => {
        renderEncoderArchivePage();

        expect(screen.getByRole('heading', { name: 'Records Archive' })).toBeInTheDocument();
        expect(screen.getByText('Records Control')).toBeInTheDocument();
        expect(screen.getByText('My archive workspace')).toBeInTheDocument();
        expect(screen.getByText('1 BL needs documents')).toBeInTheDocument();
        expect(screen.getByText('Files Uploaded')).toBeInTheDocument();
        expect(screen.getByText('Incomplete BLs')).toBeInTheDocument();
        expect(screen.getByText('BLs Added This Month')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Export CSV' })).toBeInTheDocument();
    });

    it('counts monthly archive additions by unique BL instead of raw file uploads', () => {
        const currentMonthUpload = new Date().toISOString();
        const previousMonthUpload = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString();

        archiveData = [
            {
                year: 2026,
                imports: 1,
                exports: 1,
                documents: [
                    {
                        id: 1,
                        type: 'import',
                        bl_no: 'BL-001',
                        month: 4,
                        client: 'Current Month Client',
                        client_id: 11,
                        selective_color: 'green',
                        vessel_name: 'MV Archive Pearl',
                        location_of_goods: 'South Harbor Warehouse',
                        transaction_date: '2026-04-28',
                        transaction_id: 101,
                        documentable_type: 'App\\Models\\ImportTransaction',
                        stage: 'boc',
                        filename: 'archive-boc.pdf',
                        formatted_size: '100 KB',
                        size_bytes: 102400,
                        archive_origin: 'direct_archive_upload',
                        archived_at: currentMonthUpload,
                        uploaded_at: currentMonthUpload,
                        uploader: { id: 7, name: 'Encoder User' },
                    },
                    {
                        id: 2,
                        type: 'import',
                        bl_no: 'BL-001',
                        month: 4,
                        client: 'Current Month Client',
                        client_id: 11,
                        selective_color: 'green',
                        vessel_name: 'MV Archive Pearl',
                        location_of_goods: 'South Harbor Warehouse',
                        transaction_date: '2026-04-28',
                        transaction_id: 101,
                        documentable_type: 'App\\Models\\ImportTransaction',
                        stage: 'billing',
                        filename: 'archive-billing.pdf',
                        formatted_size: '120 KB',
                        size_bytes: 122880,
                        archive_origin: 'direct_archive_upload',
                        archived_at: currentMonthUpload,
                        uploaded_at: currentMonthUpload,
                        uploader: { id: 7, name: 'Encoder User' },
                    },
                    {
                        id: 3,
                        type: 'export',
                        bl_no: 'BL-002',
                        month: 3,
                        client: 'Previous Month Client',
                        client_id: 12,
                        selective_color: 'red',
                        vessel_name: 'MV Archive Coral',
                        location_of_goods: 'North Harbor Yard',
                        transaction_date: '2026-03-12',
                        transaction_id: 202,
                        documentable_type: 'App\\Models\\ExportTransaction',
                        stage: 'bl',
                        filename: 'archive-export.pdf',
                        formatted_size: '90 KB',
                        size_bytes: 92160,
                        archive_origin: 'direct_archive_upload',
                        archived_at: previousMonthUpload,
                        uploaded_at: previousMonthUpload,
                        uploader: { id: 7, name: 'Encoder User' },
                    },
                ],
            },
        ];

        renderEncoderArchivePage();

        const monthlyMetric = screen.getByText('BLs Added This Month').closest('div');

        expect(monthlyMetric).not.toBeNull();
        expect(within(monthlyMetric as HTMLElement).getByText('1')).toBeInTheDocument();
        expect(screen.queryByText('Uploads This Month')).not.toBeInTheDocument();
    });
});
