import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../lib/appRoutes';
import { GuestRoute } from './GuestRoute';
import { ProtectedRoute } from './ProtectedRoute';

const mockUseAuth = vi.fn();

vi.mock('../hooks/useAuth', () => ({
    useAuth: () => mockUseAuth(),
}));

const adminUser = {
    role: 'admin' as const,
    departments: ['brokerage', 'legal'],
    permissions: {
        access_brokerage_module: true,
        access_legal_module: true,
    },
};

const encoderUser = {
    role: 'encoder' as const,
    departments: ['brokerage'],
    permissions: {
        access_brokerage_module: true,
        access_legal_module: false,
    },
};

describe('auth route guards', () => {
    beforeEach(() => {
        mockUseAuth.mockReset();
    });

    it('redirects unauthenticated users from protected routes to login', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
            user: null,
        });

        render(
            <MemoryRouter initialEntries={[appRoutes.transactions]}>
                <Routes>
                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route path={appRoutes.transactions} element={<div>Transactions page</div>} />
                    </Route>
                    <Route path={appRoutes.login} element={<div>Login page</div>} />
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getByText('Login page')).toBeInTheDocument();
    });

    it('renders protected content for an allowed role', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
            user: adminUser,
        });

        render(
            <MemoryRouter initialEntries={[appRoutes.transactions]}>
                <Routes>
                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route path={appRoutes.transactions} element={<div>Transactions page</div>} />
                    </Route>
                    <Route path={appRoutes.login} element={<div>Login page</div>} />
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getByText('Transactions page')).toBeInTheDocument();
    });

    it('redirects authenticated users without the required role to their home route', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
            user: encoderUser,
        });

        render(
            <MemoryRouter initialEntries={[appRoutes.transactions]}>
                <Routes>
                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route path={appRoutes.transactions} element={<div>Transactions page</div>} />
                    </Route>
                    <Route path={appRoutes.tracking} element={<div>Tracking page</div>} />
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getByText('Tracking page')).toBeInTheDocument();
    });

    it('redirects authenticated guests away from the login page', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
            user: adminUser,
        });

        render(
            <MemoryRouter initialEntries={[appRoutes.login]}>
                <Routes>
                    <Route element={<GuestRoute />}>
                        <Route path={appRoutes.login} element={<div>Login page</div>} />
                    </Route>
                    <Route path={appRoutes.dashboard} element={<div>Dashboard page</div>} />
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getByText('Dashboard page')).toBeInTheDocument();
    });

    it('renders guest content for unauthenticated users', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
            user: null,
        });

        render(
            <MemoryRouter initialEntries={[appRoutes.login]}>
                <Routes>
                    <Route element={<GuestRoute />}>
                        <Route path={appRoutes.login} element={<div>Login page</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getByText('Login page')).toBeInTheDocument();
    });
});
