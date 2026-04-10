import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuditLogFilters, AuditLogListResponse } from '../types/auditLog.types';
import { AuditLogs } from './AuditLogs';
import { useAuditLogs } from '../hooks/useAuditLogs';

vi.mock('../hooks/useAuditLogs', () => ({
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
});
