import { afterEach, describe, expect, it, vi } from 'vitest';

import api from '../../../lib/axios';
import { auditLogApi } from './auditLogApi';

describe('auditLogApi.getLogs', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('maps audit log filters to the backend query contract', async () => {
        const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
            data: {
                data: [],
                meta: {
                    current_page: 1,
                    last_page: 1,
                    per_page: 25,
                    total: 0,
                },
            },
        });

        await auditLogApi.getLogs({
            search: 'Support Admin',
            action: 'created',
            category: 'business',
            actor: 'human',
            date_from: '2026-05-01',
            date_to: '2026-05-22',
            page: 2,
            per_page: 25,
        });

        expect(getSpy).toHaveBeenCalledWith('/api/audit-logs', {
            params: {
                search: 'Support Admin',
                event: 'created',
                category: 'business',
                from: '2026-05-01',
                to: '2026-05-22',
                page: 2,
                per_page: 25,
                actor: 'human',
            },
        });
    });
});

describe('auditLogApi.getActions', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('requests event options using the active audit filters', async () => {
        const getSpy = vi.spyOn(api, 'get').mockResolvedValue({
            data: {
                data: ['created'],
            },
        });

        await auditLogApi.getActions({
            search: 'Support Admin',
            category: 'business',
            actor: 'human',
            date_from: '2026-05-01',
            date_to: '2026-05-22',
        });

        expect(getSpy).toHaveBeenCalledWith('/api/audit-logs/actions', {
            params: {
                search: 'Support Admin',
                category: 'business',
                from: '2026-05-01',
                to: '2026-05-22',
                actor: 'human',
            },
        });
    });
});
