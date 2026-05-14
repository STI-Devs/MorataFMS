import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import { LegacyRecordsPage } from './LegacyRecordsPage';

const {
    legacyUploadViewSpy,
    legacyBatchesPageSpy,
} = vi.hoisted(() => ({
    legacyUploadViewSpy: vi.fn(),
    legacyBatchesPageSpy: vi.fn(),
}));

vi.mock('../../../archives/components/legacy-upload/LegacyFolderUploadView', () => ({
    LegacyFolderUploadView: (props: {
        module?: string;
        departmentOptions?: Array<{ label: string; value: string }>;
        resolveModuleFromMeta?: (meta: { department: string }) => string;
        defaultMeta?: { department?: string };
        lockDepartment?: boolean;
        onOpenBatches?: (module?: string) => void;
        resumeBatchId?: string | null;
    }) => {
        legacyUploadViewSpy(props);

        return (
            <div data-testid="legacy-upload-view">
                Legacy Upload Content
                <span data-testid="resume-batch-id">{props.resumeBatchId ?? 'none'}</span>
                <span data-testid="legal-module">{props.resolveModuleFromMeta?.({ department: 'Legal' }) ?? 'none'}</span>
                <button type="button" onClick={() => props.onOpenBatches?.('legal')}>
                    Open legal batches
                </button>
            </div>
        );
    },
}));

vi.mock('../../../archives/components/pages/LegacyBatchesPage', () => ({
    LegacyBatchesPage: (props: {
        module?: string;
        onResumeBatch?: (batchId: string) => void;
    }) => {
        legacyBatchesPageSpy(props);

        return (
            <div data-testid="legacy-batches-page">
                Legacy Batches Content
                <button type="button" onClick={() => props.onResumeBatch?.('legacy-batch-1')}>
                    Resume batch
                </button>
            </div>
        );
    },
}));

describe('LegacyRecordsPage', () => {
    beforeEach(() => {
        legacyUploadViewSpy.mockClear();
        legacyBatchesPageSpy.mockClear();
    });

    const renderLegacyRecordsPage = (initialPath: string = appRoutes.paralegalLegacyFolderUpload) => render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route path={appRoutes.paralegalLegacyRecordsWildcard} element={<LegacyRecordsPage />} />
            </Routes>
        </MemoryRouter>,
    );

    it('uses the upload route without a top-level notarial/legal selector and lets Department drive the module', () => {
        renderLegacyRecordsPage();

        expect(screen.getByText('Legacy Folder Upload')).toBeInTheDocument();
        expect(screen.getByTestId('legacy-upload-view')).toBeInTheDocument();
        expect(legacyUploadViewSpy).toHaveBeenLastCalledWith(expect.objectContaining({
            module: 'notarial',
            departmentOptions: [
                { label: 'Notarial', value: 'Notarial' },
                { label: 'Legal', value: 'Legal' },
            ],
        }));
        expect(screen.queryByRole('button', { name: /notarial records/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /legal records/i })).not.toBeInTheDocument();
        expect(screen.getByTestId('legal-module')).toHaveTextContent('legal');

        fireEvent.click(screen.getByRole('button', { name: /open legal batches/i }));

        expect(screen.getByTestId('legacy-batches-page')).toBeInTheDocument();
        expect(screen.getByText('Legal Batches')).toBeInTheDocument();
        expect(legacyBatchesPageSpy).toHaveBeenLastCalledWith(expect.objectContaining({
            module: 'legal',
        }));
    });

    it('uses the notarial batches route directly', () => {
        renderLegacyRecordsPage(appRoutes.paralegalLegacyNotarialBatches);

        expect(screen.getByText('Notarial Batches')).toBeInTheDocument();
        expect(screen.getByTestId('legacy-batches-page')).toBeVisible();
        expect(legacyBatchesPageSpy).toHaveBeenLastCalledWith(expect.objectContaining({
            module: 'notarial',
        }));
    });

    it('uses the legal batches route directly', () => {
        renderLegacyRecordsPage(appRoutes.paralegalLegacyLegalBatches);

        expect(screen.getByText('Legal Batches')).toBeInTheDocument();
        expect(screen.getByTestId('legacy-batches-page')).toBeVisible();
        expect(legacyBatchesPageSpy).toHaveBeenLastCalledWith(expect.objectContaining({
            module: 'legal',
        }));
    });

    it('routes a batch resume action back to the upload route', () => {
        renderLegacyRecordsPage(appRoutes.paralegalLegacyLegalBatches);

        fireEvent.click(screen.getByRole('button', { name: /resume batch/i }));

        expect(screen.getByTestId('legacy-upload-view')).toBeInTheDocument();
        expect(screen.getByTestId('legacy-upload-view')).toBeVisible();
        expect(screen.getByTestId('resume-batch-id')).toHaveTextContent('legacy-batch-1');
    });
});
