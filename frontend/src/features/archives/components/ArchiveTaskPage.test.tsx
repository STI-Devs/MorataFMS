import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { ArchiveTaskPage } from './ArchiveTaskPage';

const { mockUseArchiveOperationalQueue } = vi.hoisted(() => ({
    mockUseArchiveOperationalQueue: vi.fn(),
}));
const {
    mockUpdateArchiveExportStageApplicability,
    mockUpdateArchiveImportStageApplicability,
} = vi.hoisted(() => ({
    mockUpdateArchiveExportStageApplicability: vi.fn(),
    mockUpdateArchiveImportStageApplicability: vi.fn(),
}));

vi.mock('../hooks/useArchiveOperationalQueue', () => ({
    useArchiveOperationalQueue: mockUseArchiveOperationalQueue,
}));

vi.mock('../api/archiveTaskApi', () => ({
    archiveTaskApi: {
        getOperationalQueue: vi.fn(),
        updateImportStageApplicability: mockUpdateArchiveImportStageApplicability,
        updateExportStageApplicability: mockUpdateArchiveExportStageApplicability,
    },
}));

vi.mock('../../tracking/api/trackingApi', () => ({
    trackingApi: {
        uploadDocuments: vi.fn(),
        downloadDocument: vi.fn(),
        previewDocument: vi.fn(),
    },
}));

describe('ArchiveTaskPage', () => {
    beforeEach(() => {
        mockUpdateArchiveExportStageApplicability.mockReset();
        mockUpdateArchiveImportStageApplicability.mockReset();
    });

    it('renders accounting archive records with a single billing stage summary', async () => {
        mockUseArchiveOperationalQueue.mockReturnValue({
            data: {
                stats: {
                    needs_my_upload: 1,
                    waiting_on_others: 0,
                    completed_by_me: 0,
                    already_supplied: 0,
                    shared_records: 1,
                },
                data: [
                    {
                        id: 10,
                        type: 'import',
                        reference: 'REF-ARCH-001',
                        bl_no: 'BL-ARCH-001',
                        client_name: 'Acme Imports',
                        transaction_date: '2026-03-15',
                        archive_period: { year: 2026, month: 3, label: 'March 2026' },
                        status: 'Completed',
                        notes: null,
                        selective_color: 'green',
                        vessel_name: 'MV Sample',
                        origin_country: 'Japan',
                        location_of_goods: 'Manila Port',
                        stages: { billing: 'pending' },
                        not_applicable_stages: [],
                        my_stage_keys: ['billing'],
                        my_stage_summaries: [
                            {
                                key: 'billing',
                                label: 'Billing and Liquidation',
                                state: 'missing',
                                can_upload: true,
                                documents_count: 0,
                                uploaded_by: null,
                            },
                        ],
                        documents: [],
                        contributors: [],
                        queue_status: 'needs_my_upload',
                        last_updated_at: '2026-04-15T01:00:00Z',
                    },
                ],
            },
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<ArchiveTaskPage role="accounting" />);

        expect(screen.getByText('Archive Finance Tasks')).toBeInTheDocument();
        expect(screen.getAllByText('Needs My Upload').length).toBeGreaterThan(0);
        expect(screen.getAllByText('BL-ARCH-001').length).toBeGreaterThan(0);
        expect(screen.getByText('Billing and Liquidation: Pending')).toBeInTheDocument();
        expect(screen.queryByText(/^Liquidation:/)).not.toBeInTheDocument();
    });

    it('lets processor users switch between import and export archive records', async () => {
        mockUseArchiveOperationalQueue.mockReturnValue({
            data: {
                stats: {
                    needs_my_upload: 1,
                    waiting_on_others: 1,
                    completed_by_me: 0,
                    already_supplied: 0,
                    shared_records: 2,
                },
                data: [
                    {
                        id: 21,
                        type: 'import',
                        reference: 'REF-IMP-ARCH',
                        bl_no: 'BL-IMP-ARCH',
                        client_name: 'Import Client',
                        transaction_date: '2026-03-15',
                        archive_period: { year: 2026, month: 3, label: 'March 2026' },
                        status: 'Completed',
                        notes: null,
                        selective_color: 'yellow',
                        vessel_name: null,
                        origin_country: 'Korea',
                        location_of_goods: 'South Harbor',
                        stages: { ppa: 'pending', port_charges: 'pending' },
                        not_applicable_stages: [],
                        my_stage_keys: ['ppa', 'port_charges'],
                        my_stage_summaries: [
                            { key: 'ppa', label: 'Payment for PPA Charges', state: 'missing', can_upload: true, documents_count: 0, uploaded_by: null },
                            { key: 'port_charges', label: 'Payment for Port Charges', state: 'missing', can_upload: true, documents_count: 0, uploaded_by: null },
                        ],
                        documents: [],
                        contributors: [],
                        queue_status: 'needs_my_upload',
                        last_updated_at: '2026-04-15T01:00:00Z',
                    },
                    {
                        id: 22,
                        type: 'export',
                        reference: 'BL-EXP-ARCH',
                        bl_no: 'BL-EXP-ARCH',
                        client_name: 'Export Client',
                        transaction_date: '2026-03-16',
                        archive_period: { year: 2026, month: 3, label: 'March 2026' },
                        status: 'Completed',
                        notes: null,
                        selective_color: null,
                        vessel_name: 'MV Export',
                        origin_country: 'Singapore',
                        location_of_goods: null,
                        stages: { cil: 'completed', dccci: 'completed' },
                        not_applicable_stages: [],
                        my_stage_keys: ['cil', 'dccci'],
                        my_stage_summaries: [
                            { key: 'cil', label: 'CIL', state: 'uploaded_by_admin', can_upload: false, documents_count: 1, uploaded_by: { id: 3, name: 'Admin', role: 'admin' } },
                            { key: 'dccci', label: 'DCCCI Printing', state: 'uploaded_by_admin', can_upload: false, documents_count: 1, uploaded_by: { id: 3, name: 'Admin', role: 'admin' } },
                        ],
                        documents: [],
                        contributors: [{ id: 3, name: 'Admin', role: 'admin' }],
                        queue_status: 'waiting_on_others',
                        last_updated_at: '2026-04-15T01:30:00Z',
                    },
                ],
            },
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<ArchiveTaskPage role="processor" />);

        expect(screen.getAllByText('BL-IMP-ARCH').length).toBeGreaterThan(0);
        expect(screen.queryByText('BL-EXP-ARCH')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Exports' }));

        expect(screen.getAllByText('BL-EXP-ARCH').length).toBeGreaterThan(0);
        expect(screen.queryByText('BL-IMP-ARCH')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Needs My Upload')).not.toBeInTheDocument();
    });

    it('lets processor users mark optional owned archive stages as N/A', async () => {
        mockUpdateArchiveImportStageApplicability.mockResolvedValue({});
        mockUseArchiveOperationalQueue.mockReturnValue({
            data: {
                stats: {
                    needs_my_upload: 1,
                    waiting_on_others: 0,
                    completed_by_me: 0,
                    already_supplied: 0,
                    shared_records: 1,
                },
                data: [
                    {
                        id: 24,
                        type: 'import',
                        reference: 'REF-IMP-ARCH-NA',
                        bl_no: 'BL-IMP-ARCH-NA',
                        client_name: 'Import Client',
                        transaction_date: '2026-03-15',
                        archive_period: { year: 2026, month: 3, label: 'March 2026' },
                        status: 'Completed',
                        notes: null,
                        selective_color: 'orange',
                        vessel_name: null,
                        origin_country: 'Korea',
                        location_of_goods: 'South Harbor',
                        stages: { ppa: 'pending', port_charges: 'pending' },
                        not_applicable_stages: [],
                        my_stage_keys: ['ppa', 'port_charges'],
                        my_stage_summaries: [
                            { key: 'ppa', label: 'Payment for PPA Charges', state: 'missing', can_upload: true, documents_count: 0, uploaded_by: null },
                            { key: 'port_charges', label: 'Payment for Port Charges', state: 'missing', can_upload: true, documents_count: 0, uploaded_by: null },
                        ],
                        documents: [],
                        contributors: [],
                        queue_status: 'needs_my_upload',
                        last_updated_at: '2026-04-15T01:00:00Z',
                    },
                ],
            },
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<ArchiveTaskPage role="processor" />);

        fireEvent.click(screen.getByRole('button', { name: /bl-imp-arch-na/i }));
        fireEvent.click(screen.getByRole('button', { name: /mark n\/a for payment for ppa charges/i }));

        await waitFor(() => {
            expect(mockUpdateArchiveImportStageApplicability).toHaveBeenCalledWith(24, {
                stage: 'ppa',
                not_applicable: true,
            });
        });
    });

    it('shows import selective color in the archive drawer instead of the queue row dot', async () => {
        mockUseArchiveOperationalQueue.mockReturnValue({
            data: {
                stats: {
                    needs_my_upload: 1,
                    waiting_on_others: 0,
                    completed_by_me: 0,
                    already_supplied: 0,
                    shared_records: 1,
                },
                data: [
                    {
                        id: 25,
                        type: 'import',
                        reference: 'REF-IMP-ARCH-BLSC',
                        bl_no: 'BL-IMP-ARCH-BLSC',
                        client_name: 'Import Client',
                        transaction_date: '2026-03-15',
                        archive_period: { year: 2026, month: 3, label: 'March 2026' },
                        status: 'Completed',
                        notes: null,
                        selective_color: 'red',
                        vessel_name: 'MV Drawer',
                        origin_country: 'Japan',
                        location_of_goods: 'South Harbor',
                        stages: { ppa: 'pending', port_charges: 'pending' },
                        not_applicable_stages: [],
                        my_stage_keys: ['ppa', 'port_charges'],
                        my_stage_summaries: [
                            { key: 'ppa', label: 'Payment for PPA Charges', state: 'missing', can_upload: true, documents_count: 0, uploaded_by: null },
                            { key: 'port_charges', label: 'Payment for Port Charges', state: 'missing', can_upload: true, documents_count: 0, uploaded_by: null },
                        ],
                        documents: [],
                        contributors: [],
                        queue_status: 'needs_my_upload',
                        last_updated_at: '2026-04-15T01:00:00Z',
                    },
                ],
            },
            isLoading: false,
            isError: false,
        });

        renderWithProviders(<ArchiveTaskPage role="processor" />);

        expect(screen.queryByTitle('Needs My Upload')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /bl-imp-arch-blsc/i }));

        expect(screen.getByText('BLSC: Red')).toBeInTheDocument();
    });
});
