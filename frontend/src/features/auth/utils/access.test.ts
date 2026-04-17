import { describe, expect, it } from 'vitest';
import { appRoutes } from '../../../lib/appRoutes';
import type { PermissionMap } from '../../../types/access';
import { getHomePath } from './access';

const createPermissions = (overrides: Partial<PermissionMap>): PermissionMap => ({
    access_brokerage_module: false,
    access_legal_module: false,
    manage_users: false,
    manage_clients: false,
    view_reports: false,
    view_audit_logs: false,
    manage_transaction_oversight: false,
    upload_archives: false,
    manage_notarial_books: false,
    manage_notarial_entries: false,
    ...overrides,
});

describe('getHomePath', () => {
    it('returns the admin dashboard for admins', () => {
        expect(
            getHomePath({
                role: 'admin',
                departments: ['brokerage', 'legal'],
                permissions: createPermissions({
                    access_brokerage_module: true,
                    access_legal_module: true,
                }),
            }),
        ).toBe(appRoutes.dashboard);
    });

    it('returns the paralegal dashboard for paralegals', () => {
        expect(
            getHomePath({
                role: 'paralegal',
                departments: ['legal'],
                permissions: createPermissions({
                    access_brokerage_module: false,
                    access_legal_module: true,
                }),
            }),
        ).toBe(appRoutes.paralegalDashboard);
    });

    it('returns the processor dashboard for processors', () => {
        expect(
            getHomePath({
                role: 'processor',
                departments: ['brokerage'],
                permissions: createPermissions({
                    access_brokerage_module: true,
                    access_legal_module: false,
                }),
            }),
        ).toBe(appRoutes.processorDashboard);
    });

    it('returns the accountant dashboard for accounting users', () => {
        expect(
            getHomePath({
                role: 'accounting',
                departments: ['brokerage'],
                permissions: createPermissions({
                    access_brokerage_module: true,
                    access_legal_module: false,
                }),
            }),
        ).toBe(appRoutes.accountantDashboard);
    });

    it('returns the brokerage dashboard for encoders', () => {
        expect(
            getHomePath({
                role: 'encoder',
                departments: ['brokerage'],
                permissions: createPermissions({
                    access_brokerage_module: true,
                    access_legal_module: false,
                }),
            }),
        ).toBe(appRoutes.tracking);
    });
});
