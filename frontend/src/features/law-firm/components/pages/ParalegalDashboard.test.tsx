import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import { ParalegalDashboard } from './ParalegalDashboard';

const { mockNavigate } = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
}));

const {
    mockUseLegalBooks,
    mockUseNotarialTemplates,
    mockUseNotarialTemplateRecords,
    mockUseLegalArchive,
    mockUseAuth,
} = vi.hoisted(() => ({
    mockUseLegalBooks: vi.fn(),
    mockUseNotarialTemplates: vi.fn(),
    mockUseNotarialTemplateRecords: vi.fn(),
    mockUseLegalArchive: vi.fn(),
    mockUseAuth: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => <div data-testid="current-date-time" />,
}));

vi.mock('../../hooks/useLegalWorkspace', () => ({
    useLegalBooks: mockUseLegalBooks,
    useNotarialTemplates: mockUseNotarialTemplates,
    useNotarialTemplateRecords: mockUseNotarialTemplateRecords,
    useLegalArchive: mockUseLegalArchive,
}));

vi.mock('../../../auth', () => ({
    useAuth: mockUseAuth,
}));

describe('ParalegalDashboard', () => {
    beforeEach(() => {
        mockNavigate.mockReset();

        mockUseAuth.mockReturnValue({
            user: {
                id: 1,
                name: 'Paralegal Test',
                role: 'paralegal',
                departments: ['legal'],
                permissions: {
                    access_legal_module: true,
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
                        page_scan_count: 2,
                        legacy_file_count: 1,
                        notes: null,
                        scan_file: null,
                        opened_at: null,
                        closed_at: null,
                        created_at: null,
                        updated_at: null,
                    },
                ],
            },
        });

        mockUseNotarialTemplates.mockImplementation((params?: { template_status?: string }) => ({
            data: {
                meta: {
                    total: params?.template_status === 'ready' ? 3 : 5,
                },
            },
        }));

        mockUseNotarialTemplateRecords.mockReturnValue({
            data: {
                meta: {
                    total: 12,
                },
            },
        });

        mockUseLegalArchive.mockReturnValue({
            data: {
                meta: {
                    total: 9,
                },
            },
        });
    });

    it('surfaces the new template-generator workflow and routes cards to the template, records, and archive pages', () => {
        render(
            <MemoryRouter>
                <ParalegalDashboard />
            </MemoryRouter>,
        );

        expect(screen.getByRole('button', { name: /template generator/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /generated records/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /book archive/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /legal file encode/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /legal file records/i })).toBeInTheDocument();
        expect(screen.getByText('Book 2')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('9')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /notarial register/i })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /template generator/i }));
        fireEvent.click(screen.getByRole('button', { name: /generated records/i }));
        fireEvent.click(screen.getByRole('button', { name: /book archive/i }));

        expect(mockNavigate).toHaveBeenNthCalledWith(1, appRoutes.paralegalNotarial);
        expect(mockNavigate).toHaveBeenNthCalledWith(2, appRoutes.paralegalRecords);
        expect(mockNavigate).toHaveBeenNthCalledWith(3, appRoutes.paralegalBooks);
    });
});
