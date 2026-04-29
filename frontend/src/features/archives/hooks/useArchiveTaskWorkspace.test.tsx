import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ArchiveTaskRecord } from '../types/archiveTask.types';
import { useArchiveTaskWorkspace } from './useArchiveTaskWorkspace';

const { mockUseArchiveOperationalQueue } = vi.hoisted(() => ({
    mockUseArchiveOperationalQueue: vi.fn(),
}));
const {
    mockUpdateArchiveImportStageApplicability,
    mockUpdateArchiveExportStageApplicability,
} = vi.hoisted(() => ({
    mockUpdateArchiveImportStageApplicability: vi.fn(),
    mockUpdateArchiveExportStageApplicability: vi.fn(),
}));
const { mockUploadDocuments } = vi.hoisted(() => ({
    mockUploadDocuments: vi.fn(),
}));

vi.mock('./useArchiveOperationalQueue', () => ({
    useArchiveOperationalQueue: mockUseArchiveOperationalQueue,
}));

vi.mock('../api/archiveTaskApi', () => ({
    archiveTaskApi: {
        getOperationalQueue: vi.fn(),
        updateImportStageApplicability: mockUpdateArchiveImportStageApplicability,
        updateExportStageApplicability: mockUpdateArchiveExportStageApplicability,
    },
}));

vi.mock('../../tracking/api/trackingApi', () => ({
    trackingApi: {
        uploadDocuments: mockUploadDocuments,
    },
}));

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn() },
}));

function makeImportRecord(overrides: Partial<ArchiveTaskRecord> = {}): ArchiveTaskRecord {
    return {
        id: 1,
        type: 'import',
        reference: 'REF-001',
        bl_no: 'BL-001',
        client_name: 'Acme Corp',
        transaction_date: '2026-03-15',
        archive_period: { year: 2026, month: 3, label: 'March 2026' },
        status: 'Completed',
        notes: null,
        selective_color: null,
        location_of_goods: null,
        origin_country: null,
        vessel_name: null,
        stages: { ppa: 'pending', port_charges: 'pending' },
        not_applicable_stages: [],
        my_stage_keys: ['ppa'],
        my_stage_summaries: [
            { key: 'ppa', label: 'PPA', state: 'missing', can_upload: true, documents_count: 0, uploaded_by: null },
        ],
        documents: [],
        contributors: [],
        queue_status: 'needs_my_upload',
        last_updated_at: '2026-04-15T01:00:00Z',
        ...overrides,
    } as ArchiveTaskRecord;
}

function makeWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}

describe('useArchiveTaskWorkspace', () => {
    beforeEach(() => {
        mockUseArchiveOperationalQueue.mockReset();
        mockUpdateArchiveImportStageApplicability.mockReset();
        mockUpdateArchiveExportStageApplicability.mockReset();
        mockUploadDocuments.mockReset();
    });

    it('defaults processor type filter to "import" and accounting to "all"', () => {
        mockUseArchiveOperationalQueue.mockReturnValue({ data: { data: [] }, isLoading: false, isError: false });

        const { result: processorResult } = renderHook(() => useArchiveTaskWorkspace('processor'), {
            wrapper: makeWrapper(),
        });
        expect(processorResult.current.typeFilter).toBe('import');

        const { result: accountingResult } = renderHook(() => useArchiveTaskWorkspace('accounting'), {
            wrapper: makeWrapper(),
        });
        expect(accountingResult.current.typeFilter).toBe('all');
    });

    it('filters records by search term across reference, BL, and client name', () => {
        mockUseArchiveOperationalQueue.mockReturnValue({
            data: {
                data: [
                    makeImportRecord({ id: 1, reference: 'REF-A', bl_no: 'BL-A', client_name: 'Acme' }),
                    makeImportRecord({ id: 2, reference: 'REF-B', bl_no: 'BL-B', client_name: 'Beta Corp' }),
                ],
            },
            isLoading: false,
            isError: false,
        });

        const { result } = renderHook(() => useArchiveTaskWorkspace('accounting'), { wrapper: makeWrapper() });

        act(() => result.current.setSearch('beta'));

        expect(result.current.filteredRecords.map((record) => record.id)).toEqual([2]);
    });

    it('filters by archive period when set', () => {
        mockUseArchiveOperationalQueue.mockReturnValue({
            data: {
                data: [
                    makeImportRecord({ id: 1, archive_period: { year: 2026, month: 3, label: 'March 2026' } }),
                    makeImportRecord({ id: 2, archive_period: { year: 2026, month: 4, label: 'April 2026' } }),
                ],
            },
            isLoading: false,
            isError: false,
        });

        const { result } = renderHook(() => useArchiveTaskWorkspace('accounting'), { wrapper: makeWrapper() });

        act(() => result.current.setPeriodFilter('April 2026'));

        expect(result.current.filteredRecords.map((record) => record.id)).toEqual([2]);
    });

    it('aggregates summary counts based on filtered records and queue_status', () => {
        mockUseArchiveOperationalQueue.mockReturnValue({
            data: {
                data: [
                    makeImportRecord({ id: 1, queue_status: 'needs_my_upload' }),
                    makeImportRecord({ id: 2, queue_status: 'needs_my_upload' }),
                    makeImportRecord({ id: 3, queue_status: 'waiting_on_others' }),
                    makeImportRecord({ id: 4, queue_status: 'completed_by_me' }),
                ],
            },
            isLoading: false,
            isError: false,
        });

        const { result } = renderHook(() => useArchiveTaskWorkspace('accounting'), { wrapper: makeWrapper() });

        expect(result.current.summary).toEqual({
            needs_my_upload: 2,
            waiting_on_others: 1,
            completed_by_me: 1,
            shared_records: 4,
        });
    });

    it('groups records by section into recordsBySection', () => {
        mockUseArchiveOperationalQueue.mockReturnValue({
            data: {
                data: [
                    makeImportRecord({ id: 1, queue_status: 'needs_my_upload' }),
                    makeImportRecord({ id: 2, queue_status: 'completed_by_me' }),
                ],
            },
            isLoading: false,
            isError: false,
        });

        const { result } = renderHook(() => useArchiveTaskWorkspace('accounting'), { wrapper: makeWrapper() });

        expect(result.current.recordsBySection.needs_my_upload.map((record) => record.id)).toEqual([1]);
        expect(result.current.recordsBySection.completed_by_me.map((record) => record.id)).toEqual([2]);
        expect(result.current.recordsBySection.waiting_on_others).toEqual([]);
    });

    it('builds period options sorted descending and unique', () => {
        mockUseArchiveOperationalQueue.mockReturnValue({
            data: {
                data: [
                    makeImportRecord({ id: 1, archive_period: { year: 2026, month: 3, label: 'March 2026' } }),
                    makeImportRecord({ id: 2, archive_period: { year: 2026, month: 3, label: 'March 2026' } }),
                    makeImportRecord({ id: 3, archive_period: { year: 2026, month: 4, label: 'April 2026' } }),
                ],
            },
            isLoading: false,
            isError: false,
        });

        const { result } = renderHook(() => useArchiveTaskWorkspace('accounting'), { wrapper: makeWrapper() });

        expect(result.current.periodOptions).toEqual(['March 2026', 'April 2026']);
    });

    it('routes import-stage applicability changes to the import endpoint', async () => {
        mockUpdateArchiveImportStageApplicability.mockResolvedValue({});
        const record = makeImportRecord({ id: 24 });
        mockUseArchiveOperationalQueue.mockReturnValue({
            data: { data: [record] },
            isLoading: false,
            isError: false,
        });

        const { result } = renderHook(() => useArchiveTaskWorkspace('processor'), { wrapper: makeWrapper() });

        await act(async () => {
            await result.current.handleStageApplicabilityChange(record, 'ppa', true);
        });

        expect(mockUpdateArchiveImportStageApplicability).toHaveBeenCalledWith(24, {
            stage: 'ppa',
            not_applicable: true,
        });
        expect(mockUpdateArchiveExportStageApplicability).not.toHaveBeenCalled();
    });

    it('clears upload error and selectedUploadStage on closeUploadModal', () => {
        mockUseArchiveOperationalQueue.mockReturnValue({ data: { data: [] }, isLoading: false, isError: false });

        const { result } = renderHook(() => useArchiveTaskWorkspace('accounting'), { wrapper: makeWrapper() });

        act(() => {
            result.current.setSelectedUploadStage('billing');
        });
        expect(result.current.selectedUploadStage).toBe('billing');

        act(() => {
            result.current.closeUploadModal();
        });
        expect(result.current.selectedUploadStage).toBeNull();
    });

    it('clears selection on closeDrawer', async () => {
        const record = makeImportRecord({ id: 7 });
        mockUseArchiveOperationalQueue.mockReturnValue({
            data: { data: [record] },
            isLoading: false,
            isError: false,
        });

        const { result } = renderHook(() => useArchiveTaskWorkspace('accounting'), { wrapper: makeWrapper() });

        act(() => result.current.setSelectedRecordId(7));
        await waitFor(() => expect(result.current.selectedRecord?.id).toBe(7));

        act(() => result.current.closeDrawer());
        expect(result.current.selectedRecord).toBeNull();
    });
});
