import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../lib/appRoutes';
import { MainLayout } from './MainLayout';

const { mockUseAuth, mockUseTheme } = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    mockUseTheme: vi.fn(),
}));

vi.mock('../../features/auth', () => ({
    useAuth: mockUseAuth,
}));

vi.mock('../../context/ThemeContext', () => ({
    useTheme: mockUseTheme,
}));

describe('MainLayout', () => {
    beforeEach(() => {
        mockUseAuth.mockReset();
        mockUseTheme.mockReset();

        mockUseAuth.mockReturnValue({
            user: {
                name: 'Admin User',
                email: 'admin@example.com',
                role: 'admin',
                departments: ['brokerage', 'legal'],
                multi_department: true,
            },
            logout: vi.fn(),
        });

        mockUseTheme.mockReturnValue({
            theme: 'light',
            toggleTheme: vi.fn(),
        });
    });

    it('uses the main content area as the vertical scroll container', () => {
        render(
            <MemoryRouter initialEntries={[appRoutes.help]}>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route path={appRoutes.help} element={<div>Help page</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>,
        );

        const mainContent = document.getElementById('main-content');

        expect(mainContent).not.toBeNull();
        expect(mainContent).toHaveClass('overflow-y-auto', 'overflow-x-hidden');
        expect(screen.getByText('Help page')).toBeInTheDocument();
    });

    it('uses exact matching for the legal dashboard item so documents stays highlighted on child routes', () => {
        mockUseAuth.mockReturnValue({
            user: {
                name: 'Paralegal User',
                email: 'paralegal@example.com',
                role: 'paralegal',
                departments: ['legal'],
                multi_department: false,
            },
            logout: vi.fn(),
        });

        render(
            <MemoryRouter initialEntries={[appRoutes.paralegalDocuments]}>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route path={appRoutes.paralegalDocuments} element={<div>Legal documents page</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>,
        );

        const dashboardButton = screen.getByRole('button', { name: 'Dashboard' });
        const documentsButton = screen.getByRole('button', { name: 'Documents' });

        expect(screen.getByText('Legal documents page')).toBeInTheDocument();
        expect(dashboardButton).not.toHaveClass('bg-black/8');
        expect(documentsButton).toHaveClass('bg-black/8');
    });

    it('shows the processor navigation set for processor users', () => {
        mockUseAuth.mockReturnValue({
            user: {
                name: 'Processor User',
                email: 'processor@example.com',
                role: 'processor',
                departments: ['brokerage'],
                multi_department: false,
            },
            logout: vi.fn(),
        });

        render(
            <MemoryRouter initialEntries={[appRoutes.processorDashboard]}>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route path={appRoutes.processorDashboard} element={<div>Processor dashboard</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getAllByText('Processor')).toHaveLength(2);
        expect(screen.getByRole('button', { name: 'Transaction' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Documents' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'My Archive' })).not.toBeInTheDocument();
    });
});
