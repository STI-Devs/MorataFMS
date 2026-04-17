import { describe, expect, it } from 'vitest';
import { makeApiExportTransaction, makeApiImportTransaction } from '../../../test/fixtures/tracking';
import { mapExportTransaction, mapImportTransaction } from './mappers';

describe('tracking status mappers', () => {
    it('preserves import workflow statuses from the backend', () => {
        const mapped = mapImportTransaction(
            makeApiImportTransaction({ status: 'Vessel Arrived' }),
        );

        expect(mapped.status).toBe('Vessel Arrived');
    });

    it('preserves export workflow statuses from the backend', () => {
        const mapped = mapExportTransaction(
            makeApiExportTransaction({ status: 'Departure' }),
        );

        expect(mapped.status).toBe('Departure');
    });

    it('normalizes legacy underscored statuses into readable labels', () => {
        const importMapped = mapImportTransaction(
            makeApiImportTransaction({ status: 'in_progress' }),
        );
        const exportMapped = mapExportTransaction(
            makeApiExportTransaction({ status: 'completed' }),
        );

        expect(importMapped.status).toBe('In Progress');
        expect(exportMapped.status).toBe('Completed');
    });
});
