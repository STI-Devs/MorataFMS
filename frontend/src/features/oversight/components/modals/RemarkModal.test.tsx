import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RemarkModal } from './RemarkModal';

const {
    mockUseRemarks,
    mockUseDocuments,
    mockUseCreateRemark,
    mockUseResolveRemark,
    mockUseTransactionSyncSubscription,
    mockCreateMutateAsync,
    mockResolveMutateAsync,
} = vi.hoisted(() => ({
    mockUseRemarks: vi.fn(),
    mockUseDocuments: vi.fn(),
    mockUseCreateRemark: vi.fn(),
    mockUseResolveRemark: vi.fn(),
    mockUseTransactionSyncSubscription: vi.fn(),
    mockCreateMutateAsync: vi.fn(),
    mockResolveMutateAsync: vi.fn(),
}));

vi.mock('../../../../hooks/useTransactionSyncSubscription', () => ({
    useTransactionSyncSubscription: mockUseTransactionSyncSubscription,
}));

vi.mock('../../hooks/useRemarks', () => ({
    useRemarks: mockUseRemarks,
    useDocuments: mockUseDocuments,
    useCreateRemark: mockUseCreateRemark,
    useResolveRemark: mockUseResolveRemark,
}));

const openRemark = {
    id: 1,
    severity: 'warning' as const,
    message: 'BL No. seems wrong, please verify',
    author: { id: 9, name: 'Alpha', role: 'admin' },
    is_resolved: false,
    resolved_by: null,
    resolved_at: null,
    created_at: '2026-08-16T01:00:00Z',
    document: null,
};

const resolvedRemark = {
    id: 2,
    severity: 'info' as const,
    message: 'Already fixed',
    author: { id: 9, name: 'Alpha', role: 'admin' },
    is_resolved: true,
    resolved_by: { id: 2, name: 'Beta' },
    resolved_at: '2026-08-16T02:00:00Z',
    created_at: '2026-08-16T00:00:00Z',
    document: null,
};

describe('RemarkModal', () => {
    beforeEach(() => {
        mockUseTransactionSyncSubscription.mockReset();
        mockUseRemarks.mockReset();
        mockUseDocuments.mockReset();
        mockUseCreateRemark.mockReset();
        mockUseResolveRemark.mockReset();
        mockCreateMutateAsync.mockReset();
        mockResolveMutateAsync.mockReset();

        mockUseTransactionSyncSubscription.mockReturnValue(undefined);
        mockUseRemarks.mockReturnValue({ data: { data: [openRemark, resolvedRemark] }, isLoading: false });
        mockUseDocuments.mockReturnValue({ data: { data: [] } });
        mockUseCreateRemark.mockReturnValue({ mutateAsync: mockCreateMutateAsync, isPending: false });
        mockUseResolveRemark.mockReturnValue({ mutateAsync: mockResolveMutateAsync, isPending: false });
        mockCreateMutateAsync.mockResolvedValue({});
        mockResolveMutateAsync.mockResolvedValue({});
    });

    const renderModal = () =>
        render(
            <RemarkModal
                isOpen
                onClose={() => {}}
                transactionType="import"
                transactionId={42}
                transactionLabel="Import — BL-IMP-042"
            />,
        );

    it('renders the header, severity pills, and open/resolved remark lists', () => {
        const { unmount } = renderModal();

        expect(screen.getByText('Transaction Remarks')).toBeInTheDocument();
        expect(screen.getByText('Import — BL-IMP-042')).toBeInTheDocument();

        expect(screen.getByRole('button', { name: 'Info' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Warning' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Critical' })).toBeInTheDocument();

        expect(screen.getByText('Open (1)')).toBeInTheDocument();
        expect(screen.getByText('BL No. seems wrong, please verify')).toBeInTheDocument();
        expect(screen.getByText('Resolved (1)')).toBeInTheDocument();
        expect(screen.getByText('Already fixed')).toBeInTheDocument();

        unmount();
    });

    it('tracks the message counter and disables submit while the message is empty', () => {
        const { unmount } = renderModal();

        const submit = screen.getByRole('button', { name: 'Add Remark' });
        expect(submit).toBeDisabled();
        expect(screen.getByText('0/1000')).toBeInTheDocument();

        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: 'hello' } });

        expect(screen.getByText('5/1000')).toBeInTheDocument();
        expect(submit).toBeEnabled();

        unmount();
    });

    it('lets the user pick a severity pill and submits a trimmed message', async () => {
        const { unmount } = renderModal();

        fireEvent.click(screen.getByRole('button', { name: 'Critical' }));
        fireEvent.change(screen.getByRole('textbox'), { target: { value: '  Needs review now  ' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add Remark' }));

        await waitFor(() => {
            expect(mockCreateMutateAsync).toHaveBeenCalledWith({
                type: 'import',
                id: 42,
                data: { severity: 'critical', message: 'Needs review now', document_id: null },
            });
        });

        unmount();
    });

    it('resolves an open remark through useResolveRemark', async () => {
        const { unmount } = renderModal();

        fireEvent.click(screen.getByRole('button', { name: 'Resolve' }));

        await waitFor(() => {
            expect(mockResolveMutateAsync).toHaveBeenCalledWith(1);
        });

        unmount();
    });

    it('renders the pin-to-document select when documents are available', () => {
        mockUseDocuments.mockReturnValue({
            data: { data: [{ id: 5, type: 'Import', filename: 'memo.pdf' }] },
        });

        const { unmount } = renderModal();

        expect(screen.getByText('Do not pin to a document')).toBeInTheDocument();

        unmount();
    });
});
