import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuditLogFilters, AuditLogListResponse } from '../types/auditLog.types';
import { AuditLogs } from './AuditLogs';
import { useAuditActions, useAuditLogs } from '../hooks/useAuditLogs';

vi.mock('../hooks/useAuditLogs', () => ({
    useAuditActions: vi.fn(),
    useAuditLogs: vi.fn(),
}));

const mockAuditLogResponse: AuditLogListResponse = {
    data: [],
    meta: {
        current_page: 1,
        last_page: 1,
        per_page: 25,
        total: 0,
    },
    summary: {
        total: 0,
        created: 0,
        updated: 0,
        deleted: 0,
    },
};

describe('AuditLogs', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.mocked(useAuditLogs).mockReturnValue({
            data: mockAuditLogResponse,
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useAuditLogs>);
        vi.mocked(useAuditActions).mockReturnValue({
            data: ['created', 'updated', 'deleted'],
        } as unknown as ReturnType<typeof useAuditActions>);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('debounces the search filter before updating the query filters', () => {
        render(<AuditLogs />);

        const getLastFilters = (): AuditLogFilters | undefined =>
            vi.mocked(useAuditLogs).mock.calls.at(-1)?.[0];

        const searchInput = screen.getByPlaceholderText('Search by user...');

        expect(getLastFilters()?.search).toBeUndefined();

        fireEvent.change(searchInput, { target: { value: 'admin' } });

        expect(getLastFilters()?.search).toBeUndefined();

        act(() => {
            vi.advanceTimersByTime(299);
        });

        expect(getLastFilters()?.search).toBeUndefined();

        act(() => {
            vi.advanceTimersByTime(1);
        });

        expect(getLastFilters()?.search).toBe('admin');
    });

    it('renders backend summary counts for the current audit filter', () => {
        vi.mocked(useAuditLogs).mockReturnValue({
            data: {
                ...mockAuditLogResponse,
                summary: {
                    total: 51,
                    created: 22,
                    updated: 1,
                    deleted: 2,
                },
            },
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useAuditLogs>);

        render(<AuditLogs />);

        expect(screen.getByText('51')).toBeInTheDocument();
        expect(screen.getByText('22')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('shows only event filters returned by the backend', () => {
        vi.mocked(useAuditActions).mockReturnValue({
            data: ['created', 'status_changed'],
        } as unknown as ReturnType<typeof useAuditActions>);

        render(<AuditLogs />);

        expect(screen.getByRole('option', { name: 'Created' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Status Changed' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'Login' })).not.toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'Logout' })).not.toBeInTheDocument();
    });

    it('updates filters when clicking actor filter pills', () => {
        render(<AuditLogs />);

        const getLastFilters = (): AuditLogFilters | undefined =>
            vi.mocked(useAuditLogs).mock.calls.at(-1)?.[0];

        expect(getLastFilters()?.actor).toBe('human');

        fireEvent.click(screen.getByRole('button', { name: 'System Events' }));

        expect(getLastFilters()?.actor).toBe('system');

        fireEvent.click(screen.getByRole('button', { name: 'All Activity' }));

        expect(getLastFilters()?.actor).toBe('all');
    });

    it('renders audit log entries and expands diff details when clicked', () => {
        vi.mocked(useAuditLogs).mockReturnValue({
            data: {
                ...mockAuditLogResponse,
                data: [
                    {
                        id: 101,
                        event: 'updated',
                        auditable_type: 'User',
                        auditable_id: 5,
                        auditable_label: 'Juan Dela Cruz',
                        user_id: 1,
                        user: { id: 1, name: 'Admin User' },
                        old_values: { email: 'juan.old@example.com', role: 'encoder' },
                        new_values: { email: 'juan.new@example.com', role: 'processor' },
                        ip_address: '192.168.1.1',
                        user_agent: 'Mozilla/5.0',
                        created_at: '2026-08-25T01:30:00.000000Z',
                    },
                ],
                meta: {
                    current_page: 1,
                    last_page: 1,
                    per_page: 25,
                    total: 1,
                },
            },
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useAuditLogs>);

        render(<AuditLogs />);

        expect(screen.getByText('Admin User')).toBeInTheDocument();
        expect(screen.getAllByText('User').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('2 fields')).toBeInTheDocument();
        expect(screen.getByText('192.168.1.1')).toBeInTheDocument();

        // Click row to toggle accordion diff
        fireEvent.click(screen.getByText('2 fields'));

        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('Role')).toBeInTheDocument();
        expect(screen.getByText('juan.old@example.com')).toBeInTheDocument();
        expect(screen.getByText('juan.new@example.com')).toBeInTheDocument();
    });

    it('clears all filters when reset button is clicked', () => {
        render(<AuditLogs />);

        const getLastFilters = (): AuditLogFilters | undefined =>
            vi.mocked(useAuditLogs).mock.calls.at(-1)?.[0];

        const searchInput = screen.getByPlaceholderText('Search by user...');
        fireEvent.change(searchInput, { target: { value: 'test' } });

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(getLastFilters()?.search).toBe('test');

        const resetButton = screen.getByRole('button', { name: /reset/i });
        expect(resetButton).toBeInTheDocument();

        fireEvent.click(resetButton);

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(getLastFilters()?.search).toBeUndefined();
    });
});
