import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import {
    makeDocumentTransactionRow,
    makeDocumentTransactionsResponse,
} from '../../../../test/fixtures/tracking';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { Documents } from './Documents';

const { mockUseDebounce, mockUseDocumentTransactions } = vi.hoisted(() => ({
    mockUseDebounce: vi.fn(),
    mockUseDocumentTransactions: vi.fn(),
}));

vi.mock('../../../../hooks/useDebounce', () => ({
    useDebounce: mockUseDebounce,
}));

vi.mock('../../hooks/useDocumentTransactions', () => ({
    useDocumentTransactions: mockUseDocumentTransactions,
}));

vi.mock('../../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => <div data-testid="current-date-time" />,
}));

vi.mock('../document-detail/DocumentDetailPane', () => ({
    DocumentDetailPane: ({ ref }: { ref: string | null }) => (
        <div data-testid="detail-pane">{ref ?? 'none'}</div>
    ),
}));

describe('Documents', () => {
    beforeEach(() => {
        mockUseDebounce.mockReset();
        mockUseDocumentTransactions.mockReset();
        mockUseDebounce.mockImplementation((value: string) => value);
    });

    it('initializes paging from the URL query params and renders the table state', () => {
        mockUseDocumentTransactions.mockReturnValue({
            data: makeDocumentTransactionsResponse({
                meta: {
                    current_page: 2,
                    last_page: 3,
                    per_page: 25,
                    total: 60,
                },
            }),
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<Documents />, {
            route: `${appRoutes.documents}?page=2&per_page=25`,
            path: appRoutes.documents,
        });

        expect(mockUseDocumentTransactions).toHaveBeenCalledWith({
            search: undefined,
            type: undefined,
            page: 2,
            per_page: 25,
        });
        expect(screen.getByText('Documents')).toBeInTheDocument();
        expect(screen.getByText('of 3 pages')).toBeInTheDocument();
    });

    it('shows an error banner when the document transaction query fails', () => {
        mockUseDocumentTransactions.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        });

        renderWithProviders(<Documents />, {
            route: appRoutes.documents,
            path: appRoutes.documents,
        });

        expect(
            screen.getByText('Failed to load completed transactions. Please refresh the page.'),
        ).toBeInTheDocument();
    });

    it('shows the empty state for no completed transactions', () => {
        mockUseDocumentTransactions.mockReturnValue({
            data: makeDocumentTransactionsResponse({
                data: [],
                counts: {
                    completed: 0,
                    imports: 0,
                    exports: 0,
                    cancelled: 0,
                },
                meta: {
                    current_page: 1,
                    last_page: 1,
                    per_page: 10,
                    total: 0,
                },
            }),
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<Documents />, {
            route: appRoutes.documents,
            path: appRoutes.documents,
        });

        expect(screen.getByText('No completed transactions yet')).toBeInTheDocument();
        expect(
            screen.getByText(
                'Completed import and export transactions will appear here once all stages are done.',
            ),
        ).toBeInTheDocument();
    });

    it('updates the query inputs for search and type filter and resets the page', async () => {
        mockUseDocumentTransactions.mockReturnValue({
            data: makeDocumentTransactionsResponse({
                meta: {
                    current_page: 3,
                    last_page: 4,
                    per_page: 10,
                    total: 40,
                },
            }),
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<Documents />, {
            route: `${appRoutes.documents}?page=3&per_page=10`,
            path: appRoutes.documents,
        });

        fireEvent.change(screen.getByPlaceholderText('Search by BL No. or client…'), {
            target: { value: 'Acme' },
        });

        await waitFor(() => {
            expect(mockUseDocumentTransactions).toHaveBeenLastCalledWith({
                search: 'Acme',
                type: undefined,
                page: 1,
                per_page: 10,
            });
        });

        const typeSelect = screen.getAllByRole('combobox').find((el) => el.textContent?.includes('All Types'));
        expect(typeSelect).toBeTruthy();
        typeSelect!.focus();
        fireEvent.keyDown(typeSelect!, { key: 'ArrowDown' });
        const listbox = await screen.findByRole('listbox');
        fireEvent.click(await within(listbox).findByText('Export'));

        await waitFor(() => {
            expect(mockUseDocumentTransactions).toHaveBeenLastCalledWith({
                search: 'Acme',
                type: 'export',
                page: 1,
                per_page: 10,
            });
        });
    });

    it('selects a document when a row is clicked and syncs the ref to the URL', async () => {
        mockUseDocumentTransactions.mockReturnValue({
            data: makeDocumentTransactionsResponse({
                data: [
                    makeDocumentTransactionRow({
                        ref: 'IMP-2026-ALPHA',
                        client: 'ALPHA TRADING',
                    }),
                ],
            }),
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<Documents />, {
            route: appRoutes.documents,
            path: appRoutes.documents,
        });

        expect(screen.getByTestId('detail-pane')).toHaveTextContent('none');

        fireEvent.click(screen.getByText('Alpha Trading'));

        await waitFor(() => {
            expect(screen.getByTestId('detail-pane')).toHaveTextContent('IMP-2026-ALPHA');
        });
    });

    it('opens the detail pane from a ?ref= deep link', () => {
        mockUseDocumentTransactions.mockReturnValue({
            data: makeDocumentTransactionsResponse({
                data: [
                    makeDocumentTransactionRow({
                        ref: 'IMP-2026-ALPHA',
                        client: 'ALPHA TRADING',
                    }),
                ],
            }),
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<Documents />, {
            route: `${appRoutes.documents}?ref=IMP-2026-ALPHA`,
            path: appRoutes.documents,
        });

        expect(screen.getByTestId('detail-pane')).toHaveTextContent('IMP-2026-ALPHA');
    });
});
