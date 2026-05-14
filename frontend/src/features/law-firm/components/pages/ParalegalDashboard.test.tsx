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
    mockUseNotarialGeneratedDocuments,
    mockUseAuth,
} = vi.hoisted(() => ({
    mockUseLegalBooks: vi.fn(),
    mockUseNotarialTemplates: vi.fn(),
    mockUseNotarialGeneratedDocuments: vi.fn(),
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
    useNotarialGeneratedDocuments: mockUseNotarialGeneratedDocuments,
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
                    view_notarial_books: true,
                    manage_notarial_books: true,
                    manage_notarial_templates: true,
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

        mockUseNotarialGeneratedDocuments.mockImplementation((params?: { module?: string }) => ({
            data: {
                meta: {
                    total: params?.module === 'legal' ? 9 : 12,
                },
            },
        }));
    });

    it('surfaces the new template-generator workflow and routes cards to the template, records, and archive pages', () => {
        render(
            <MemoryRouter>
                <ParalegalDashboard />
            </MemoryRouter>,
        );

        expect(screen.getByRole('button', { name: /Select a master, create a working copy/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Search and reopen editable Word outputs/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Book Register/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /legal create draft/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /legal file masters/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /legal generated documents/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /legacy records/i })).toBeInTheDocument();
        expect(screen.getByText('Book 2')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('9')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Notarial Register/i })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /Select a master, create a working copy/i }));
        fireEvent.click(screen.getByRole('button', { name: /Search and reopen editable Word outputs/i }));
        fireEvent.click(screen.getByRole('button', { name: /Book Register/i }));
        fireEvent.click(screen.getByRole('button', { name: /legacy records/i }));

        expect(mockNavigate).toHaveBeenNthCalledWith(1, appRoutes.paralegalGenerator);
        expect(mockNavigate).toHaveBeenNthCalledWith(2, appRoutes.paralegalGeneratedDocuments);
        expect(mockNavigate).toHaveBeenNthCalledWith(3, appRoutes.paralegalBooks);
        expect(mockNavigate).toHaveBeenNthCalledWith(4, appRoutes.paralegalLegacyFolderUpload);
    });
});
