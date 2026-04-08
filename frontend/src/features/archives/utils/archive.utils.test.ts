import { describe, expect, it } from 'vitest';
import type { ArchiveYear } from '../../documents/types/document.types';
import { computeGlobalCompleteness, countIncompleteBLs } from './archive.utils';

const buildArchiveYear = (stages: string[]): ArchiveYear => ({
    year: 2026,
    imports: 1,
    exports: 0,
    documents: stages.map((stage, index) => ({
        id: index + 1,
        type: 'import',
        bl_no: 'BL-1234567',
        month: 4,
        client: 'Dole Philippines Inc.',
        selective_color: 'green',
        destination_country: null,
        transaction_date: '2026-04-01',
        transaction_id: 1,
        documentable_type: 'App\\Models\\ImportTransaction',
        stage,
        filename: `${stage}.pdf`,
        formatted_size: '164.62 KB',
        size_bytes: 168570,
        archive_origin: 'direct_archive_upload',
        archived_at: '2026-04-06T04:39:14Z',
        uploaded_at: '2026-03-24T11:15:00Z',
        uploader: { id: 1, name: 'Encoder User' },
    })),
});

describe('archive completeness', () => {
    it('treats import records with all required stages as complete even without others', () => {
        const archiveData = [
            buildArchiveYear(['boc', 'ppa', 'do', 'port_charges', 'releasing', 'billing']),
        ];

        expect(computeGlobalCompleteness(archiveData)).toBe(100);
        expect(countIncompleteBLs(archiveData)).toBe(0);
    });

    it('does not let others satisfy missing required stages', () => {
        const archiveData = [
            buildArchiveYear(['boc', 'others']),
        ];

        expect(computeGlobalCompleteness(archiveData)).toBe(0);
        expect(countIncompleteBLs(archiveData)).toBe(1);
    });
});
