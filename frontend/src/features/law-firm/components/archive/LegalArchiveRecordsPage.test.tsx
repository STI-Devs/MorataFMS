import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { LegalArchiveRecordsPage } from './LegalArchiveRecordsPage';

const {
    mockUseLegalCatalog,
    mockUseLegalArchive,
} = vi.hoisted(() => ({
    mockUseLegalCatalog: vi.fn(),
    mockUseLegalArchive: vi.fn(),
}));

vi.mock('../../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => <div data-testid="current-date-time" />,
}));

vi.mock('../../hooks/useLegalWorkspace', () => ({
    useLegalCatalog: mockUseLegalCatalog,
    useLegalArchive: mockUseLegalArchive,
}));

describe('LegalArchiveRecordsPage', () => {
    beforeEach(() => {
        mockUseLegalCatalog.mockReturnValue({
            data: {
                legal_file_categories: [
                    {
                        code: 'case_documents',
                        label: 'Case Documents',
                        description: 'Case archive files.',
                    },
                ],
            },
        });

        mockUseLegalArchive.mockImplementation((params?: { upload_status?: string; per_page?: number }) => {
            if (params?.upload_status === 'missing_upload' && params?.per_page === 1) {
                return {
                    data: {
                        data: [],
                        meta: {
                            current_page: 1,
                            last_page: 1,
                            per_page: 1,
                            total: 2,
                        },
                    },
                };
            }

            return {
                data: {
                    data: [
                        {
                            id: 41,
                            file_category: 'case_documents',
                            file_category_label: 'Case Documents',
                            file_code: 'DEMAND_LETTER',
                            file_code_label: 'Demand Letter',
                            title: 'Demand Letter',
                            related_name: 'Pedro Santos',
                            document_date: '2026-04-23',
                            notes: null,
                            upload_status: 'uploaded',
                            file: {
                                filename: 'demand-letter.pdf',
                                formatted_size: '220 KB',
                            },
                        },
                    ],
                    meta: {
                        current_page: 1,
                        last_page: 1,
                        per_page: 12,
                        total: 1,
                    },
                },
            };
        });
    });

    it('renders archive records and pushes archive filters through the archive hook', async () => {
        renderWithProviders(<LegalArchiveRecordsPage />, {
            route: appRoutes.paralegalLegalFileRecords,
            path: appRoutes.paralegalLegalFileRecords,
        });

        const searchInput = screen.getByPlaceholderText('Search title or related name...');
        const categoryFilter = document.getElementById('legal-archive-records-category-filter') as HTMLSelectElement;
        const statusFilter = document.getElementById('legal-archive-records-status-filter') as HTMLSelectElement;
        const perPageFilter = document.getElementById('legal-archive-records-per-page') as HTMLSelectElement;

        fireEvent.change(searchInput, {
            target: { value: 'Pedro' },
        });
        fireEvent.change(categoryFilter, {
            target: { value: 'case_documents' },
        });
        fireEvent.change(statusFilter, {
            target: { value: 'uploaded' },
        });
        fireEvent.change(perPageFilter, {
            target: { value: '100' },
        });

        // "Legal File Records" renders as both an h1 title and an h2 section header.
        expect(screen.getByRole('heading', { level: 1, name: 'Legal File Records' })).toBeInTheDocument();
        // "Demand Letter" appears as both the file_code_label headline and the title subline.
        expect(screen.getAllByText('Demand Letter').length).toBeGreaterThan(0);
        expect(screen.getByText('Pedro Santos')).toBeInTheDocument();
        expect(screen.getAllByText('Uploaded').length).toBeGreaterThan(0);
        expect(perPageFilter).toHaveValue('100');

        await waitFor(() => {
            expect(mockUseLegalArchive).toHaveBeenCalledWith(expect.objectContaining({
                search: 'Pedro',
                file_category: 'case_documents',
                upload_status: 'uploaded',
                per_page: 100,
            }));
        });
    });
});
