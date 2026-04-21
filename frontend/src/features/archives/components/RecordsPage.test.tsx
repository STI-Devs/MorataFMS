import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecordsPage } from './RecordsPage';

const {
    legacyUploadViewSpy,
    legacyBatchesPageSpy,
} = vi.hoisted(() => ({
    legacyUploadViewSpy: vi.fn(),
    legacyBatchesPageSpy: vi.fn(),
}));

vi.mock('./ArchivesPage', () => ({
    ArchivesPage: () => <div data-testid="archives-page">Archive Transactions Content</div>,
}));

vi.mock('./LegacyFolderUploadView', () => ({
    LegacyFolderUploadView: (props: {
        onOpenBatches?: () => void;
        resumeBatchId?: string | null;
        onResumeCleared?: () => void;
    }) => {
        legacyUploadViewSpy(props);

        return (
            <div data-testid="legacy-upload-view">
                Legacy Folder Upload Content
                <span data-testid="resume-batch-id">{props.resumeBatchId ?? 'none'}</span>
                <button type="button" onClick={() => props.onOpenBatches?.()}>
                    Open batches
                </button>
                <button type="button" onClick={() => props.onResumeCleared?.()}>
                    Clear resume
                </button>
            </div>
        );
    },
}));

vi.mock('./LegacyBatchesPage', () => ({
    LegacyBatchesPage: (props: { onResumeBatch?: (batchId: string) => void }) => {
        legacyBatchesPageSpy(props);

        return (
            <div data-testid="legacy-batches-page">
                Legacy Batches Content
                <button type="button" onClick={() => props.onResumeBatch?.('batch-resume-1')}>
                    Resume batch
                </button>
            </div>
        );
    },
}));

describe('RecordsPage', () => {
    beforeEach(() => {
        legacyUploadViewSpy.mockClear();
        legacyBatchesPageSpy.mockClear();
    });

    it('renders the page header with the title Records', () => {
        render(<RecordsPage />);
        expect(screen.getByRole('heading', { name: /records/i })).toBeInTheDocument();
    });

    it('renders all sub-navigation tabs', () => {
        render(<RecordsPage />);
        expect(screen.getByRole('button', { name: /archive transactions/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /legacy folder upload/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /legacy batches/i })).toBeInTheDocument();
    });

    it('shows the Legacy Folder Upload view by default', () => {
        render(<RecordsPage />);
        expect(screen.getByTestId('legacy-upload-view')).toBeInTheDocument();
        expect(screen.queryByTestId('archives-page')).not.toBeInTheDocument();
        expect(screen.queryByTestId('legacy-batches-page')).not.toBeInTheDocument();
    });

    it('switches to Archive Transactions when that tab is clicked', () => {
        render(<RecordsPage />);
        fireEvent.click(screen.getByRole('button', { name: /archive transactions/i }));
        expect(screen.getByTestId('archives-page')).toBeInTheDocument();
        expect(screen.queryByTestId('legacy-upload-view')).not.toBeInTheDocument();
        expect(screen.queryByTestId('legacy-batches-page')).not.toBeInTheDocument();
    });

    it('switches to Legacy Batches when that tab is clicked', () => {
        render(<RecordsPage />);
        fireEvent.click(screen.getByRole('button', { name: /legacy batches/i }));
        expect(screen.getByTestId('legacy-batches-page')).toBeInTheDocument();
        expect(screen.queryByTestId('legacy-upload-view')).not.toBeInTheDocument();
        expect(screen.queryByTestId('archives-page')).not.toBeInTheDocument();
    });

    it('routes a resume action from the batch list back into the upload view', () => {
        render(<RecordsPage />);

        fireEvent.click(screen.getByRole('button', { name: /legacy batches/i }));
        fireEvent.click(screen.getByRole('button', { name: /resume batch/i }));

        expect(screen.getByTestId('legacy-upload-view')).toBeInTheDocument();
        expect(screen.getByTestId('resume-batch-id')).toHaveTextContent('batch-resume-1');
    });

    it('clears the resume batch id when opening the batch list from the upload view', () => {
        render(<RecordsPage />);

        fireEvent.click(screen.getByRole('button', { name: /legacy batches/i }));
        fireEvent.click(screen.getByRole('button', { name: /resume batch/i }));
        fireEvent.click(screen.getByRole('button', { name: /open batches/i }));

        expect(screen.getByTestId('legacy-batches-page')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /legacy folder upload/i }));
        expect(screen.getByTestId('resume-batch-id')).toHaveTextContent('none');
    });

    it('renders the descriptive subtitle text', () => {
        render(<RecordsPage />);
        expect(screen.getByText(/archive operations and legacy folders/i)).toBeInTheDocument();
    });
});
