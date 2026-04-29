import { fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { ReportsAnalytics } from './ReportsAnalytics';

const {
    mockUseCurrentDateTime,
    mockUseMonthlyReport,
    mockUseClientReport,
    mockUseTurnaroundReport,
} = vi.hoisted(() => ({
    mockUseCurrentDateTime: vi.fn(),
    mockUseMonthlyReport: vi.fn(),
    mockUseClientReport: vi.fn(),
    mockUseTurnaroundReport: vi.fn(),
}));

vi.mock('../../../hooks/useCurrentDateTime', () => ({
    useCurrentDateTime: mockUseCurrentDateTime,
}));

vi.mock('../hooks/useReports', () => ({
    useMonthlyReport: mockUseMonthlyReport,
    useClientReport: mockUseClientReport,
    useTurnaroundReport: mockUseTurnaroundReport,
}));

describe('ReportsAnalytics', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2031-04-28T09:00:00Z'));

        mockUseCurrentDateTime.mockReturnValue({
            time: '05:00 PM',
            date: 'Apr 28, 2031',
        });
        mockUseMonthlyReport.mockImplementation((year: number) => ({
            data: {
                months: Array.from({ length: 12 }, (_, index) => ({
                    month: index + 1,
                    imports: year === 2026 && index === 0 ? 2 : 0,
                    exports: 0,
                    total: year === 2026 && index === 0 ? 2 : 0,
                })),
                total_imports: year === 2026 ? 2 : 0,
                total_exports: 0,
                total: year === 2026 ? 2 : 0,
            },
            isLoading: false,
        }));
        mockUseClientReport.mockImplementation((year: number) => ({
            data: {
                clients: year === 2026 ? [{
                    client_id: 1,
                    client_name: 'Archive Client',
                    client_type: 'importer',
                    imports: 2,
                    exports: 0,
                    total: 2,
                }] : [],
            },
            isLoading: false,
        }));
        mockUseTurnaroundReport.mockImplementation((year: number) => ({
            data: {
                imports: {
                    completed_count: year === 2026 ? 2 : 0,
                    avg_days: year === 2026 ? 4 : null,
                    min_days: year === 2026 ? 3 : null,
                    max_days: year === 2026 ? 5 : null,
                },
                exports: {
                    completed_count: 0,
                    avg_days: null,
                    min_days: null,
                    max_days: null,
                },
            },
            isLoading: false,
        }));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('builds the year selector from the current year instead of a fixed list', () => {
        renderWithProviders(<ReportsAnalytics />);

        const selects = screen.getAllByRole('combobox');
        const yearSelect = selects[0] as HTMLSelectElement;

        expect(screen.getByRole('option', { name: '2031' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: '2026' })).toBeInTheDocument();
        expect(yearSelect.options).toHaveLength(6);
        expect(yearSelect.value).toBe('2031');
    });

    it('updates report queries when the selected year changes', () => {
        renderWithProviders(<ReportsAnalytics />);

        const [yearSelect] = screen.getAllByRole('combobox');

        fireEvent.change(yearSelect, { target: { value: '2026' } });

        expect(mockUseMonthlyReport).toHaveBeenLastCalledWith(2026);
        expect(mockUseClientReport).toHaveBeenLastCalledWith(2026, undefined);
        expect(mockUseTurnaroundReport).toHaveBeenLastCalledWith(2026, undefined);
        expect(screen.getAllByText('Archive Client')).toHaveLength(2);
        expect(screen.getByText(/2026 · Full Year/i)).toBeInTheDocument();
    });
});
