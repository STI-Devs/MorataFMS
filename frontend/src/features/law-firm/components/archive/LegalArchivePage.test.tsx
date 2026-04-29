import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { LegalArchivePage } from './LegalArchivePage';

const {
    mockUseLegalCatalog,
    mockUseLegalArchive,
    mockUseCreateLegalArchiveRecord,
    mockCreateArchiveRecord,
} = vi.hoisted(() => ({
    mockUseLegalCatalog: vi.fn(),
    mockUseLegalArchive: vi.fn(),
    mockUseCreateLegalArchiveRecord: vi.fn(),
    mockCreateArchiveRecord: vi.fn(),
}));

vi.mock('../../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => <div data-testid="current-date-time" />,
}));

vi.mock('../../hooks/useLegalWorkspace', () => ({
    useLegalCatalog: mockUseLegalCatalog,
    useLegalArchive: mockUseLegalArchive,
    useCreateLegalArchiveRecord: mockUseCreateLegalArchiveRecord,
}));

describe('LegalArchivePage', () => {
    beforeEach(() => {
        mockCreateArchiveRecord.mockReset();

        mockUseLegalCatalog.mockReturnValue({
            data: {
                notarial_act_types: [],
                categories: [],
                document_types: [],
                grouped_document_types: [],
                legal_file_categories: [
                    {
                        code: 'intern_records',
                        label: 'Intern Records',
                        description: 'Intern archive files.',
                    },
                    {
                        code: 'case_documents',
                        label: 'Case Documents',
                        description: 'Case archive files.',
                    },
                ],
                legal_file_types: [
                    {
                        code: 'CERTIFICATE_OF_COMPLETION_INTERNS',
                        label: 'Certificate of Completion (Interns)',
                        category: 'intern_records',
                    },
                    {
                        code: 'DEMAND_LETTER',
                        label: 'Demand Letter',
                        category: 'case_documents',
                    },
                ],
                grouped_legal_file_types: [
                    {
                        code: 'intern_records',
                        label: 'Intern Records',
                        description: 'Intern archive files.',
                        file_types: [
                            {
                                code: 'CERTIFICATE_OF_COMPLETION_INTERNS',
                                label: 'Certificate of Completion (Interns)',
                                category: 'intern_records',
                            },
                        ],
                    },
                    {
                        code: 'case_documents',
                        label: 'Case Documents',
                        description: 'Case archive files.',
                        file_types: [
                            {
                                code: 'DEMAND_LETTER',
                                label: 'Demand Letter',
                                category: 'case_documents',
                            },
                        ],
                    },
                ],
            },
        });

        mockUseLegalArchive.mockReturnValue({
            data: {
                data: [
                    {
                        id: 5,
                        file_category: 'intern_records',
                        file_category_label: 'Intern Records',
                        file_code: 'CERTIFICATE_OF_COMPLETION_INTERNS',
                        file_code_label: 'Certificate of Completion (Interns)',
                        title: 'Certificate of Completion (Interns)',
                        related_name: 'Intern Batch 2026',
                        document_date: '2026-04-20',
                        notes: null,
                        upload_status: 'uploaded',
                        file: null,
                        created_at: '2026-04-20T00:00:00.000Z',
                        updated_at: '2026-04-20T00:00:00.000Z',
                    },
                ],
                meta: {
                    current_page: 1,
                    last_page: 1,
                    per_page: 5,
                    total: 1,
                },
            },
        });

        mockUseCreateLegalArchiveRecord.mockReturnValue({
            mutateAsync: mockCreateArchiveRecord.mockResolvedValue({ id: 101 }),
            isPending: false,
        });
    });

    it('renders the archive-only workspace and saves a non-notarial legal file', async () => {
        renderWithProviders(<LegalArchivePage />, {
            route: appRoutes.paralegalLegalFiles,
            path: appRoutes.paralegalLegalFiles,
        });

        expect(screen.getByText('Legal File Archive')).toBeInTheDocument();
        expect(screen.getByText('Archive File Selector')).toBeInTheDocument();
        expect(screen.queryByText(/Book \/ Document No./i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Notarial Act/i)).not.toBeInTheDocument();
        expect(screen.getByText('Selected: Certificate of Completion (Interns)')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Case Documents/i }));

        expect(screen.getByText('Selected: Demand Letter')).toBeInTheDocument();

        fireEvent.change(document.getElementById('legal-archive-related-name') as HTMLInputElement, {
            target: { value: 'Pedro Santos' },
        });
        fireEvent.change(document.getElementById('legal-archive-document-date') as HTMLInputElement, {
            target: { value: '2026-04-23' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'Save Legal File' }));

        await waitFor(() => {
            expect(mockCreateArchiveRecord).toHaveBeenCalledWith(expect.objectContaining({
                file_category: 'case_documents',
                file_code: 'DEMAND_LETTER',
                related_name: 'Pedro Santos',
                document_date: '2026-04-23',
            }));
        });
    });
});
