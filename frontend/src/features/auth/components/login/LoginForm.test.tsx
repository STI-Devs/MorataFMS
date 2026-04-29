import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LoginForm } from './LoginForm';

const { mockLogin, mockNavigate } = vi.hoisted(() => ({
    mockLogin: vi.fn(),
    mockNavigate: vi.fn(),
}));

let renderedTurnstileOptions:
    | {
        callback?: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
        'timeout-callback'?: () => void;
    }
    | null = null;

vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({
        login: mockLogin,
    }),
}));

vi.mock('../../utils/access', () => ({
    getHomePath: () => '/dashboard',
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('LoginForm', () => {
    beforeEach(() => {
        vi.unstubAllEnvs();
        mockLogin.mockReset();
        mockNavigate.mockReset();
        renderedTurnstileOptions = null;

        window.turnstile = {
            render: vi.fn((_, options) => {
                renderedTurnstileOptions = options;

                return 'turnstile-widget';
            }),
            reset: vi.fn(),
            remove: vi.fn(),
        };
    });

    it('submits the turnstile token with login credentials when enabled', async () => {
        vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'site-key');
        mockLogin.mockResolvedValue({
            role: 'admin',
        });

        render(
            <MemoryRouter>
                <LoginForm />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(window.turnstile?.render).toHaveBeenCalledTimes(1);
        });

        renderedTurnstileOptions?.callback?.('turnstile-token');

        fireEvent.change(screen.getByPlaceholderText('ENTER YOUR EMAIL'), {
            target: { value: 'admin@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('ENTER YOUR PASSWORD'), {
            target: { value: 'password' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'LOGIN' }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                email: 'admin@example.com',
                password: 'password',
                turnstile_token: 'turnstile-token',
            });
        });
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('blocks submission until the security check is completed when turnstile is enabled', async () => {
        vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'site-key');

        render(
            <MemoryRouter>
                <LoginForm />
            </MemoryRouter>,
        );

        await waitFor(() => {
            expect(window.turnstile?.render).toHaveBeenCalledTimes(1);
        });

        fireEvent.change(screen.getByPlaceholderText('ENTER YOUR EMAIL'), {
            target: { value: 'admin@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('ENTER YOUR PASSWORD'), {
            target: { value: 'password' },
        });
        fireEvent.submit(screen.getByRole('button', { name: 'LOGIN' }).closest('form') as HTMLFormElement);

        expect(mockLogin).not.toHaveBeenCalled();
        expect(screen.getByText('Complete the security check and try again.')).toBeInTheDocument();
    });
});
