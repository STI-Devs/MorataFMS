import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LegacyFolderBrowserPanel } from './LegacyFolderBrowserPanel';

const downloadLegacyBatchFile = vi.fn();

vi.mock('../api/legacyBatchApi', () => ({
    legacyBatchApi: {
        downloadLegacyBatchFile: (...args: unknown[]) => downloadLegacyBatchFile(...args),
    },
}));

const batch = {
    id: 'legacy-1',
    batchName: 'VESSEL 1 — Historical Archive',
    rootFolder: 'VESSEL 1',
    uploadedBy: 'R. Santos',
    uploadedById: 1,
    uploadDate: 'Apr 17, 2026',
    status: 'completed' as const,
    statusLabel: 'Completed',
    fileCount: 12,
    uploadedFileCount: 12,
    failedFileCount: 0,
    pendingFileCount: 0,
    totalSize: '420 MB',
    totalSizeBytes: 420 * 1024 * 1024,
    canResume: false,
    metadata: {
        year: '2025',
        department: 'Brokerage',
        notes: 'Historical vessel archive preserved for broker lookup and old records retrieval.',
        preserveNames: true,
        legacyReferenceOnly: true,
    },
    uploadSummary: {
        expected: 12,
        uploaded: 12,
        failed: 0,
        remaining: 0,
    },
    tree: {
        name: 'VESSEL 1',
        type: 'folder' as const,
        children: [
            {
                name: 'KOTA HAKIM',
                type: 'folder' as const,
                children: [
                    {
                        id: 'legacy-file-1',
                        name: 'BL COPY.pdf',
                        type: 'file' as const,
                        size: '120 KB',
                        modified: 'Apr 10, 2025',
                        status: 'uploaded' as const,
                    },
                ],
            },
        ],
    },
    remainingRelativePaths: [],
    startedAt: null,
    completedAt: null,
    lastActivityAt: null,
};

describe('LegacyFolderBrowserPanel', () => {
    beforeEach(() => {
        downloadLegacyBatchFile.mockReset();
    });

    it('renders the batch metadata and notes in the detail drawer', () => {
        render(<LegacyFolderBrowserPanel batch={batch} onClose={() => {}} />);

        expect(screen.getByText(/batch notes/i)).toBeInTheDocument();
        expect(screen.getByText(/historical vessel archive preserved for broker lookup/i)).toBeInTheDocument();
        expect(screen.getByText('Brokerage')).toBeInTheDocument();
        expect(screen.getByText('2025')).toBeInTheDocument();
        expect(screen.getByText(/preserve names/i)).toBeInTheDocument();
        expect(screen.queryByText(/legacy reference/i)).not.toBeInTheDocument();
        expect(screen.getByText(/folder tree/i)).toBeInTheDocument();
    });
});
