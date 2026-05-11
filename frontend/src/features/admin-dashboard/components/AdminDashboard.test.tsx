import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../lib/appRoutes';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { AdminDashboard } from './AdminDashboard';

const { mockUseAdminDashboard } = vi.hoisted(() => ({
    mockUseAdminDashboard: vi.fn(),
}));

vi.mock('../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => <div data-testid="current-date-time" />,
}));

vi.mock('../hooks/useAdminDashboard', () => ({
    useAdminDashboard: mockUseAdminDashboard,
}));

describe('AdminDashboard', () => {
    beforeEach(() => {
        mockUseAdminDashboard.mockReturnValue({
            data: {
                kpis: {
                    active_imports: 18,
                    active_exports: 11,
                    delayed_shipments: 3,
                    upcoming_eta_etd: 7,
                    open_remarks: 4,
                    missing_final_docs: 6,
                },
                critical_operations: [
                    {
                        id: 'review-export-1',
                        ref: 'BL-EXP-FLAG-001',
                        status: 'review',
                        title: 'Flagged export file needs admin review',
                        detail: 'Assigned to Sarah Velasco. Cancelled file. Unresolved remarks are blocking archive review.',
                        age: '30m ago',
                        destination: 'admin_document_review',
                    },
                ],
                action_feed: [
                    {
                        id: 'audit-1',
                        age: '1h ago',
                        actor: 'Admin User',
                        action: 'Status Override',
                        target: 'IMP-0901',
                        detail: 'Moved the shipment to Completed after manual review.',
                        created_at: '2026-03-29T11:00:00Z',
                    },
                ],
                workloads: [
                    {
                        id: 1,
                        name: 'Sarah Velasco',
                        role: 'Senior Encoder',
                        active: 12,
                        overdue: 2,
                    },
                    {
                        id: 2,
                        name: 'Mike Tan',
                        role: 'Encoder',
                        active: 9,
                        overdue: 1,
                    },
                ],
                records_summary: {
                    in_review_count: 8,
                    completed_count: 5,
                    cancelled_count: 3,
                    missing_docs_count: 2,
                    archive_ready_count: 4,
                },
                analytics: {
                    year: 2026,
                    monthly_volume: {
                        year: 2026,
                        total_imports: 18,
                        total_exports: 11,
                        total: 29,
                        months: [
                            { month: 1, imports: 2, exports: 1, total: 3 },
                            { month: 2, imports: 4, exports: 2, total: 6 },
                            { month: 3, imports: 12, exports: 8, total: 20 },
                            { month: 4, imports: 0, exports: 0, total: 0 },
                            { month: 5, imports: 0, exports: 0, total: 0 },
                            { month: 6, imports: 0, exports: 0, total: 0 },
                            { month: 7, imports: 0, exports: 0, total: 0 },
                            { month: 8, imports: 0, exports: 0, total: 0 },
                            { month: 9, imports: 0, exports: 0, total: 0 },
                            { month: 10, imports: 0, exports: 0, total: 0 },
                            { month: 11, imports: 0, exports: 0, total: 0 },
                            { month: 12, imports: 0, exports: 0, total: 0 },
                        ],
                    },
                    transaction_flow: {
                        imports: 18,
                        exports: 11,
                        total: 29,
                        completed: 9,
                        completion_rate: 31,
                    },
                    status_breakdown: [
                        { key: 'pending', label: 'Pending', value: 1 },
                        { key: 'in_progress', label: 'In Progress', value: 24 },
                        { key: 'completed', label: 'Completed', value: 3 },
                        { key: 'cancelled', label: 'Cancelled', value: 1 },
                    ],
                    overdue_transactions: {
                        threshold_hours: 48,
                        total: 5,
                        imports: { overdue_count: 3, stale_48_72_count: 2, stale_over_72_count: 1, oldest_hours: 81 },
                        exports: { overdue_count: 2, stale_48_72_count: 1, stale_over_72_count: 1, oldest_hours: 76 },
                    },
                },
            },
            isLoading: false,
            isError: false,
        });
    });

    it('renders the brokerage dashboard sections and full quick-action labels', () => {
        renderWithProviders(<AdminDashboard />, {
            route: appRoutes.dashboard,
            path: appRoutes.dashboard,
        });

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Operation Queue')).toBeInTheDocument();
        expect(screen.getByText('Audit Log')).toBeInTheDocument();
        expect(screen.getByText('Modules')).toBeInTheDocument();
        expect(screen.getByText('Encoder Workload')).toBeInTheDocument();
        expect(screen.getByText('ETA/ETD This Week')).toBeInTheDocument();
        expect(screen.getByText('Open Remarks')).toBeInTheDocument();
        expect(screen.getByText('Needs Update')).toBeInTheDocument();
        expect(screen.getByText('Document Gaps')).toBeInTheDocument();
        expect(screen.getByText('Monthly Volume')).toBeInTheDocument();
        expect(screen.getByText('Transaction Distribution')).toBeInTheDocument();
        expect(screen.getByText('Imports')).toBeInTheDocument();
        expect(screen.getByText('Exports')).toBeInTheDocument();
        expect(screen.getAllByText('18').length).toBeGreaterThan(0);
        expect(screen.getAllByText('11').length).toBeGreaterThan(0);
        expect(screen.queryByText('Transaction Split')).not.toBeInTheDocument();
        expect(screen.queryByText('Import / Export Split')).not.toBeInTheDocument();
        expect(screen.getByText('Live Status Mix')).toBeInTheDocument();
        expect(screen.getByText('Overdue Transactions')).toBeInTheDocument();
        expect(screen.getByText('Overdue Queue Size')).toBeInTheDocument();
        expect(screen.getByText('Import Overdue')).toBeInTheDocument();
        expect(screen.getByText('Export Overdue')).toBeInTheDocument();
        expect(screen.getAllByText('overdue records')).toHaveLength(2);
        expect(screen.getByText('oldest: 81h')).toBeInTheDocument();
        expect(screen.getByText('oldest: 76h')).toBeInTheDocument();
        expect(screen.getByText('Records & Archive')).toBeInTheDocument();
        expect(screen.getByText('Records In Review')).toBeInTheDocument();
        expect(screen.getByText('Ready for Archive')).toBeInTheDocument();
        expect(screen.getByText('Missing Archive Docs')).toBeInTheDocument();
        expect(screen.queryByText('Active / Archived')).not.toBeInTheDocument();
        expect(screen.queryByText('Turnaround Performance')).not.toBeInTheDocument();
        expect(screen.getByText('BL-EXP-FLAG-001')).toBeInTheDocument();
        expect(screen.getByText('Admin User')).toBeInTheDocument();

        expect(screen.getByText('User Management')).toBeInTheDocument();
        expect(screen.getByText('Client Management')).toBeInTheDocument();
        expect(screen.getByText('Transaction Oversight')).toBeInTheDocument();
        expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
    });

    it('shows brokerage encoder mock workloads instead of unrelated legal roles', () => {
        renderWithProviders(<AdminDashboard />, {
            route: appRoutes.dashboard,
            path: appRoutes.dashboard,
        });

        expect(screen.getByText('Sarah Velasco')).toBeInTheDocument();
        expect(screen.getByText('Senior Encoder')).toBeInTheDocument();
        expect(screen.queryByText('Lawyer Admin')).not.toBeInTheDocument();
    });

    it('navigates to the documents page from the quick actions panel', () => {
        renderWithProviders(<AdminDashboard />, {
            route: appRoutes.dashboard,
            path: appRoutes.dashboard,
            routes: [
                {
                    path: appRoutes.adminDocumentReview,
                    element: <div>Documents route</div>,
                },
            ],
        });

        fireEvent.click(screen.getByRole('button', { name: /^Document Review$/i }));

        expect(screen.getByText('Documents route')).toBeInTheDocument();
    });
});
