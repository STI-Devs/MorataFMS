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
});
