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

        expect(screen.getByText('Brokerage Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Operation Queue')).toBeInTheDocument();
        expect(screen.getByText('Action Feed')).toBeInTheDocument();
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
        expect(screen.getByText('Active Workloads')).toBeInTheDocument();
        expect(screen.queryByText('Aging Watch')).not.toBeInTheDocument();
        expect(screen.getByText('ETA/ETD This Week')).toBeInTheDocument();
        expect(screen.getByText('Open Remarks')).toBeInTheDocument();
        expect(screen.getByText('Needs Update')).toBeInTheDocument();
        expect(screen.getByText('Document Gaps')).toBeInTheDocument();
        expect(screen.queryByText('Delayed Shipments')).not.toBeInTheDocument();
        expect(screen.queryByText('Missing Final Docs')).not.toBeInTheDocument();
        expect(screen.getByText('18')).toBeInTheDocument();
        expect(screen.getByText('18')).toHaveClass('mt-auto');
        expect(screen.getByText('11')).toBeInTheDocument();
        expect(screen.getByText('7')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('6')).toBeInTheDocument();
        expect(screen.getByText('BL-EXP-FLAG-001')).toBeInTheDocument();
        expect(screen.getByText('Admin User')).toBeInTheDocument();

        expect(screen.getByText('User Management')).toBeInTheDocument();
        expect(screen.getByText('Brokerage Client Management')).toBeInTheDocument();
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
