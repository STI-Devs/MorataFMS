import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../lib/appRoutes';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { AdminDashboard } from './AdminDashboard';

vi.mock('../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => <div data-testid="current-date-time" />,
}));

describe('AdminDashboard', () => {
    it('renders the brokerage dashboard sections and full quick-action labels', () => {
        renderWithProviders(<AdminDashboard />, {
            route: appRoutes.dashboard,
            path: appRoutes.dashboard,
        });

        expect(screen.getByText('Brokerage Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Critical Operations')).toBeInTheDocument();
        expect(screen.getByText('Action Feed')).toBeInTheDocument();
        expect(screen.getByText('Jump To')).toBeInTheDocument();
        expect(screen.getByText('Active Workloads')).toBeInTheDocument();

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
                    path: appRoutes.documents,
                    element: <div>Documents route</div>,
                },
            ],
        });

        fireEvent.click(screen.getByRole('button', { name: /documents/i }));

        expect(screen.getByText('Documents route')).toBeInTheDocument();
    });
});
