import { describe, expect, it } from 'vitest';

import {
    IMPORT_STAGES,
    getImportProcessorActionability,
    getImportProcessorWaitingReason,
} from './stageUtils';

describe('import stage workflow', () => {
    it('places delivery order before payment for PPA charges', () => {
        expect(IMPORT_STAGES.map((stage) => stage.type)).toEqual([
            'boc',
            'bonds',
            'do',
            'ppa',
            'port_charges',
            'releasing',
            'billing',
        ]);
    });

    it('keeps PPA waiting until delivery order is completed', () => {
        const stages = {
            boc: 'completed',
            bonds: 'completed',
            do: 'pending',
            ppa: 'pending',
            port_charges: 'pending',
        };

        expect(getImportProcessorActionability(stages).ppa).toBe(false);
        expect(getImportProcessorWaitingReason(stages)).toBe('Waiting for Delivery Order Request.');
    });
});
