import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useLegacyUploadOrchestrator } from './useLegacyUploadOrchestrator';

const {
    createBatchMutateAsync,
    appendManifestMutateAsync,
    signUploadsMutateAsync,
    completeUploadsMutateAsync,
    finalizeBatchMutateAsync,
    useLegacyBatchMock,
} = vi.hoisted(() => ({
    createBatchMutateAsync: vi.fn(),
    appendManifestMutateAsync: vi.fn(),
    signUploadsMutateAsync: vi.fn(),
    completeUploadsMutateAsync: vi.fn(),
    finalizeBatchMutateAsync: vi.fn(),
    useLegacyBatchMock: vi.fn(),
}));

vi.mock('./useLegacyBatch', () => ({
    useLegacyBatch: (...args: unknown[]) => useLegacyBatchMock(...args),
}));

vi.mock('./useLegacyBatchMutations', () => ({
    useLegacyBatchMutations: () => ({
        createBatch: { mutateAsync: createBatchMutateAsync },
        appendManifest: { mutateAsync: appendManifestMutateAsync },
        signUploads: { mutateAsync: signUploadsMutateAsync },
        completeUploads: { mutateAsync: completeUploadsMutateAsync },
        finalizeBatch: { mutateAsync: finalizeBatchMutateAsync },
    }),
}));

function buildFolderFile(relativePath: string, size = 6): File {
    const file = new File(['legacy'], relativePath.split('/').pop() ?? 'file.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'webkitRelativePath', { configurable: true, value: relativePath });
    if (size !== 6) {
        Object.defineProperty(file, 'size', { configurable: true, value: size });
    }
    return file;
}

describe('useLegacyUploadOrchestrator', () => {
    beforeEach(() => {
        createBatchMutateAsync.mockReset();
        appendManifestMutateAsync.mockReset();
        signUploadsMutateAsync.mockReset();
        completeUploadsMutateAsync.mockReset();
        finalizeBatchMutateAsync.mockReset();
        useLegacyBatchMock.mockReset();
        useLegacyBatchMock.mockReturnValue({ data: undefined });
    });

    it('starts in the empty phase with no selected files and no preflight', () => {
        const { result } = renderHook(() => useLegacyUploadOrchestrator({}));

        expect(result.current.phase).toBe('empty');
        expect(result.current.selectedFiles).toEqual([]);
        expect(result.current.preflight).toBeNull();
        expect(result.current.isUploadReady).toBe(false);
        expect(result.current.isLargeBatch).toBe(false);
    });

    it('hydrates metadata when a resumeBatch is provided', async () => {
        const resumeBatch = {
            id: 'resume-1',
            batchName: 'Resumed Batch',
            rootFolder: 'VESSEL 1',
            metadata: {
                yearFrom: '2024',
                yearTo: '2025',
                department: 'Legal',
                notes: 'Resume me',
            },
        };
        useLegacyBatchMock.mockReturnValue({ data: resumeBatch });

        const { result } = renderHook(() =>
            useLegacyUploadOrchestrator({ resumeBatchId: 'resume-1' }),
        );

        await waitFor(() => expect(result.current.activeBatch?.id).toBe('resume-1'));
        expect(result.current.meta).toEqual({
            batchName: 'Resumed Batch',
            yearFrom: '2024',
            yearTo: '2025',
            useYearRange: true,
            department: 'Legal',
            notes: 'Resume me',
        });
    });

    it('handleReset returns the orchestrator to the empty phase and invokes onResumeCleared', () => {
        const onResumeCleared = vi.fn();
        const { result } = renderHook(() => useLegacyUploadOrchestrator({ onResumeCleared }));

        act(() => {
            result.current.setMeta({
                batchName: 'Local',
                yearFrom: '2026',
                yearTo: '2026',
                useYearRange: false,
                department: 'Brokerage',
                notes: 'note',
            });
        });

        act(() => {
            result.current.handleReset();
        });

        expect(result.current.phase).toBe('empty');
        expect(result.current.meta.batchName).toBe('');
        expect(onResumeCleared).toHaveBeenCalledTimes(1);
    });

    it('handleCancelUpload flips isCancellingUpload', () => {
        const { result } = renderHook(() => useLegacyUploadOrchestrator({}));

        expect(result.current.isCancellingUpload).toBe(false);

        act(() => {
            result.current.handleCancelUpload();
        });

        expect(result.current.isCancellingUpload).toBe(true);
        expect(result.current.progress.status).toBe('Stopping upload');
    });

    it('moves to the selected phase and reports preflight when files are dropped', () => {
        const { result } = renderHook(() => useLegacyUploadOrchestrator({}));

        const file = buildFolderFile('VESSEL 1/IMPORT ENTRY.pdf');
        const dropEvent = {
            preventDefault: () => undefined,
            dataTransfer: { files: [file] },
        } as unknown as React.DragEvent;

        act(() => {
            result.current.handleDrop(dropEvent);
        });

        expect(result.current.phase).toBe('selected');
        expect(result.current.selectedFiles).toHaveLength(1);
        expect(result.current.folderSummary?.rootName).toBe('VESSEL 1');
        expect(result.current.preflight).not.toBeNull();
    });

    it('isUploadReady requires metadata, uploadable files, and no rejected files', () => {
        const { result } = renderHook(() => useLegacyUploadOrchestrator({}));

        const file = buildFolderFile('VESSEL 1/IMPORT ENTRY.pdf');
        const dropEvent = {
            preventDefault: () => undefined,
            dataTransfer: { files: [file] },
        } as unknown as React.DragEvent;

        act(() => {
            result.current.handleDrop(dropEvent);
        });

        // Files selected but metadata still empty -> not ready
        expect(result.current.hasUploadableFiles).toBe(true);
        expect(result.current.isUploadReady).toBe(false);

        act(() => {
            result.current.setMeta({
                batchName: 'My Legacy Batch',
                yearFrom: '2026',
                yearTo: '2026',
                useYearRange: false,
                department: 'Brokerage',
                notes: '',
            });
        });

        expect(result.current.isUploadReady).toBe(true);
    });
});
