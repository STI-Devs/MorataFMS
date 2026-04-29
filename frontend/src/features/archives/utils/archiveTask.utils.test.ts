import { describe, expect, it } from 'vitest';

import {
    buildRowStageChips,
    canToggleArchiveStageApplicability,
    formatDateTime,
    groupDocumentsByStage,
    initials,
    rowStageSummaryLabel,
    shortStageStateLabel,
    stageStateLabel,
    stageStateTone,
    titleCase,
} from './archiveTask.utils';
import type {
    ArchiveTaskDocument,
    ArchiveTaskRecord,
    ArchiveTaskStageState,
    ArchiveTaskStageSummary,
} from '../types/archiveTask.types';

function makeSummary(overrides: Partial<ArchiveTaskStageSummary> = {}): ArchiveTaskStageSummary {
    return {
        key: 'ppa',
        label: 'PPA',
        state: 'missing',
        can_upload: true,
        documents_count: 0,
        uploaded_by: null,
        ...overrides,
    } as ArchiveTaskStageSummary;
}

function makeRecord(overrides: Partial<ArchiveTaskRecord> = {}): ArchiveTaskRecord {
    return {
        id: 1,
        type: 'import',
        my_stage_summaries: [],
        ...overrides,
    } as ArchiveTaskRecord;
}

describe('archiveTask.utils', () => {
    describe('shortStageStateLabel', () => {
        it.each<[ArchiveTaskStageState, string]>([
            ['missing', 'Pending'],
            ['not_applicable', 'N/A'],
            ['uploaded_by_me', 'By Me'],
            ['uploaded_by_admin', 'By Admin'],
            ['uploaded_by_encoder', 'By Encoder'],
            ['shared', 'Shared'],
            ['uploaded_by_other_staff', 'By Staff'],
        ])('%s -> %s', (state, expected) => {
            expect(shortStageStateLabel(state)).toBe(expected);
        });
    });

    describe('rowStageSummaryLabel', () => {
        it('returns singular labels when count is 1', () => {
            expect(rowStageSummaryLabel('uploaded_by_me', 1)).toBe('1 my upload');
            expect(rowStageSummaryLabel('uploaded_by_admin', 1)).toBe('1 admin upload');
        });

        it('returns plural labels when count > 1', () => {
            expect(rowStageSummaryLabel('uploaded_by_me', 3)).toBe('3 my uploads');
            expect(rowStageSummaryLabel('shared', 5)).toBe('5 shared uploads');
        });

        it('uses tailored labels for missing and not_applicable states', () => {
            expect(rowStageSummaryLabel('missing', 1)).toBe('Pending');
            expect(rowStageSummaryLabel('missing', 4)).toBe('4 pending');
            expect(rowStageSummaryLabel('not_applicable', 1)).toBe('N/A');
            expect(rowStageSummaryLabel('not_applicable', 2)).toBe('2 N/A');
        });
    });

    describe('buildRowStageChips', () => {
        it('returns single chip with label:state format when summaries.length === 1', () => {
            const chips = buildRowStageChips([makeSummary({ key: 'ppa', label: 'PPA', state: 'missing' })]);
            expect(chips).toEqual([
                { key: 'ppa', state: 'missing', label: 'PPA: Pending' },
            ]);
        });

        it('groups by state with counts when multiple summaries', () => {
            const chips = buildRowStageChips([
                makeSummary({ key: 'a', state: 'missing' }),
                makeSummary({ key: 'b', state: 'missing' }),
                makeSummary({ key: 'c', state: 'uploaded_by_me' }),
            ]);

            expect(chips.map((c) => ({ state: c.state, label: c.label }))).toEqual([
                { state: 'missing', label: '2 pending' },
                { state: 'uploaded_by_me', label: '1 my upload' },
            ]);
        });

        it('preserves the canonical state ordering', () => {
            const chips = buildRowStageChips([
                makeSummary({ key: 'a', state: 'shared' }),
                makeSummary({ key: 'b', state: 'missing' }),
            ]);

            expect(chips.map((c) => c.state)).toEqual(['missing', 'shared']);
        });
    });

    describe('canToggleArchiveStageApplicability', () => {
        it('returns false for non-processor roles', () => {
            const result = canToggleArchiveStageApplicability(
                'accounting',
                makeRecord({ type: 'import' }),
                makeSummary({ key: 'ppa' }),
            );
            expect(result).toBe(false);
        });

        it('returns false when stage is not optional for processors', () => {
            const result = canToggleArchiveStageApplicability(
                'processor',
                makeRecord({ type: 'import' }),
                makeSummary({ key: 'cil', state: 'missing', documents_count: 0 }),
            );
            expect(result).toBe(false);
        });

        it('returns true for optional import stage when no documents and missing state', () => {
            const result = canToggleArchiveStageApplicability(
                'processor',
                makeRecord({ type: 'import' }),
                makeSummary({ key: 'ppa', state: 'missing', documents_count: 0 }),
            );
            expect(result).toBe(true);
        });

        it('returns true to allow undoing not_applicable state', () => {
            const result = canToggleArchiveStageApplicability(
                'processor',
                makeRecord({ type: 'import' }),
                makeSummary({ key: 'port_charges', state: 'not_applicable', documents_count: 0 }),
            );
            expect(result).toBe(true);
        });

        it('returns false when documents already uploaded for the stage', () => {
            const result = canToggleArchiveStageApplicability(
                'processor',
                makeRecord({ type: 'import' }),
                makeSummary({ key: 'ppa', state: 'missing', documents_count: 2 }),
            );
            expect(result).toBe(false);
        });

        it('honors export-side optional stages (dccci)', () => {
            const result = canToggleArchiveStageApplicability(
                'processor',
                makeRecord({ type: 'export' }),
                makeSummary({ key: 'dccci', state: 'missing', documents_count: 0 }),
            );
            expect(result).toBe(true);
        });
    });

    describe('groupDocumentsByStage', () => {
        const docs: ArchiveTaskDocument[] = [
            { id: 1, type: 'ppa', filename: 'a.pdf' } as ArchiveTaskDocument,
            { id: 2, type: 'ppa', filename: 'b.pdf' } as ArchiveTaskDocument,
            { id: 3, type: 'port_charges', filename: 'c.pdf' } as ArchiveTaskDocument,
        ];

        it('groups documents by their stage type key', () => {
            const grouped = groupDocumentsByStage(docs);
            expect(grouped.get('ppa')?.map((d) => d.id)).toEqual([1, 2]);
            expect(grouped.get('port_charges')?.map((d) => d.id)).toEqual([3]);
        });

        it('preserves insertion order within each group', () => {
            const grouped = groupDocumentsByStage(docs);
            expect(grouped.get('ppa')?.[0].id).toBe(1);
        });
    });

    describe('stageStateLabel', () => {
        it('uses the uploader name for uploaded_by_other_staff', () => {
            expect(stageStateLabel('uploaded_by_other_staff', { id: 1, name: 'Maria', role: 'admin' })).toBe(
                'Maria already uploaded this stage.',
            );
        });

        it('falls back to "Another user" when uploader is null', () => {
            expect(stageStateLabel('uploaded_by_admin', null)).toBe('Another user already uploaded this stage.');
        });

        it('returns canonical messages for terminal states', () => {
            expect(stageStateLabel('missing', null)).toMatch(/No documents/);
            expect(stageStateLabel('not_applicable', null)).toMatch(/not applicable/);
            expect(stageStateLabel('shared', null)).toMatch(/multiple contributors/);
            expect(stageStateLabel('uploaded_by_me', null)).toMatch(/already supplied/);
        });
    });

    describe('stageStateTone', () => {
        it('returns a tone class for each known state', () => {
            const states: ArchiveTaskStageState[] = [
                'missing',
                'not_applicable',
                'uploaded_by_me',
                'uploaded_by_admin',
                'uploaded_by_encoder',
                'shared',
                'uploaded_by_other_staff',
            ];
            for (const state of states) {
                expect(stageStateTone(state)).toMatch(/border-/);
            }
        });
    });

    describe('formatDateTime', () => {
        it('returns "Unknown date" for null', () => {
            expect(formatDateTime(null)).toBe('Unknown date');
        });

        it('returns the original string for invalid dates', () => {
            expect(formatDateTime('not a date')).toBe('not a date');
        });

        it('formats valid ISO dates with month/day/year/time', () => {
            const result = formatDateTime('2026-04-15T08:30:00Z');
            expect(result).toMatch(/2026/);
            expect(result).toMatch(/Apr/);
        });
    });

    describe('titleCase', () => {
        it('converts snake_case to Title Case', () => {
            expect(titleCase('payment_for_ppa')).toBe('Payment For Ppa');
        });

        it('handles single words', () => {
            expect(titleCase('green')).toBe('Green');
        });
    });

    describe('initials', () => {
        it('returns first two initials uppercase', () => {
            expect(initials('Juan Dela Cruz')).toBe('JD');
        });

        it('handles single names', () => {
            expect(initials('Cher')).toBe('C');
        });

        it('skips empty parts', () => {
            expect(initials('  Maria   Santos ')).toBe('MS');
        });
    });
});
