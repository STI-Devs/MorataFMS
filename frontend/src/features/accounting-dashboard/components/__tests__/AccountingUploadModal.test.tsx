import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { AccountingUploadModal } from '../AccountingUploadModal';

const {
    mockUseAddDocumentToCache,
    mockUseDocumentPreview,
    mockUseTransactionDocuments,
} = vi.hoisted(() => ({
    mockUseAddDocumentToCache: vi.fn(),
    mockUseDocumentPreview: vi.fn(),
    mockUseTransactionDocuments: vi.fn(),
}));

const trackingApiMock = vi.hoisted(() => ({
    deleteDocument: vi.fn(),
    downloadDocument: vi.fn(),
    uploadDocuments: vi.fn(),
    uploadVesselBillingDocuments: vi.fn(),
}));

vi.mock('../../../tracking/hooks/useTransactionDocuments', () => ({
    useTransactionDocuments: mockUseTransactionDocuments,
    useAddDocumentToCache: mockUseAddDocumentToCache,
}));

vi.mock('../../../tracking/hooks/useDocumentPreview', () => ({
    useDocumentPreview: mockUseDocumentPreview,
}));

vi.mock('../../../tracking/api/trackingApi', () => ({
    trackingApi: trackingApiMock,
}));

vi.mock('../../../../components/modals/FilePreviewModal', () => ({
    FilePreviewModal: () => null,
}));

vi.mock('../../../tracking/components/lists/StageRow', () => ({
    StageRow: ({
        stage,
        onUploadClick,
    }: {
        stage: { title: string };
        onUploadClick: (index: number) => void;
    }) => (
        <button type="button" onClick={() => onUploadClick(0)}>
            Open {stage.title}
        </button>
    ),
}));

vi.mock('../../../../components/modals/UploadModal', () => ({
    UploadModal: ({
        isOpen,
        onUpload,
        contextContent,
        submitLabel,
    }: {
        isOpen: boolean;
        onUpload: (files: File[]) => Promise<void> | void;
        contextContent?: ReactNode;
        submitLabel?: string;
    }) => {
        if (!isOpen) {
            return null;
        }

        return (
            <div>
                {contextContent}
                {submitLabel ? <span>{submitLabel}</span> : null}
                <button
                    type="button"
                    onClick={() => onUpload([new File(['billing'], 'billing.pdf', { type: 'application/pdf' })])}
                >
                    Confirm Upload
                </button>
            </div>
        );
    },
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
    },
}));

describe('AccountingUploadModal', () => {
    beforeEach(() => {
        mockUseAddDocumentToCache.mockReset();
        mockUseDocumentPreview.mockReset();
        mockUseTransactionDocuments.mockReset();
        trackingApiMock.deleteDocument.mockReset();
        trackingApiMock.downloadDocument.mockReset();
        trackingApiMock.uploadDocuments.mockReset();
        trackingApiMock.uploadVesselBillingDocuments.mockReset();

        mockUseAddDocumentToCache.mockReturnValue(vi.fn());
        mockUseDocumentPreview.mockReturnValue({
            previewFile: null,
            setPreviewFile: vi.fn(),
            handlePreviewDoc: vi.fn(),
        });
        mockUseTransactionDocuments.mockReturnValue({
            byStageIndex: {
                0: [],
            },
            isLoading: false,
        });
        trackingApiMock.uploadVesselBillingDocuments.mockResolvedValue({
            vessel_name: 'MV Shared Ledger',
            affected_transaction_ids: [11, 12, 13],
            affected_transactions_count: 3,
            uploaded_documents_count: 3,
        });
        trackingApiMock.uploadDocuments.mockResolvedValue([]);
    });

    it('shows a single-vs-vessel scope chooser for direct BL uploads', () => {
        renderWithProviders(
            <AccountingUploadModal
                isOpen
                onClose={vi.fn()}
                transactionId={11}
                reference="REF-ACC-011"
                type="import"
                clientName="Acme Imports"
                vesselName="MV Shared Ledger"
                vesselUploadCount={3}
                entryMode="single-transaction"
                transactionStages={{
                    boc: 'completed',
                    bonds: 'completed',
                    ppa: 'completed',
                    do: 'completed',
                    port_charges: 'completed',
                    releasing: 'completed',
                    billing: 'pending',
                }}
            />,
        );

        expect(screen.getByText('Shared Vessel Upload Available')).toBeInTheDocument();
        expect(screen.getByText(/mv shared ledger has 3 billing-ready transactions that can use the same billing & liquidation files/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /open billing & liquidation/i }));

        expect(screen.getByText('Upload Scope')).toBeInTheDocument();
        expect(screen.getByText('This Transaction')).toBeInTheDocument();
        expect(screen.getAllByText('Apply To Entire Vessel').length).toBeGreaterThan(0);
        expect(screen.getByText(/apply the same billing files to all 3 billing-ready bls/i)).toBeInTheDocument();
        expect(screen.getByText('Apply to 3 Ready BLs')).toBeInTheDocument();
    });

    it('opens a shared-vessel upload without showing the single-transaction scope card', () => {
        renderWithProviders(
            <AccountingUploadModal
                isOpen
                onClose={vi.fn()}
                transactionId={11}
                reference="REF-ACC-011"
                type="import"
                clientName="Acme Imports"
                vesselName="MV Shared Ledger"
                vesselUploadCount={3}
                entryMode="shared-vessel"
                transactionStages={{
                    boc: 'completed',
                    bonds: 'completed',
                    ppa: 'completed',
                    do: 'completed',
                    port_charges: 'completed',
                    releasing: 'completed',
                    billing: 'pending',
                }}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /open billing & liquidation/i }));

        expect(screen.queryByText('Upload Scope')).not.toBeInTheDocument();
        expect(screen.queryByText('This Transaction')).not.toBeInTheDocument();
        expect(screen.getByText('Shared Upload Scope')).toBeInTheDocument();
        expect(screen.getByText(/this upload will apply to all 3 billing-ready bls for mv shared ledger/i)).toBeInTheDocument();
        expect(screen.getByText('Apply to 3 Ready BLs')).toBeInTheDocument();
    });

    it('uses the vessel billing endpoint when the vessel scope is selected', async () => {
        renderWithProviders(
            <AccountingUploadModal
                isOpen
                onClose={vi.fn()}
                transactionId={11}
                reference="REF-ACC-011"
                type="import"
                clientName="Acme Imports"
                vesselName="MV Shared Ledger"
                vesselUploadCount={3}
                entryMode="shared-vessel"
                transactionStages={{
                    boc: 'completed',
                    bonds: 'completed',
                    ppa: 'completed',
                    do: 'completed',
                    port_charges: 'completed',
                    releasing: 'completed',
                    billing: 'pending',
                }}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /open billing & liquidation/i }));
        fireEvent.click(screen.getByRole('button', { name: /confirm upload/i }));

        await waitFor(() => {
            expect(trackingApiMock.uploadVesselBillingDocuments).toHaveBeenCalledWith({
                files: [expect.any(File)],
                documentable_type: 'App\\Models\\ImportTransaction',
                documentable_id: 11,
            });
        });
    });
});
