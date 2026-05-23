import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ArchiveZipExport } from '../types/archiveHistory.types';
import { useArchiveZipRequests } from './useArchiveZipRequests';

const {
    mockCreateArchiveZipExport,
    mockDeleteArchiveZipExport,
    mockDownloadArchiveZipExport,
    mockGetArchiveZipExports,
    mockRetryArchiveZipExport,
} = vi.hoisted(() => ({
    mockCreateArchiveZipExport: vi.fn(),
    mockDeleteArchiveZipExport: vi.fn(),
    mockDownloadArchiveZipExport: vi.fn(),
    mockGetArchiveZipExports: vi.fn(),
    mockRetryArchiveZipExport: vi.fn(),
}));

vi.mock('../../tracking/api/trackingApi', () => ({
    trackingApi: {
        createArchiveZipExport: mockCreateArchiveZipExport,
        deleteArchiveZipExport: mockDeleteArchiveZipExport,
        downloadArchiveZipExport: mockDownloadArchiveZipExport,
        getArchiveZipExports: mockGetArchiveZipExports,
        retryArchiveZipExport: mockRetryArchiveZipExport,
    },
}));

const makeWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

const makeZipExport = (overrides: Partial<ArchiveZipExport> = {}): ArchiveZipExport => ({
    id: 'zip-1',
    scope: 'folder',
    scope_label: 'Folder',
    year: 2026,
    month: 4,
    type: 'export',
    mine: false,
    status: 'pending',
    status_label: 'Pending',
    filename: 'apr-2026-exports.zip',
    file_size_bytes: 0,
    file_count: 0,
    bl_count: 0,
    error_message: null,
    requested_at: '2026-05-22T01:00:00Z',
    started_at: null,
    completed_at: null,
    expires_at: '2026-05-25T01:00:00Z',
    can_download: false,
    requested_by: { id: 1, name: 'Admin User' },
    ...overrides,
});

describe('useArchiveZipRequests', () => {
    beforeEach(() => {
        mockCreateArchiveZipExport.mockReset();
        mockDeleteArchiveZipExport.mockReset();
        mockDownloadArchiveZipExport.mockReset();
        mockGetArchiveZipExports.mockReset();
        mockRetryArchiveZipExport.mockReset();
    });

    it('maps pending backend zip exports into drawer requests and active folder keys', async () => {
        mockGetArchiveZipExports.mockResolvedValue({
            data: [makeZipExport({ status: 'processing', status_label: 'Processing' })],
        });

        const { result } = renderHook(() => useArchiveZipRequests({ mine: false }), {
            wrapper: makeWrapper(),
        });

        await waitFor(() => expect(result.current.requests).toHaveLength(1));

        expect(result.current.requests[0]).toMatchObject({
            id: 'zip-1',
            requestKey: '4|export',
            folderName: 'APR 2026 EXPORTS',
            status: 'processing',
        });
        expect(result.current.preparingRequestKeys.has('4|export')).toBe(true);
    });

    it('creates a backend zip export request for the selected folder', async () => {
        mockGetArchiveZipExports.mockResolvedValue({ data: [] });
        mockCreateArchiveZipExport.mockResolvedValue(makeZipExport());

        const { result } = renderHook(() => useArchiveZipRequests({ mine: true }), {
            wrapper: makeWrapper(),
        });

        await waitFor(() => expect(mockGetArchiveZipExports).toHaveBeenCalled());

        act(() => {
            result.current.requestFolderZip({
                requestKey: '4|export',
                folderName: 'APR 2026 EXPORTS',
                year: 2026,
                month: 4,
                type: 'export',
                fileCount: 79,
                blCount: 7,
                filename: 'apr-2026-exports.zip',
            });
        });

        await waitFor(() => expect(mockCreateArchiveZipExport).toHaveBeenCalledWith({
            scope: 'folder',
            year: 2026,
            month: 4,
            type: 'export',
            mine: true,
        }));
    });

    it('clears only finished zip export requests', async () => {
        mockGetArchiveZipExports.mockResolvedValue({
            data: [
                makeZipExport({ id: 'ready-zip', status: 'ready', status_label: 'Ready', can_download: true }),
                makeZipExport({ id: 'processing-zip', status: 'processing', status_label: 'Processing' }),
            ],
        });
        mockDeleteArchiveZipExport.mockResolvedValue(undefined);

        const { result } = renderHook(() => useArchiveZipRequests({ mine: false }), {
            wrapper: makeWrapper(),
        });

        await waitFor(() => expect(result.current.requests).toHaveLength(2));

        act(() => {
            result.current.clearFinishedRequests();
        });

        await waitFor(() => expect(mockDeleteArchiveZipExport).toHaveBeenCalledTimes(1));
        expect(mockDeleteArchiveZipExport).toHaveBeenCalledWith('ready-zip');
    });
});
