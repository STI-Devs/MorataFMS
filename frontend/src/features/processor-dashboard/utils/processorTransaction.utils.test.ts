import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    applyQueueFilter,
    buildStageChip,
    compareQueueRows,
    formatDateLabel,
    getNextActionLabel,
    getSortAnchor,
    isOverdue,
    stageToneClassName,
    type ProcessorQueueRow,
    type QueueStageChip,
} from './processorTransaction.utils';

function makeRow(overrides: Partial<ProcessorQueueRow> = {}): ProcessorQueueRow {
    return {
        id: 1,
        ref: 'BL-001',
        clientName: 'Acme',
        typeLabel: 'Import',
        primaryMeta: 'ETA Apr 15, 2026',
        secondaryMeta: null,
        state: 'ready',
        nextActionLabel: 'PPA ready now',
        blocker: null,
        waitingLabel: null,
        isOverdue: false,
        stageChips: [],
        searchableText: 'bl-001 acme',
        selectedTransaction: {
            id: 1,
            ref: 'BL-001',
            clientName: 'Acme',
            type: 'import',
        },
        ...overrides,
    };
}

describe('processorTransaction.utils', () => {
    describe('buildStageChip', () => {
        it('returns N/A chip when stage is not applicable', () => {
            expect(buildStageChip('ppa', 'PPA', 'pending', false, true)).toEqual({
                key: 'ppa',
                label: 'PPA N/A',
                tone: 'na',
            });
        });

        it('returns Uploaded chip for completed status', () => {
            expect(buildStageChip('ppa', 'PPA', 'completed', false, false)).toEqual({
                key: 'ppa',
                label: 'PPA Uploaded',
                tone: 'uploaded',
            });
        });

        it('returns For Review chip for in_progress or review status', () => {
            expect(buildStageChip('ppa', 'PPA', 'in_progress', false, false).tone).toBe('review');
            expect(buildStageChip('ppa', 'PPA', 'review', false, false).tone).toBe('review');
        });

        it('returns Action Needed chip for rejected status', () => {
            expect(buildStageChip('ppa', 'PPA', 'rejected', false, false)).toEqual({
                key: 'ppa',
                label: 'PPA Action Needed',
                tone: 'action',
            });
        });

        it('returns Ready when actionable and no terminal status', () => {
            expect(buildStageChip('ppa', 'PPA', undefined, true, false)).toEqual({
                key: 'ppa',
                label: 'PPA Ready',
                tone: 'ready',
            });
        });

        it('returns Waiting as the default fallback', () => {
            expect(buildStageChip('ppa', 'PPA', undefined, false, false).tone).toBe('waiting');
        });
    });

    describe('getNextActionLabel', () => {
        const ready = (label: string): QueueStageChip => ({ key: label, label: `${label} Ready`, tone: 'ready' });

        it('returns review fallback when no chip is ready', () => {
            expect(getNextActionLabel([])).toBe('Review transaction status');
            expect(getNextActionLabel([{ key: 'a', label: 'PPA Waiting', tone: 'waiting' }])).toBe('Review transaction status');
        });

        it('returns single-stage label when exactly one chip is ready', () => {
            expect(getNextActionLabel([ready('PPA')])).toBe('PPA ready now');
        });

        it('summarizes count when more than one chip is ready', () => {
            expect(getNextActionLabel([ready('PPA'), ready('Port Charges')])).toBe('2 stages ready now');
        });
    });

    describe('applyQueueFilter', () => {
        const rows = [
            makeRow({ id: 1, state: 'ready', isOverdue: false }),
            makeRow({ id: 2, state: 'waiting', isOverdue: true }),
            makeRow({ id: 3, state: 'waiting', isOverdue: false }),
        ];

        it('returns all rows for "all"', () => {
            expect(applyQueueFilter(rows, 'all').map(r => r.id)).toEqual([1, 2, 3]);
        });

        it('keeps only ready rows for "ready"', () => {
            expect(applyQueueFilter(rows, 'ready').map(r => r.id)).toEqual([1]);
        });

        it('keeps only waiting rows for "blocked"', () => {
            expect(applyQueueFilter(rows, 'blocked').map(r => r.id)).toEqual([2, 3]);
        });

        it('keeps only overdue rows for "overdue"', () => {
            expect(applyQueueFilter(rows, 'overdue').map(r => r.id)).toEqual([2]);
        });
    });

    describe('compareQueueRows', () => {
        it('puts overdue rows first', () => {
            const result = [
                makeRow({ id: 1, isOverdue: false }),
                makeRow({ id: 2, isOverdue: true }),
            ].sort(compareQueueRows);

            expect(result.map(r => r.id)).toEqual([2, 1]);
        });

        it('orders by oldest waiting time when overdue parity matches', () => {
            const result = [
                makeRow({ id: 1, waitingLabel: 'Waiting 2 hours' }),
                makeRow({ id: 2, waitingLabel: 'Waiting 5 hours' }),
                makeRow({ id: 3, waitingLabel: 'Waiting 1 day' }),
            ].sort(compareQueueRows);

            expect(result.map(r => r.id)).toEqual([3, 2, 1]);
        });
    });

    describe('getSortAnchor', () => {
        it('returns MAX_SAFE_INTEGER for null', () => {
            expect(getSortAnchor(null)).toBe(Number.MAX_SAFE_INTEGER);
        });

        it('returns 0 for "<1 hour"', () => {
            expect(getSortAnchor('<1 hour ago')).toBe(0);
        });

        it('returns negative hours for hour-based labels', () => {
            expect(getSortAnchor('Waiting 5 hours')).toBe(-5);
            expect(getSortAnchor('Waiting 1 hour')).toBe(-1);
        });

        it('returns negative hours-equivalent for day-based labels', () => {
            expect(getSortAnchor('Waiting 2 days')).toBe(-48);
            expect(getSortAnchor('Waiting 1 day')).toBe(-24);
        });

        it('returns MAX_SAFE_INTEGER for unparseable labels', () => {
            expect(getSortAnchor('garbage label')).toBe(Number.MAX_SAFE_INTEGER);
        });
    });

    describe('isOverdue', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-04-15T00:00:00Z'));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('returns false for null/undefined', () => {
            expect(isOverdue(null)).toBe(false);
            expect(isOverdue(undefined)).toBe(false);
        });

        it('returns true for dates 48h or more in the past', () => {
            expect(isOverdue('2026-04-12T00:00:00Z')).toBe(true);
        });

        it('returns false for recent dates', () => {
            expect(isOverdue('2026-04-14T12:00:00Z')).toBe(false);
        });

        it('returns false for invalid dates', () => {
            expect(isOverdue('not a date')).toBe(false);
        });
    });

    describe('formatDateLabel', () => {
        it('formats valid dates as "Mon D, YYYY"', () => {
            expect(formatDateLabel('2026-04-15T00:00:00Z')).toMatch(/Apr 1[45], 2026/);
        });

        it('returns the original string for invalid dates', () => {
            expect(formatDateLabel('not a date')).toBe('not a date');
        });
    });

    describe('stageToneClassName', () => {
        it('maps each tone to a non-empty Tailwind class string', () => {
            const tones = ['ready', 'uploaded', 'review', 'action', 'na', 'waiting'] as const;
            for (const tone of tones) {
                expect(stageToneClassName(tone)).toMatch(/border-/);
            }
        });
    });
});
