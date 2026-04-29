import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { NotarialBooksPage } from './NotarialBooksPage';

const {
    mockUseAuth,
    mockUseLegalBooks,
    mockUseCreateNotarialBook,
    mockUseUpdateNotarialBook,
    mockUseBookPageScans,
    mockUseLegacyBookFiles,
    mockUseCreateBookPageScan,
    mockUseUpdateBookPageScan,
    mockUseDeleteBookPageScan,
    mockUseCreateLegacyBookFiles,
    mockUseDeleteLegacyBookFile,
    mockCreateBook,
} = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockUseLegalBooks: vi.fn(),
    mockUseCreateNotarialBook: vi.fn(),
    mockUseUpdateNotarialBook: vi.fn(),
    mockUseBookPageScans: vi.fn(),
    mockUseLegacyBookFiles: vi.fn(),
    mockUseCreateBookPageScan: vi.fn(),
    mockUseUpdateBookPageScan: vi.fn(),
    mockUseDeleteBookPageScan: vi.fn(),
    mockUseCreateLegacyBookFiles: vi.fn(),
    mockUseDeleteLegacyBookFile: vi.fn(),
    mockCreateBook: vi.fn(),
}));

vi.mock('../../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => <div data-testid="current-date-time" />,
}));

vi.mock('../../../auth', () => ({
    useAuth: mockUseAuth,
}));

vi.mock('../../hooks/useLegalWorkspace', () => ({
    useLegalBooks: mockUseLegalBooks,
    useCreateNotarialBook: mockUseCreateNotarialBook,
    useUpdateNotarialBook: mockUseUpdateNotarialBook,
    useBookPageScans: mockUseBookPageScans,
    useLegacyBookFiles: mockUseLegacyBookFiles,
    useCreateBookPageScan: mockUseCreateBookPageScan,
    useUpdateBookPageScan: mockUseUpdateBookPageScan,
    useDeleteBookPageScan: mockUseDeleteBookPageScan,
    useCreateLegacyBookFiles: mockUseCreateLegacyBookFiles,
    useDeleteLegacyBookFile: mockUseDeleteLegacyBookFile,
}));

describe('NotarialBooksPage', () => {
    beforeEach(() => {
        mockUseAuth.mockReturnValue({
            user: {
                id: 1,
                role: 'admin',
                permissions: {
                    manage_notarial_books: true,
                },
            },
        });

        mockUseLegalBooks.mockReturnValue({
            data: {
                data: [
                    {
                        id: 1,
                        book_number: 2,
                        year: 2026,
                        status: 'active',
                        generated_record_count: 4,
                        page_scan_count: 1,
                        legacy_file_count: 2,
                        notes: 'Current archive book.',
                        scan_file: null,
                        opened_at: null,
                        closed_at: null,
                        created_at: null,
                        updated_at: null,
                    },
                ],
            },
        });

        mockCreateBook.mockReset();
        mockUseCreateNotarialBook.mockReturnValue({
            mutateAsync: mockCreateBook.mockResolvedValue({ id: 9 }),
            isPending: false,
        });
        mockUseUpdateNotarialBook.mockReturnValue({
            mutateAsync: vi.fn(),
        });
        mockUseBookPageScans.mockReturnValue({ data: [] });
        mockUseLegacyBookFiles.mockReturnValue({ data: [] });
        mockUseCreateBookPageScan.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
        mockUseUpdateBookPageScan.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
        mockUseDeleteBookPageScan.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
        mockUseCreateLegacyBookFiles.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
        mockUseDeleteLegacyBookFile.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    });

    it('treats books as archive records and saves new books without workflow mode', async () => {
        renderWithProviders(<NotarialBooksPage />, {
            route: appRoutes.paralegalBooks,
            path: appRoutes.paralegalBooks,
        });

        expect(screen.getByText('Book Archive')).toBeInTheDocument();
        expect(screen.getByText('Page-Indexed Scans')).toBeInTheDocument();
        expect(screen.getByText('Archive Files')).toBeInTheDocument();
        expect(screen.queryByText('Active Register Book')).not.toBeInTheDocument();
        expect(screen.queryByText('Legacy Scanned Book')).not.toBeInTheDocument();

        fireEvent.change(document.getElementById('notarial-book-number') as HTMLInputElement, {
            target: { value: '5' },
        });
        fireEvent.change(document.getElementById('notarial-book-year') as HTMLInputElement, {
            target: { value: '2027' },
        });
        fireEvent.change(document.getElementById('notarial-book-status') as HTMLSelectElement, {
            target: { value: 'archived' },
        });
        fireEvent.change(document.getElementById('notarial-book-notes') as HTMLTextAreaElement, {
            target: { value: 'Transferred from a physical archive.' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Save Book' }));

        await waitFor(() => {
            expect(mockCreateBook).toHaveBeenCalledWith({
                book_number: 5,
                year: 2027,
                status: 'archived',
                notes: 'Transferred from a physical archive.',
                file: null,
            });
        });

        const payload = mockCreateBook.mock.calls[0][0] as Record<string, unknown>;
        expect(payload).not.toHaveProperty('workflow_mode');
    });
});
