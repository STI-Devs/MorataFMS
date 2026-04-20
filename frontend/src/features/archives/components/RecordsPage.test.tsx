import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RecordsPage } from './RecordsPage';

// Mock the two heavy sub-views so this test stays a pure shell smoke test
vi.mock('./ArchivesPage', () => ({
    ArchivesPage: () => <div data-testid="archives-page">Archive Transactions Content</div>,
}));

vi.mock('./LegacyFolderUploadView', () => ({
    LegacyFolderUploadView: () => <div data-testid="legacy-upload-view">Legacy Folder Upload Content</div>,
}));

describe('RecordsPage', () => {
    it('renders the page header with the title Records', () => {
        render(<RecordsPage />);
        expect(screen.getByRole('heading', { name: /records/i })).toBeInTheDocument();
    });

    it('renders both sub-navigation tabs', () => {
        render(<RecordsPage />);
        expect(screen.getByRole('button', { name: /archive transactions/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /legacy folder upload/i })).toBeInTheDocument();
    });

    it('shows the Legacy Folder Upload view by default', () => {
        render(<RecordsPage />);
        expect(screen.getByTestId('legacy-upload-view')).toBeInTheDocument();
        expect(screen.queryByTestId('archives-page')).not.toBeInTheDocument();
    });

    it('switches to Archive Transactions when that tab is clicked', () => {
        render(<RecordsPage />);
        fireEvent.click(screen.getByRole('button', { name: /archive transactions/i }));
        expect(screen.getByTestId('archives-page')).toBeInTheDocument();
        expect(screen.queryByTestId('legacy-upload-view')).not.toBeInTheDocument();
    });

    it('switches back to Legacy Folder Upload when that tab is clicked again', () => {
        render(<RecordsPage />);
        fireEvent.click(screen.getByRole('button', { name: /archive transactions/i }));
        fireEvent.click(screen.getByRole('button', { name: /legacy folder upload/i }));
        expect(screen.getByTestId('legacy-upload-view')).toBeInTheDocument();
        expect(screen.queryByTestId('archives-page')).not.toBeInTheDocument();
    });

    it('renders the descriptive subtitle text', () => {
        render(<RecordsPage />);
        expect(screen.getByText(/manage normalized archive transactions/i)).toBeInTheDocument();
    });
});
