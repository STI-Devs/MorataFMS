import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import {
    beforeEach, describe, expect, it, vi,
} from 'vitest';
import type { ArchiveYear } from '../../documents/types/document.types';
import { EncoderArchivePage } from './EncoderArchivePage';

let archiveData: ArchiveYear[] = [];

vi.mock('../hooks/useMyArchives', () => ({
    useMyArchives: () => ({
        data: archiveData,
        isLoading: false,
        isError: false,
    }),
}));

vi.mock('../../auth/hooks/useAuth', () => ({
    useAuth: () => ({
        user: {
            id: 7,
            role: 'encoder',
            name: 'Encoder User',
        },
    }),
}));

vi.mock('../../tracking/api/trackingApi', () => ({
    trackingApi: {
        deleteDocument: vi.fn(),
    },
}));

vi.mock('./LegacyFolderUploadView', () => ({
    LegacyFolderUploadView: () => <div>Legacy Folder Upload Workspace</div>,
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

describe('EncoderArchivePage', () => {
    beforeEach(() => {
        archiveData = createArchiveData('Original Archive Client');
    });

    it('refreshes the open file view when archive data changes after an edit', async () => {
        const { rerender } = render(<EncoderArchivePage />, { wrapper: createWrapper() });

        fireEvent.click(screen.getByText('FY 2025'));
        fireEvent.click(screen.getByRole('button', { name: 'JAN 2025 IMPORTS' }));
        fireEvent.click(screen.getByRole('button', { name: 'BL-001/' }));

        expect(screen.getByText('Original Archive Client')).toBeInTheDocument();

        archiveData = createArchiveData('Updated Archive Client');
        rerender(<EncoderArchivePage />);

        await waitFor(() => {
            expect(screen.getByText('Updated Archive Client')).toBeInTheDocument();
        });
    });

    it('switches to the encoder legacy upload and legacy batches workspaces', () => {
        render(<EncoderArchivePage />, { wrapper: createWrapper() });

        fireEvent.click(screen.getByRole('button', { name: 'Legacy Folder Upload' }));
        expect(screen.getByText('Legacy Folder Upload Workspace')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Legacy Batches' }));
        expect(screen.getByText('Legacy Batches Workspace')).toBeInTheDocument();
    });
});
