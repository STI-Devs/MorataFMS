import { fireEvent, render, screen } from '@testing-library/react';
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

    it('shows grouped legal navigation and keeps the active notarial item highlighted', () => {
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
            <MemoryRouter initialEntries={[appRoutes.paralegalGenerator]}>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route path={appRoutes.paralegalGenerator} element={<div>Legal notarial page</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>,
        );

        const dashboardButton = screen.getByRole('button', { name: 'Dashboard' });
        const notarialGroupButton = screen.getByRole('button', { name: 'Notarial Documents' });

        expect(screen.getByText('Legal notarial page')).toBeInTheDocument();
        expect(notarialGroupButton).toBeInTheDocument();
        expect(dashboardButton).not.toHaveAttribute('data-active', 'true');
        expect(screen.queryByRole('button', { name: 'Create Draft' })).not.toBeInTheDocument();

        fireEvent.click(notarialGroupButton);

        const templateGeneratorButton = screen.getByRole('button', { name: 'Create Draft' });

        expect(templateGeneratorButton).toHaveAttribute('data-active', 'true');
        expect(templateGeneratorButton.querySelector('svg')).toBeNull();
    });

    it('shows the grouped legal records navigation item and highlights it on the records route', () => {
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
            <MemoryRouter initialEntries={[appRoutes.paralegalGeneratedDocuments]}>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route path={appRoutes.paralegalGeneratedDocuments} element={<div>Generated documents page</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Notarial Documents' }));

        const generatedRecordsButton = screen.getByRole('button', { name: 'Generated Documents' });

        expect(screen.getByText('Generated documents page')).toBeInTheDocument();
        expect(generatedRecordsButton).toHaveAttribute('data-active', 'true');
    });

    it('shows Legacy Records as a legal sidebar group with upload and batch child routes', () => {
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
            <MemoryRouter initialEntries={[appRoutes.paralegalLegacyFolderUpload]}>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route path={appRoutes.paralegalLegacyRecordsWildcard} element={<div>Legacy upload page</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>,
        );

        const legacyRecordsGroupButton = screen.getByRole('button', { name: 'Legacy Records' });
        const legalFilesGroupButton = screen.getByRole('button', { name: 'Legal Files' });

        expect(legacyRecordsGroupButton).toBeInTheDocument();
        expect(legalFilesGroupButton.compareDocumentPosition(legacyRecordsGroupButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Legacy Folder Upload' })).not.toBeInTheDocument();

        fireEvent.click(legacyRecordsGroupButton);

        const legacyUploadButton = screen.getByRole('button', { name: 'Legacy Folder Upload' });

        expect(legacyUploadButton).toHaveAttribute('data-active', 'true');
        expect(screen.getByRole('button', { name: 'Notarial Batches' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Legal Batches' })).toBeInTheDocument();
        expect(screen.getByText('Legacy upload page')).toBeInTheDocument();

        fireEvent.click(legacyRecordsGroupButton);

        expect(screen.queryByRole('button', { name: 'Legacy Folder Upload' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Notarial Batches' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Legal Batches' })).not.toBeInTheDocument();
    });

    it('keeps legal navigation groups collapsed until the user opens them', () => {
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
            <MemoryRouter initialEntries={[appRoutes.paralegalLegalFiles]}>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route path={appRoutes.paralegalLegalFiles} element={<div>Legal create draft page</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>,
        );

        const legalFilesGroupButton = screen.getByRole('button', { name: 'Legal Files' });

        expect(screen.getByText('Legal create draft page')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Create Draft' })).not.toBeInTheDocument();

        fireEvent.click(legalFilesGroupButton);

        expect(screen.getByRole('button', { name: 'Create Draft' })).toHaveAttribute('data-active', 'true');

        fireEvent.click(legalFilesGroupButton);

        expect(screen.queryByRole('button', { name: 'Create Draft' })).not.toBeInTheDocument();
    });

    it('switches from legal to brokerage without bouncing back to the legal navigation', () => {
        render(
            <MemoryRouter initialEntries={[appRoutes.paralegalDashboard]}>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route path={appRoutes.paralegalDashboard} element={<div>Legal dashboard</div>} />
                        <Route path={appRoutes.dashboard} element={<div>Brokerage dashboard</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Brokerage' }));

        expect(screen.getByText('Brokerage dashboard')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Transaction Oversight' })).toBeInTheDocument();
        expect(screen.getByText('Customs Brokerage')).toBeInTheDocument();
        expect(screen.queryByText('Law Firm')).not.toBeInTheDocument();
        expect(localStorage.getItem('activeModule')).toBe('brokerage');
    });

    it('shows Records as a brokerage sidebar group with archive child destinations', () => {
        render(
            <MemoryRouter initialEntries={[appRoutes.legacyFolderUpload]}>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route path={appRoutes.archivesWildcard} element={<div>Legacy upload page</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>,
        );

        const recordsGroupButton = screen.getByRole('button', { name: 'Records' });
        const legacyUploadButton = screen.getByRole('button', { name: 'Legacy Folder Upload' });

        expect(recordsGroupButton).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Records Archive' })).toBeInTheDocument();
        expect(legacyUploadButton).toHaveAttribute('data-active', 'true');
        expect(screen.getByRole('button', { name: 'Legacy Batches' })).toBeInTheDocument();
        expect(screen.getByText('Legacy upload page')).toBeInTheDocument();

        fireEvent.click(recordsGroupButton);

        expect(screen.queryByRole('button', { name: 'Records Archive' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Legacy Folder Upload' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Legacy Batches' })).not.toBeInTheDocument();
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
        expect(screen.queryByRole('button', { name: 'Records' })).not.toBeInTheDocument();
    });

    it('shows the accountant navigation label as Accounting Tasks', () => {
        mockUseAuth.mockReturnValue({
            user: {
                name: 'Accountant User',
                email: 'accountant@example.com',
                role: 'accounting',
                departments: ['brokerage'],
                multi_department: false,
            },
            logout: vi.fn(),
        });

        render(
            <MemoryRouter initialEntries={[appRoutes.accountantImpExp]}>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route path={appRoutes.accountantImpExp} element={<div>Accounting tasks page</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getByRole('button', { name: 'Accounting Tasks' })).toHaveAttribute('data-active', 'true');
        expect(screen.queryByRole('button', { name: 'ImpExp' })).not.toBeInTheDocument();
        expect(screen.getByText('Accounting tasks page')).toBeInTheDocument();
    });

    it('shows the encoder dashboard as the brokerage home for encoder users', () => {
        mockUseAuth.mockReturnValue({
            user: {
                name: 'Encoder User',
                email: 'encoder@example.com',
                role: 'encoder',
                departments: ['brokerage'],
                multi_department: false,
            },
            logout: vi.fn(),
        });

        render(
            <MemoryRouter initialEntries={[appRoutes.encoderDashboard]}>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route path={appRoutes.encoderDashboard} element={<div>Encoder dashboard</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getByText('Encoder dashboard')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Dashboard' })).toHaveAttribute('data-active', 'true');
        expect(screen.getByRole('button', { name: 'Tracking' })).toBeInTheDocument();
        const recordsGroupButton = screen.getByRole('button', { name: 'Records' });

        expect(recordsGroupButton).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Records Archive' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Legacy Folder Upload' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Legacy Batches' })).toBeInTheDocument();
    });

    it('highlights the encoder records child route inside the brokerage records group', () => {
        mockUseAuth.mockReturnValue({
            user: {
                name: 'Encoder User',
                email: 'encoder@example.com',
                role: 'encoder',
                departments: ['brokerage'],
                multi_department: false,
            },
            logout: vi.fn(),
        });

        render(
            <MemoryRouter initialEntries={[appRoutes.encoderLegacyFolderUpload]}>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route path={appRoutes.encoderRecordsWildcard} element={<div>Encoder legacy upload</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>,
        );

        expect(screen.getByText('Encoder legacy upload')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Records' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Legacy Folder Upload' })).toHaveAttribute('data-active', 'true');
    });

    it('collapses and expands the sidebar via the toggle trigger', () => {
        render(
            <MemoryRouter initialEntries={[appRoutes.help]}>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route path={appRoutes.help} element={<div>Help page</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>,
        );

        const desktopSidebar = document.querySelector('[data-slot="sidebar"]');
        expect(desktopSidebar).toHaveAttribute('data-state', 'expanded');

        // Both the header trigger and the edge rail expose "Toggle Sidebar"; either toggles.
        const [toggleButton] = screen.getAllByRole('button', { name: 'Toggle Sidebar' });
        fireEvent.click(toggleButton);
        expect(desktopSidebar).toHaveAttribute('data-state', 'collapsed');

        fireEvent.click(toggleButton);
        expect(desktopSidebar).toHaveAttribute('data-state', 'expanded');
    });

    it('renders company branding and module switcher accessible in both expanded and collapsed states', () => {
        render(
            <MemoryRouter initialEntries={[appRoutes.dashboard]}>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route path={appRoutes.dashboard} element={<div>Dashboard</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>,
        );

        const desktopSidebar = document.querySelector('[data-slot="sidebar"]');
        expect(desktopSidebar).toHaveAttribute('data-state', 'expanded');

        expect(screen.getByRole('button', { name: 'F.M Morata' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Brokerage' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Legal' })).toBeInTheDocument();

        const [toggleButton] = screen.getAllByRole('button', { name: 'Toggle Sidebar' });
        fireEvent.click(toggleButton);
        expect(desktopSidebar).toHaveAttribute('data-state', 'collapsed');

        expect(screen.getByRole('button', { name: 'F.M Morata' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Brokerage' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Legal' })).toBeInTheDocument();
    });
});
