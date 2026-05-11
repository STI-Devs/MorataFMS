import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { resetAuthProviderStateForTests } from './features/auth/context/authProviderState';
import { appRoutes } from './lib/appRoutes';
import { createTestQueryClient } from './test/renderWithProviders';

const { mockGetCurrentUser, mockLogin, mockLogout } = vi.hoisted(() => ({
    mockGetCurrentUser: vi.fn(),
    mockLogin: vi.fn(),
    mockLogout: vi.fn(),
}));

vi.mock('./features/auth/api/authApi', () => ({
    InvalidCurrentUserPayloadError: class InvalidCurrentUserPayloadError extends Error {
        public constructor(message = 'Invalid current user payload.') {
            super(message);
            this.name = 'InvalidCurrentUserPayloadError';
        }
    },
    authApi: {
        getCurrentUser: mockGetCurrentUser,
        login: mockLogin,
        logout: mockLogout,
    },
}));

function renderApp(route = appRoutes.landing) {
    return render(
        <QueryClientProvider client={createTestQueryClient()}>
            <MemoryRouter initialEntries={[route]}>
                <App />
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe('App bootstrap routing', () => {
    beforeEach(() => {
        mockGetCurrentUser.mockReset();
        mockLogin.mockReset();
        mockLogout.mockReset();
        resetAuthProviderStateForTests();
    });

    it('keeps routes hidden during auth bootstrap before showing service unavailable', async () => {
        let rejectBootstrap!: (error: Error) => void;

        mockGetCurrentUser.mockReturnValue(
            new Promise((_, reject) => {
                rejectBootstrap = reject;
            }),
        );

        renderApp();

        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.queryByText('Sign In')).not.toBeInTheDocument();

        rejectBootstrap(new Error('Backend unavailable'));

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Service Unavailable' })).toBeInTheDocument();
        });

        expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    });
});
