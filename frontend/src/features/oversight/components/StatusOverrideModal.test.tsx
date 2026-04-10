import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StatusOverrideModal } from './StatusOverrideModal';

const {
    mockOverrideExportStatus,
    mockOverrideImportStatus,
} = vi.hoisted(() => ({
    mockOverrideExportStatus: vi.fn(),
    mockOverrideImportStatus: vi.fn(),
}));

vi.mock('../api/transactionApi', () => ({
    transactionApi: {
        overrideImportStatus: mockOverrideImportStatus,
        overrideExportStatus: mockOverrideExportStatus,
    },
}));

describe('StatusOverrideModal', () => {
    beforeEach(() => {
        mockOverrideImportStatus.mockReset();
        mockOverrideExportStatus.mockReset();
        mockOverrideImportStatus.mockResolvedValue({ message: 'ok', status: 'Pending' });
        mockOverrideExportStatus.mockResolvedValue({ message: 'ok', status: 'Pending' });
    });

    it('defaults cancelled transactions into restore mode', async () => {
        const onClose = vi.fn();
        const onSuccess = vi.fn();

        render(
            <StatusOverrideModal
                isOpen
                onClose={onClose}
                onSuccess={onSuccess}
                transaction={{
                    id: 31,
                    type: 'import',
                    reference_no: 'IMP-2026-031',
                    bl_no: 'BL-IMP-031',
                    client: 'Acme Imports',
                    client_id: 1,
                    date: '2026-04-03',
                    status: 'Cancelled',
                    selective_color: 'green',
                    assigned_to: 'Encoder One',
                    assigned_user_id: 5,
                    open_remarks_count: 0,
                    created_at: '2026-04-03T00:00:00Z',
                    stages: null,
                }}
            />,
        );

        expect(screen.getByText('Restore Transaction')).toBeInTheDocument();
        expect(screen.getByText('Restore To')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Cancelled' })).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Restore' }));

        await waitFor(() => {
            expect(mockOverrideImportStatus).toHaveBeenCalledWith(31, 'pending');
        });

        expect(onSuccess).toHaveBeenCalledWith(31, 'import', 'Pending');
        expect(onClose).toHaveBeenCalled();
    });
});
