import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArchivesPage } from './ArchivesPage';

const useArchivesMock = vi.fn();
const exportArchiveCSVMock = vi.fn();

vi.mock('../../hooks/useArchives', () => ({
    useArchives: () => useArchivesMock(),
}));

vi.mock('../../../auth/hooks/useAuth', () => ({
    useAuth: () => ({
        user: {
            id: 1,
            role: 'admin',
            name: 'Admin User',
        },
    }),
}));

vi.mock('../../utils/export.utils', () => ({
    exportArchiveCSV: (...args: unknown[]) => exportArchiveCSVMock(...args),
}));

vi.mock('../../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => <div data-testid="current-date-time">07:03 PM</div>,
}));

vi.mock('../workspace/ArchivesFolderView', () => ({
    ArchivesFolderView: () => <div data-testid="archives-folder-view">Archive folder rows</div>,
}));

vi.mock('../workspace/ArchivesViews', () => ({
    ArchivesBLView: () => <div />,
    ArchivesDocumentView: () => <div />,
    GlobalSearchResults: () => <div />,
}));

const renderArchivesPage = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <ArchivesPage />
        </QueryClientProvider>,
    );
};

describe('ArchivesPage', () => {
    beforeEach(() => {
        useArchivesMock.mockReturnValue({
            data: [],
            isLoading: false,
            isError: false,
        });
        exportArchiveCSVMock.mockClear();
    });

    it('renders the compact archive console header and summary labels', () => {
        renderArchivesPage();

        expect(screen.getByRole('heading', { name: /records archive/i })).toBeInTheDocument();
        expect(screen.getByText(/search preserved import and export records/i)).toBeInTheDocument();
        expect(screen.getByText(/records control/i)).toBeInTheDocument();
        expect(screen.getByText(/brokerage records workspace/i)).toBeInTheDocument();
        expect(screen.getByText(/completion/i)).toBeInTheDocument();
        expect(screen.getByText(/^BL Records$/i)).toBeInTheDocument();
        expect(screen.getAllByText(/^Incomplete$/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/^Storage$/i)).toBeInTheDocument();
        expect(screen.getByText(/records browser/i)).toBeInTheDocument();
        expect(screen.getByTestId('archives-folder-view')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/search bl number, client, or vessel/i)).toBeInTheDocument();
    });

    it('keeps export and upload actions available in the filter strip', () => {
        renderArchivesPage();

        fireEvent.click(screen.getByRole('button', { name: /export csv/i }));

        expect(exportArchiveCSVMock).toHaveBeenCalledWith([], {
            year: 'all',
            type: 'all',
            status: 'all',
        });
        expect(screen.getByRole('button', { name: /upload document/i })).toBeInTheDocument();
    });
});
