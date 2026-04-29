import { fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import { RecordsPage } from './RecordsPage';

const {
    legacyUploadViewSpy,
    legacyBatchesPageSpy,
    legacyUploadCleanupSpy,
} = vi.hoisted(() => ({
    legacyUploadViewSpy: vi.fn(),
    legacyBatchesPageSpy: vi.fn(),
    legacyUploadCleanupSpy: vi.fn(),
}));

vi.mock('./ArchivesPage', () => ({
    ArchivesPage: () => <div data-testid="archives-page">Records Archive Content</div>,
}));

vi.mock('../legacy-upload/LegacyFolderUploadView', () => ({
    LegacyFolderUploadView: (props: {
        onOpenBatches?: () => void;
        resumeBatchId?: string | null;
        onResumeCleared?: () => void;
    }) => {
        legacyUploadViewSpy(props);
        useEffect(() => () => {
            legacyUploadCleanupSpy();
        }, []);

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

const renderRecordsPage = (initialPath: string = appRoutes.legacyFolderUpload) => render(
    <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
            <Route path={appRoutes.archivesWildcard} element={<RecordsPage />} />
        </Routes>
    </MemoryRouter>,
);

describe('RecordsPage', () => {
    beforeEach(() => {
        legacyUploadViewSpy.mockClear();
        legacyBatchesPageSpy.mockClear();
        legacyUploadCleanupSpy.mockClear();
    });

    it('redirects the records root to records archive', () => {
        renderRecordsPage(appRoutes.archives);

        expect(screen.getByTestId('archives-page')).toBeInTheDocument();
        expect(screen.getByTestId('archives-page')).toBeVisible();
    });

    it('shows the records archive workspace from the archive route', () => {
        renderRecordsPage(appRoutes.archiveTransactions);

        expect(screen.getByTestId('archives-page')).toBeInTheDocument();
        expect(screen.getByTestId('archives-page')).toBeVisible();
        expect(screen.getByTestId('legacy-upload-view')).not.toBeVisible();
        expect(screen.queryByTestId('legacy-batches-page')).not.toBeInTheDocument();
    });

    it('shows the legacy folder upload workspace from the upload route', () => {
        renderRecordsPage(appRoutes.legacyFolderUpload);

        expect(screen.getByTestId('legacy-upload-view')).toBeInTheDocument();
        expect(screen.getByTestId('legacy-upload-view')).toBeVisible();
        expect(screen.getByTestId('resume-batch-id')).toHaveTextContent('none');
        expect(screen.getByTestId('archives-page')).not.toBeVisible();
        expect(screen.queryByTestId('legacy-batches-page')).not.toBeInTheDocument();
    });

    it('shows the legacy batches workspace from the batches route', () => {
        renderRecordsPage(appRoutes.legacyBatches);

        expect(screen.getByTestId('legacy-batches-page')).toBeInTheDocument();
        expect(screen.getByTestId('legacy-batches-page')).toBeVisible();
        expect(screen.getByTestId('archives-page')).not.toBeVisible();
        expect(screen.getByTestId('legacy-upload-view')).not.toBeVisible();
    });

    it('routes a resume action from the batch list back into the upload view', () => {
        renderRecordsPage(appRoutes.legacyBatches);

        fireEvent.click(screen.getByRole('button', { name: /resume batch/i }));

        expect(screen.getByTestId('legacy-upload-view')).toBeInTheDocument();
        expect(screen.getByTestId('legacy-upload-view')).toBeVisible();
        expect(screen.getByTestId('resume-batch-id')).toHaveTextContent('batch-resume-1');
    });

    it('clears the resume batch id when opening the batch list from the upload view', () => {
        renderRecordsPage(appRoutes.legacyBatches);

        fireEvent.click(screen.getByRole('button', { name: /resume batch/i }));
        fireEvent.click(screen.getByRole('button', { name: /open batches/i }));

        expect(screen.getByTestId('legacy-batches-page')).toBeInTheDocument();
        expect(screen.getByTestId('legacy-batches-page')).toBeVisible();
        expect(screen.getByTestId('resume-batch-id')).toHaveTextContent('none');
    });

    it('keeps the legacy upload workspace mounted while opening legacy batches', () => {
        renderRecordsPage(appRoutes.legacyFolderUpload);

        fireEvent.click(screen.getByRole('button', { name: /open batches/i }));

        expect(screen.getByTestId('legacy-upload-view')).toBeInTheDocument();
        expect(screen.getByTestId('legacy-upload-view')).not.toBeVisible();
        expect(screen.getByTestId('legacy-batches-page')).toBeVisible();
        expect(legacyUploadCleanupSpy).not.toHaveBeenCalled();
    });
});
