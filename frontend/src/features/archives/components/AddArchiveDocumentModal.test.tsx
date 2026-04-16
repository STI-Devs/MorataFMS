import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestQueryClient } from '../../../test/renderWithProviders';
import { AddArchiveDocumentModal } from './AddArchiveDocumentModal';

const trackingApiMock = vi.hoisted(() => ({
    uploadDocuments: vi.fn(),
}));

vi.mock('../../tracking/api/trackingApi', () => ({
    trackingApi: trackingApiMock,
}));

describe('AddArchiveDocumentModal', () => {
    beforeEach(() => {
        trackingApiMock.uploadDocuments.mockReset();
        trackingApiMock.uploadDocuments.mockResolvedValue([]);
    });

    it('uploads multiple files for the selected stage and refreshes archive queries', async () => {
        const queryClient = createTestQueryClient();
        const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const onClose = vi.fn();

        render(
            <QueryClientProvider client={queryClient}>
                <AddArchiveDocumentModal
                    isOpen
                    onClose={onClose}
                    blNo="BL-ARCH-001"
                    type="import"
                    existingDocs={[
                        {
                            id: 1,
                            type: 'import',
                            bl_no: 'BL-ARCH-001',
                            month: 4,
                            client: 'ACME IMPORTS',
                            selective_color: 'green',
                            destination_country: null,
                            transaction_date: '2026-04-01',
                            transaction_id: 42,
                            documentable_type: 'App\\Models\\ImportTransaction',
                            stage: 'boc',
                            filename: 'existing.pdf',
                            formatted_size: '1.2 MB',
                            size_bytes: 1200,
                            archive_origin: 'direct_archive_upload',
                            archived_at: '2026-04-02T00:00:00Z',
                            uploaded_at: '2026-04-02T00:00:00Z',
                            uploader: { id: 7, name: 'Encoder User' },
                        },
                    ]}
                />
            </QueryClientProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: /payment for ppa charges/i }));

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        const firstFile = new File(['first'], 'ppa-1.pdf', { type: 'application/pdf' });
        const secondFile = new File(['second'], 'ppa-2.pdf', { type: 'application/pdf' });

        fireEvent.change(input, {
            target: {
                files: [firstFile, secondFile],
            },
        });

        fireEvent.click(screen.getByRole('button', { name: /upload documents/i }));

        await waitFor(() => {
            expect(trackingApiMock.uploadDocuments).toHaveBeenCalledWith({
                files: [firstFile, secondFile],
                type: 'ppa',
                documentable_type: 'App\\Models\\ImportTransaction',
                documentable_id: 42,
            });
        });

        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['archives'] });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['my-archives'] });
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('blocks selections above the 10-file limit', async () => {
        const queryClient = createTestQueryClient();

        render(
            <QueryClientProvider client={queryClient}>
                <AddArchiveDocumentModal
                    isOpen
                    onClose={vi.fn()}
                    blNo="BL-ARCH-001"
                    type="import"
                    existingDocs={[
                        {
                            id: 1,
                            type: 'import',
                            bl_no: 'BL-ARCH-001',
                            month: 4,
                            client: 'ACME IMPORTS',
                            selective_color: 'green',
                            destination_country: null,
                            transaction_date: '2026-04-01',
                            transaction_id: 42,
                            documentable_type: 'App\\Models\\ImportTransaction',
                            stage: 'boc',
                            filename: 'existing.pdf',
                            formatted_size: '1.2 MB',
                            size_bytes: 1200,
                            archive_origin: 'direct_archive_upload',
                            archived_at: '2026-04-02T00:00:00Z',
                            uploaded_at: '2026-04-02T00:00:00Z',
                            uploader: { id: 7, name: 'Encoder User' },
                        },
                    ]}
                />
            </QueryClientProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: /boc document processing/i }));

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        const files = Array.from({ length: 11 }, (_, index) => new File([`${index}`], `archive-${index}.pdf`, { type: 'application/pdf' }));

        fireEvent.change(input, {
            target: {
                files,
            },
        });

        expect(screen.getByText('You can upload up to 10 files at a time.')).toBeInTheDocument();
        expect(trackingApiMock.uploadDocuments).not.toHaveBeenCalled();
    });

    it('blocks files larger than 20MB before upload', async () => {
        const queryClient = createTestQueryClient();

        render(
            <QueryClientProvider client={queryClient}>
                <AddArchiveDocumentModal
                    isOpen
                    onClose={vi.fn()}
                    blNo="BL-ARCH-001"
                    type="import"
                    existingDocs={[{
                        id: 1,
                        type: 'import',
                        bl_no: 'BL-ARCH-001',
                        month: 4,
                        client: 'ACME IMPORTS',
                        selective_color: 'green',
                        destination_country: null,
                        transaction_date: '2026-04-01',
                        transaction_id: 42,
                        documentable_type: 'App\\Models\\ImportTransaction',
                        stage: 'boc',
                        filename: 'existing.pdf',
                        formatted_size: '1.2 MB',
                        size_bytes: 1200,
                        archive_origin: 'direct_archive_upload',
                        archived_at: '2026-04-02T00:00:00Z',
                        uploaded_at: '2026-04-02T00:00:00Z',
                        uploader: { id: 7, name: 'Encoder User' },
                    }]}
                />
            </QueryClientProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: /boc document processing/i }));

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        const largeFile = new File([new Uint8Array(1)], 'too-large.pdf', { type: 'application/pdf' });
        Object.defineProperty(largeFile, 'size', { value: 21 * 1024 * 1024 });

        fireEvent.change(input, {
            target: {
                files: [largeFile],
            },
        });

        expect(screen.getByText('too-large.pdf: Each file must be 20MB or less.')).toBeInTheDocument();
        expect(trackingApiMock.uploadDocuments).not.toHaveBeenCalled();
    });
});
