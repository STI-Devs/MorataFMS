import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AccountingImpExpPage } from '../AccountingImpExpPage';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as trackingApi from '../../../tracking/api/trackingApi';
import { makeApiImportTransaction } from '../../../../test/fixtures/tracking';

const {
    mockUseAddDocumentToCache,
    mockUseDocumentPreview,
    mockUseTransactionDocuments,
} = vi.hoisted(() => ({
    mockUseAddDocumentToCache: vi.fn(),
    mockUseDocumentPreview: vi.fn(),
    mockUseTransactionDocuments: vi.fn(),
}));

vi.mock('../../../tracking/api/trackingApi', async (importOriginal) => {
    const actual = await importOriginal<typeof trackingApi>();
    return {
        ...actual,
        trackingApi: {
            ...actual.trackingApi,
            getAllImports: vi.fn().mockResolvedValue([]),
            getAllExports: vi.fn().mockResolvedValue([]),
            uploadVesselBillingDocuments: vi.fn(),
        },
    };
});

vi.mock('../../../tracking/hooks/useTransactionDocuments', () => ({
    useTransactionDocuments: mockUseTransactionDocuments,
    useAddDocumentToCache: mockUseAddDocumentToCache,
}));

vi.mock('../../../tracking/hooks/useDocumentPreview', () => ({
    useDocumentPreview: mockUseDocumentPreview,
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

describe('AccountingImpExpPage', () => {
    beforeEach(() => {
        vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-04-15T00:00:00Z').getTime());
        vi.mocked(trackingApi.trackingApi.getAllImports).mockReset();
        vi.mocked(trackingApi.trackingApi.getAllExports).mockReset();
        vi.mocked(trackingApi.trackingApi.uploadVesselBillingDocuments).mockReset();
        vi.mocked(trackingApi.trackingApi.getAllImports).mockResolvedValue([]);
        vi.mocked(trackingApi.trackingApi.getAllExports).mockResolvedValue([]);
        vi.mocked(trackingApi.trackingApi.uploadVesselBillingDocuments).mockResolvedValue({
            vessel_name: 'MV Shared Ledger',
            affected_transaction_ids: [2, 3],
            affected_transactions_count: 2,
            uploaded_documents_count: 2,
        });
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
            },
            isLoading: false,
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders the accounting task queue', async () => {
        renderWithProviders(<AccountingImpExpPage />);

        expect(screen.getByText('Finance & Accounting Tasks')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Imports/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Exports/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/search bl, ref, client, vessel, blocker/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Ready/i })).toBeInTheDocument();

        expect(trackingApi.trackingApi.getAllImports).toHaveBeenCalledWith({
            exclude_statuses: 'completed,cancelled',
            operational_scope: 'workspace',
        });
    });

    it('displays compact billing rows and supports queue filtering', async () => {
        const readyImport = makeApiImportTransaction({
            id: 2,
            customs_ref_no: 'REF-ACT-READY-002',
            vessel_name: 'MV Shared Ledger',
            created_at: '2026-04-06T00:00:00Z',
            waiting_since: '2026-04-12T00:00:00Z',
            stages: {
                boc: 'completed',
                bonds: 'completed',
                ppa: 'completed',
                do: 'completed',
                port_charges: 'completed',
                releasing: 'completed',
                billing: 'pending',
            },
        });
        const siblingReadyImport = makeApiImportTransaction({
            id: 3,
            customs_ref_no: 'REF-ACT-READY-003',
            vessel_name: 'MV Shared Ledger',
            created_at: '2026-04-07T00:00:00Z',
            waiting_since: '2026-04-13T00:00:00Z',
            stages: {
                boc: 'completed',
                bonds: 'completed',
                ppa: 'completed',
                do: 'completed',
                port_charges: 'completed',
                releasing: 'completed',
                billing: 'pending',
            },
        });
        const waitingImport = makeApiImportTransaction({
            id: 4,
            customs_ref_no: 'REF-ACT-WAIT-004',
            vessel_name: 'MV Waiting Ledger',
            created_at: '2026-04-08T00:00:00Z',
            waiting_since: '2026-04-12T00:00:00Z',
            stages: {
                boc: 'completed',
                bonds: 'completed',
                ppa: 'completed',
                do: 'completed',
                port_charges: 'pending',
                releasing: 'pending',
                billing: 'pending',
            },
        });

        vi.mocked(trackingApi.trackingApi.getAllImports).mockResolvedValueOnce([readyImport, siblingReadyImport, waitingImport]);

        renderWithProviders(<AccountingImpExpPage />);

        expect(await screen.findByText('REF-ACT-READY-002')).toBeInTheDocument();
        expect(screen.getAllByText(/vessel: mv shared ledger/i).length).toBeGreaterThan(0);
        expect(screen.getByText('MV Shared Ledger')).toBeInTheDocument();
        expect(screen.getByText('2 Ready BLs')).toBeInTheDocument();
        expect(screen.getByText(/billing & liquidation is shared across every ready bl on this vessel/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /open shared upload/i })).toBeInTheDocument();
        expect(screen.getAllByText('Included in vessel upload').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Billing Ready').length).toBeGreaterThan(0);
        expect(screen.getByText('Billing Waiting')).toBeInTheDocument();
        expect(screen.getByText('Ready to Upload')).toBeInTheDocument();
        expect(screen.getByText('Waiting / Monitoring')).toBeInTheDocument();
        expect(screen.getAllByText('Waiting 3 days').length).toBeGreaterThan(0);
        expect(screen.getByText('Waiting for Payment for Port Charges.')).toBeInTheDocument();
        expect(screen.getAllByText('Overdue').length).toBeGreaterThan(0);

        fireEvent.click(screen.getByRole('button', { name: /^Overdue/i }));

        expect(screen.getByText('REF-ACT-WAIT-004')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /^All/i }));
        fireEvent.change(screen.getByPlaceholderText(/search bl, ref, client, vessel, blocker/i), {
            target: { value: 'Shared Ledger' },
        });

        expect(screen.getByText('REF-ACT-READY-002')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /collapse mv shared ledger shared vessel group/i }));
        expect(screen.queryByText('REF-ACT-READY-002')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /expand mv shared ledger shared vessel group/i }));
        expect(screen.getByText('REF-ACT-READY-002')).toBeInTheDocument();
    });

    it('surfaces vessel batch upload in the task drawer and uploads through the vessel endpoint', async () => {
        const readyImport = makeApiImportTransaction({
            id: 2,
            customs_ref_no: 'REF-ACT-READY-002',
            vessel_name: 'MV Shared Ledger',
            created_at: '2026-04-06T00:00:00Z',
            waiting_since: '2026-04-12T00:00:00Z',
            stages: {
                boc: 'completed',
                bonds: 'completed',
                ppa: 'completed',
                do: 'completed',
                port_charges: 'completed',
                releasing: 'completed',
                billing: 'pending',
            },
        });
        const siblingReadyImport = makeApiImportTransaction({
            id: 3,
            customs_ref_no: 'REF-ACT-READY-003',
            vessel_name: 'MV Shared Ledger',
            created_at: '2026-04-07T00:00:00Z',
            waiting_since: '2026-04-13T00:00:00Z',
            stages: {
                boc: 'completed',
                bonds: 'completed',
                ppa: 'completed',
                do: 'completed',
                port_charges: 'completed',
                releasing: 'completed',
                billing: 'pending',
            },
        });

        vi.mocked(trackingApi.trackingApi.getAllImports).mockResolvedValueOnce([readyImport, siblingReadyImport]);

        renderWithProviders(<AccountingImpExpPage />);

        expect(await screen.findByText('REF-ACT-READY-002')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /open shared upload/i }));

        expect(await screen.findByText('Shared Vessel Upload Available')).toBeInTheDocument();
        expect(screen.getByText(/mv shared ledger has 2 billing-ready transactions that can use the same billing & liquidation files/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /open billing & liquidation/i }));
        expect(screen.queryByText('This Transaction')).not.toBeInTheDocument();
        expect(screen.getByText('Shared Upload Scope')).toBeInTheDocument();
        expect(screen.getByText('Apply to 2 Ready BLs')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /confirm upload/i }));

        await waitFor(() => {
            expect(trackingApi.trackingApi.uploadVesselBillingDocuments).toHaveBeenCalledWith({
                files: [expect.any(File)],
                documentable_type: 'App\\Models\\ImportTransaction',
                documentable_id: 2,
            });
        });
    });
});
