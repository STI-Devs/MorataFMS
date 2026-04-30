import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '../../../lib/axios';
import { trackingApi } from './trackingApi';

describe('trackingApi.uploadDocuments', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('uploads every file and returns the created documents', async () => {
        const firstDocument = {
            id: 11,
            type: 'boc',
            filename: 'first.png',
            size_bytes: 100,
            formatted_size: '100 B',
            version: 1,
            download_url: '/api/documents/11/download',
            uploaded_by: { id: 1, name: 'Encoder User' },
            created_at: '2026-04-13T00:00:00Z',
            updated_at: '2026-04-13T00:00:00Z',
        };
        const secondDocument = {
            ...firstDocument,
            id: 12,
            filename: 'second.png',
            download_url: '/api/documents/12/download',
        };

        const uploadDocumentSpy = vi.spyOn(trackingApi, 'uploadDocument')
            .mockResolvedValueOnce(firstDocument)
            .mockResolvedValueOnce(secondDocument);

        const result = await trackingApi.uploadDocuments({
            files: [
                new File(['first'], 'first.png', { type: 'image/png' }),
                new File(['second'], 'second.png', { type: 'image/png' }),
            ],
            type: 'boc',
            documentable_type: 'App\\Models\\ImportTransaction',
            documentable_id: 42,
        });

        expect(uploadDocumentSpy).toHaveBeenCalledTimes(2);
        expect(result).toEqual([firstDocument, secondDocument]);
    });

    it('rolls back earlier uploads and surfaces the failing filename when a later file fails', async () => {
        const uploadedDocument = {
            id: 21,
            type: 'boc',
            filename: 'first.png',
            size_bytes: 100,
            formatted_size: '100 B',
            version: 1,
            download_url: '/api/documents/21/download',
            uploaded_by: { id: 1, name: 'Encoder User' },
            created_at: '2026-04-13T00:00:00Z',
            updated_at: '2026-04-13T00:00:00Z',
        };
        const uploadError = {
            response: {
                data: {
                    message: 'The file failed to upload.',
                },
            },
        };

        vi.spyOn(trackingApi, 'uploadDocument')
            .mockResolvedValueOnce(uploadedDocument)
            .mockRejectedValueOnce(uploadError);
        const deleteDocumentSpy = vi.spyOn(trackingApi, 'deleteDocument').mockResolvedValue(undefined);

        await expect(
            trackingApi.uploadDocuments({
                files: [
                    new File(['first'], 'first.png', { type: 'image/png' }),
                    new File(['second'], 'second.png', { type: 'image/png' }),
                ],
                type: 'boc',
                documentable_type: 'App\\Models\\ImportTransaction',
                documentable_id: 42,
            }),
        ).rejects.toMatchObject({
            response: {
                data: {
                    message: 'Failed to upload "second.png". Uploaded files were rolled back. The file failed to upload.',
                },
            },
        });

        expect(deleteDocumentSpy).toHaveBeenCalledWith(21);
    });

    it('rejects selections that exceed the multi-upload limit before sending requests', async () => {
        const uploadDocumentSpy = vi.spyOn(trackingApi, 'uploadDocument');

        await expect(
            trackingApi.uploadDocuments({
                files: Array.from({ length: 11 }, (_, index) => new File([`${index}`], `file-${index}.png`, { type: 'image/png' })),
                type: 'boc',
                documentable_type: 'App\\Models\\ImportTransaction',
                documentable_id: 42,
            }),
        ).rejects.toThrow('You can upload up to 10 files at a time.');

        expect(uploadDocumentSpy).not.toHaveBeenCalled();
    });

    it('rejects oversized files before sending requests', async () => {
        const oversizedFile = new File([new Uint8Array(1)], 'large.png', { type: 'image/png' });
        Object.defineProperty(oversizedFile, 'size', { value: 21 * 1024 * 1024 });
        const postSpy = vi.spyOn(api, 'post');

        await expect(
            trackingApi.uploadDocuments({
                files: [oversizedFile],
                type: 'boc',
                documentable_type: 'App\\Models\\ImportTransaction',
                documentable_id: 42,
            }),
        ).rejects.toThrow('Each file must be 20MB or less.');

        expect(postSpy).not.toHaveBeenCalled();
    });
});

describe('trackingApi.uploadVesselBillingDocuments', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('posts the selected files to the vessel billing endpoint as multipart form data', async () => {
        const firstFile = new File(['billing'], 'billing.pdf', { type: 'application/pdf' });
        const secondFile = new File(['liquidation'], 'liquidation.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const postSpy = vi.spyOn(api, 'post').mockResolvedValue({
            data: {
                data: {
                    vessel_name: 'MV Shared Ledger',
                    affected_transaction_ids: [11, 12],
                    affected_transactions_count: 2,
                    uploaded_documents_count: 4,
                },
            },
        });

        const result = await trackingApi.uploadVesselBillingDocuments({
            files: [firstFile, secondFile],
            documentable_type: 'App\\Models\\ImportTransaction',
            documentable_id: 42,
        });

        expect(postSpy).toHaveBeenCalledWith(
            '/api/documents/vessel-billing',
            expect.any(FormData),
            {
                headers: { 'Content-Type': 'multipart/form-data' },
            },
        );

        const sentFormData = postSpy.mock.calls[0]?.[1] as FormData;
        expect(sentFormData.get('documentable_type')).toBe('App\\Models\\ImportTransaction');
        expect(sentFormData.get('documentable_id')).toBe('42');
        expect(sentFormData.getAll('files[]')).toEqual([firstFile, secondFile]);
        expect(result.affected_transactions_count).toBe(2);
    });
});

describe('trackingApi.createArchiveImportWithDocuments', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('creates the archive record first and uploads documents individually', async () => {
        const transaction = { id: 42, bl_no: 'BL-123' };
        const createArchiveSpy = vi.spyOn(trackingApi, 'createArchiveImport').mockResolvedValue(transaction as never);
        const uploadDocumentSpy = vi.spyOn(trackingApi, 'uploadDocument').mockResolvedValue({
            id: 1,
            type: 'boc',
            filename: 'first.png',
            size_bytes: 100,
            formatted_size: '100 B',
            version: 1,
            download_url: '/api/documents/1/download',
            uploaded_by: { id: 1, name: 'Encoder User' },
            created_at: '2026-04-13T00:00:00Z',
            updated_at: '2026-04-13T00:00:00Z',
        });

        const result = await trackingApi.createArchiveImportWithDocuments({
            bl_no: 'BL-123',
            vessel_name: 'MV Legacy Aurora',
            selective_color: 'green',
            importer_id: 9,
            location_of_goods_id: 51,
            file_date: '2026-04-13',
            not_applicable_stages: ['bonds'],
            documents: [
                { file: new File(['first'], 'first.png', { type: 'image/png' }), stage: 'boc' },
                { file: new File(['second'], 'second.png', { type: 'image/png' }), stage: 'others' },
            ],
        });

        expect(createArchiveSpy).toHaveBeenCalledWith({
            bl_no: 'BL-123',
            vessel_name: 'MV Legacy Aurora',
            selective_color: 'green',
            importer_id: 9,
            location_of_goods_id: 51,
            file_date: '2026-04-13',
            not_applicable_stages: ['bonds'],
        });
        expect(uploadDocumentSpy).toHaveBeenCalledTimes(2);
        expect(uploadDocumentSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({
            type: 'boc',
            documentable_type: 'App\\Models\\ImportTransaction',
            documentable_id: 42,
        }));
        expect(uploadDocumentSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({
            type: 'others',
            documentable_type: 'App\\Models\\ImportTransaction',
            documentable_id: 42,
        }));
        expect(result).toBe(transaction);
    });

    it('rolls back the archive transaction when a document upload fails', async () => {
        const transaction = { id: 77, bl_no: 'BL-ROLLBACK' };
        const uploadError = {
            response: {
                data: {
                    message: 'The file failed to upload.',
                },
            },
        };

        vi.spyOn(trackingApi, 'createArchiveImport').mockResolvedValue(transaction as never);
        vi.spyOn(trackingApi, 'uploadDocument')
            .mockResolvedValueOnce({
                id: 1,
                type: 'boc',
                filename: 'first.png',
                size_bytes: 100,
                formatted_size: '100 B',
                version: 1,
                download_url: '/api/documents/1/download',
                uploaded_by: { id: 1, name: 'Encoder User' },
                created_at: '2026-04-13T00:00:00Z',
                updated_at: '2026-04-13T00:00:00Z',
            })
            .mockRejectedValueOnce(uploadError);
        const rollbackSpy = vi.spyOn(trackingApi, 'rollbackArchiveImport').mockResolvedValue(undefined);

        await expect(
            trackingApi.createArchiveImportWithDocuments({
                bl_no: 'BL-ROLLBACK',
                selective_color: 'green',
                importer_id: 9,
                file_date: '2026-04-13',
                documents: [
                    { file: new File(['first'], 'first.png', { type: 'image/png' }), stage: 'boc' },
                    { file: new File(['second'], 'second.png', { type: 'image/png' }), stage: 'others' },
                ],
            }),
        ).rejects.toMatchObject({
            response: {
                data: {
                    message: 'Failed to upload archive documents. The archive record and uploaded files were rolled back. The file failed to upload.',
                },
            },
        });

        expect(rollbackSpy).toHaveBeenCalledWith(77);
    });
});

describe('trackingApi.replaceDocument', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('posts the replacement file as multipart form data', async () => {
        const file = new File(['replacement'], 'replacement.pdf', { type: 'application/pdf' });
        const postSpy = vi.spyOn(api, 'post').mockResolvedValue({
            data: {
                data: {
                    id: 91,
                    filename: 'replacement.pdf',
                },
            },
        });

        await trackingApi.replaceDocument(91, file);

        expect(postSpy).toHaveBeenCalledWith(
            '/api/documents/91/replace',
            expect.any(FormData),
            {
                headers: { 'Content-Type': 'multipart/form-data' },
            },
        );

        const sentFormData = postSpy.mock.calls[0]?.[1];
        expect(sentFormData).toBeInstanceOf(FormData);
        expect((sentFormData as FormData).get('file')).toBe(file);
    });

    it('rejects oversized replacement files before posting', async () => {
        const oversizedFile = new File([new Uint8Array(1)], 'replacement.pdf', { type: 'application/pdf' });
        Object.defineProperty(oversizedFile, 'size', { value: 21 * 1024 * 1024 });
        const postSpy = vi.spyOn(api, 'post');

        await expect(trackingApi.replaceDocument(91, oversizedFile)).rejects.toThrow('Each file must be 20MB or less.');

        expect(postSpy).not.toHaveBeenCalled();
    });
});
