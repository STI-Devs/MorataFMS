import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import type { OversightTransaction } from '../../types/transaction.types';
import { TransactionDetailDrawer } from './TransactionDetailDrawer';

const {
    mockCreateRemark,
    mockResolveRemark,
    mockUseDocuments,
    mockUseRemarks,
    mockUseCreateRemark,
    mockUseResolveRemark,
    mockUseTransactionSyncSubscription,
    mockUseDocumentPreview,
} = vi.hoisted(() => ({
    mockCreateRemark: vi.fn(),
    mockResolveRemark: vi.fn(),
    mockUseDocuments: vi.fn(),
    mockUseRemarks: vi.fn(),
    mockUseCreateRemark: vi.fn(),
    mockUseResolveRemark: vi.fn(),
    mockUseTransactionSyncSubscription: vi.fn(),
    mockUseDocumentPreview: vi.fn(),
}));

vi.mock('../../../../hooks/useTransactionSyncSubscription', () => ({
    useTransactionSyncSubscription: mockUseTransactionSyncSubscription,
}));

vi.mock('../../../../components/modals/FilePreviewModal', () => ({
    FilePreviewModal: ({ isOpen }: { isOpen: boolean }) =>
        isOpen ? <div>File preview open</div> : null,
}));

vi.mock('../../../tracking/hooks/useDocumentPreview', () => ({
    useDocumentPreview: mockUseDocumentPreview,
}));

vi.mock('../../hooks/useRemarks', () => ({
    useDocuments: mockUseDocuments,
    useRemarks: mockUseRemarks,
    useCreateRemark: mockUseCreateRemark,
    useResolveRemark: mockUseResolveRemark,
}));

const transaction = (overrides: Partial<OversightTransaction> = {}): OversightTransaction => ({
    id: 11,
    type: 'import',
    reference_no: 'IMP-2026-011',
    bl_no: 'BL-IMP-011',
    client: 'Acme Imports',
    client_id: 1,
    vessel: 'SHARED VESSEL',
    date: '2026-04-01',
    status: 'pending',
    assigned_to: 'Encoder One',
    assigned_user_id: 5,
    open_remarks_count: 1,
    created_at: '2026-04-01T00:00:00Z',
    stages: null,
    ...overrides,
});

const withStages = transaction({
    stages: {
        boc: 'completed',
        bonds: 'in_progress',
        ppa: 'pending',
        do: 'pending',
        port_charges: 'pending',
        releasing: 'pending',
        billing: 'pending',
    },
});

const applyDefaultMocks = () => {
    mockUseDocuments.mockReturnValue({
        data: { data: [{ id: 501, filename: 'bill_of_lading.pdf', type: 'boc' }] },
        isLoading: false,
    });
    mockUseRemarks.mockReturnValue({
        data: {
            data: [
                {
                    id: 1,
                    severity: 'warning',
                    message: 'Missing original B/L',
                    author: { id: 7, name: 'Encoder One', role: 'encoder' },
                    is_resolved: false,
                    resolved_by: null,
                    resolved_at: null,
                    created_at: '2026-04-01T00:00:00Z',
                    document: null,
                },
            ],
        },
        isLoading: false,
    });
    mockUseCreateRemark.mockReturnValue({ mutateAsync: mockCreateRemark, isPending: false });
    mockUseResolveRemark.mockReturnValue({ mutate: mockResolveRemark, isPending: false });
    mockUseTransactionSyncSubscription.mockReturnValue(undefined);
    mockUseDocumentPreview.mockReturnValue({
        previewFile: null,
        setPreviewFile: vi.fn(),
        handlePreviewDoc: vi.fn(),
    });
};

describe('TransactionDetailDrawer', () => {
    beforeEach(() => {
        mockCreateRemark.mockReset();
        mockResolveRemark.mockReset();
        applyDefaultMocks();
    });

    it('opens the Sheet and shows transaction details and documents by default', () => {
        const view = renderWithProviders(
            <TransactionDetailDrawer transaction={transaction()} onClose={vi.fn()} />,
        );

        expect(screen.getByText('Import — IMP-2026-011')).toBeInTheDocument();
        expect(screen.getByText(/Acme Imports/)).toBeInTheDocument();
        expect(screen.getByText('bill_of_lading.pdf')).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Remarks (1)' })).toBeInTheDocument();

        view.unmount();
    });

    it('switches between Documents, Stages and Remarks tabs', async () => {
        const view = renderWithProviders(
            <TransactionDetailDrawer transaction={withStages} onClose={vi.fn()} />,
        );

        fireEvent.mouseDown(screen.getByRole('tab', { name: 'Stages' }));
        expect(await screen.findByText('Stage Progress')).toBeInTheDocument();
        expect(screen.getByTitle('BOC: completed')).toBeInTheDocument();
        expect(screen.getByTitle('Bonds: in_progress')).toBeInTheDocument();

        fireEvent.mouseDown(screen.getByRole('tab', { name: 'Remarks (1)' }));
        expect(await screen.findByText('Add Remark')).toBeInTheDocument();
        expect(screen.getByText('Missing original B/L')).toBeInTheDocument();
        expect(screen.getByText('Remark History')).toBeInTheDocument();

        fireEvent.mouseDown(screen.getByRole('tab', { name: 'Documents' }));
        expect(await screen.findByText('bill_of_lading.pdf')).toBeInTheDocument();

        view.unmount();
    });

    it('disables the add-remark submit until a message is entered', async () => {
        const view = renderWithProviders(
            <TransactionDetailDrawer transaction={transaction()} onClose={vi.fn()} />,
        );

        fireEvent.mouseDown(screen.getByRole('tab', { name: 'Remarks (1)' }));
        const submit = await screen.findByRole('button', { name: '🚩 Flag this Transaction' });
        expect(submit).toBeDisabled();

        fireEvent.change(
            screen.getByPlaceholderText('Describe the issue clearly for the encoder…'),
            { target: { value: 'Missing original B/L' } },
        );
        expect(submit).toBeEnabled();

        view.unmount();
    });

    it('calls onClose and triggers navigation when the View in Tracking button is clicked', () => {
        const onClose = vi.fn();
        const view = renderWithProviders(
            <TransactionDetailDrawer transaction={transaction()} onClose={onClose} />,
        );

        const trackingBtn = screen.getByRole('button', { name: /view in tracking/i });
        expect(trackingBtn).toBeInTheDocument();
        fireEvent.click(trackingBtn);
        expect(onClose).toHaveBeenCalledTimes(1);

        view.unmount();
    });

    it('calls onClose when the Sheet close button is pressed', () => {
        const onClose = vi.fn();
        const view = renderWithProviders(
            <TransactionDetailDrawer transaction={transaction()} onClose={onClose} />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(onClose).toHaveBeenCalledTimes(1);

        view.unmount();
    });
});
