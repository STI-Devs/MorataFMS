import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeApiDocument } from '../../../../test/fixtures/tracking';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { ProcessorUploadModal } from '../ProcessorUploadModal';

const {
    mockUseAddDocumentToCache,
    mockUseDocumentPreview,
    mockUseTransactionDocuments,
} = vi.hoisted(() => ({
    mockUseAddDocumentToCache: vi.fn(),
    mockUseDocumentPreview: vi.fn(),
    mockUseTransactionDocuments: vi.fn(),
}));

vi.mock('../../../tracking/hooks/useTransactionDocuments', () => ({
    useTransactionDocuments: mockUseTransactionDocuments,
    useAddDocumentToCache: mockUseAddDocumentToCache,
}));

vi.mock('../../../tracking/hooks/useDocumentPreview', () => ({
    useDocumentPreview: mockUseDocumentPreview,
}));

vi.mock('../../../tracking/api/trackingApi', () => ({
    trackingApi: {
        deleteDocument: vi.fn(),
        downloadDocument: vi.fn(),
        uploadDocuments: vi.fn(),
    },
}));

vi.mock('../../../tracking/components/StageRow', () => ({
    StageRow: ({
        stage,
        stageStatus,
        uploadDisabledReason,
    }: {
        stage: { title: string };
        stageStatus: string;
        uploadDisabledReason?: string | null;
    }) => (
        <div data-testid={`stage-${stage.title}`}>
            <span>{stage.title}</span>
            <span>{stageStatus}</span>
            {uploadDisabledReason ? <span>{uploadDisabledReason}</span> : null}
        </div>
    ),
}));

vi.mock('../../../../components/modals/UploadModal', () => ({
    UploadModal: () => null,
}));

vi.mock('../../../../components/modals/FilePreviewModal', () => ({
    FilePreviewModal: () => null,
}));

describe('ProcessorUploadModal', () => {
    beforeEach(() => {
        mockUseAddDocumentToCache.mockReset();
        mockUseDocumentPreview.mockReset();
        mockUseTransactionDocuments.mockReset();

        mockUseAddDocumentToCache.mockReturnValue(vi.fn());
        mockUseDocumentPreview.mockReturnValue({
            previewFile: null,
            setPreviewFile: vi.fn(),
            handlePreviewDoc: vi.fn(),
        });
        mockUseTransactionDocuments.mockReturnValue({
            byStageIndex: {
                0: [],
                1: [],
            },
            isLoading: false,
        });
    });

    it('marks future processor stages as waiting until earlier stages are completed', () => {
        renderWithProviders(
            <ProcessorUploadModal
                isOpen
                onClose={vi.fn()}
                transactionId={1}
                reference="REF-IMP-001"
                type="import"
                clientName="Acme Imports"
                transactionStages={{
                    boc: 'completed',
                    bonds: 'completed',
                    phytosanitary: 'completed',
                    ppa: 'pending',
                    do: 'pending',
                    port_charges: 'pending',
                    releasing: 'pending',
                    billing: 'pending',
                }}
            />,
        );

        expect(screen.getByTestId('stage-PPA')).toHaveTextContent('active');
        expect(screen.getByTestId('stage-Port Charges')).toHaveTextContent('pending');
        expect(screen.getByText('Waiting for earlier stages to be completed first.')).toBeInTheDocument();
    });

    it('keeps completed stage rows usable from uploaded documents', () => {
        mockUseTransactionDocuments.mockReturnValue({
            byStageIndex: {
                0: [makeApiDocument({ id: 41, type: 'ppa', filename: 'ppa.pdf' })],
                1: [],
            },
            isLoading: false,
        });

        renderWithProviders(
            <ProcessorUploadModal
                isOpen
                onClose={vi.fn()}
                transactionId={1}
                reference="REF-IMP-001"
                type="import"
                clientName="Acme Imports"
                transactionStages={{
                    boc: 'completed',
                    bonds: 'completed',
                    phytosanitary: 'completed',
                    ppa: 'completed',
                    do: 'completed',
                    port_charges: 'pending',
                    releasing: 'pending',
                    billing: 'pending',
                }}
            />,
        );

        expect(screen.getByTestId('stage-PPA')).toHaveTextContent('completed');
        expect(screen.getByTestId('stage-Port Charges')).toHaveTextContent('active');
    });
});
