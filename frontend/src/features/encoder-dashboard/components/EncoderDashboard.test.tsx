import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../lib/appRoutes';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { EncoderDashboard } from './EncoderDashboard';
import { EncoderReportsAnalytics } from './EncoderReportsAnalytics';

const { mockUseEncoderDashboard } = vi.hoisted(() => ({
    mockUseEncoderDashboard: vi.fn(),
}));

vi.mock('../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => <div data-testid="current-date-time" />,
}));

vi.mock('../hooks/useEncoderDashboard', () => ({
    useEncoderDashboard: mockUseEncoderDashboard,
}));

describe('EncoderDashboard', () => {
    beforeEach(() => {
        mockUseEncoderDashboard.mockReturnValue({
            data: {
                kpis: {
                    active_imports: 4,
                    active_exports: 6,
                    needs_update: 2,
                    upcoming_eta_etd: 3,
                    open_remarks: 1,
                    document_gaps: 5,
                },
                reports: {
                    year: 2026,
                    month: 3,
                    monthly_volume: {
                        year: 2026,
                        months: Array.from({ length: 12 }, (_, index) => ({
                            month: index + 1,
                            imports: index === 2 ? 8 : 0,
                            exports: index === 2 ? 5 : 0,
                            total: index === 2 ? 13 : 0,
                        })),
                        total_imports: 8,
                        total_exports: 5,
                        total: 13,
                    },
                    client_volume: {
                        clients: [
                            {
                                client_id: 1,
                                client_name: 'Atlas Imports',
                                client_type: 'importer',
                                imports: 8,
                                exports: 0,
                                total: 8,
                            },
                        ],
                    },
                    turnaround: {
                        imports: {
                            completed_count: 2,
                            avg_days: 4,
                            min_days: 3,
                            max_days: 5,
                        },
                        exports: {
                            completed_count: 1,
                            avg_days: 6,
                            min_days: 6,
                            max_days: 6,
                        },
                    },
                },
                analytics: {
                    year: 2026,
                    month: 3,
                    activity: {
                        transactions_completed: {
                            this_month: {
                                imports: 2,
                                exports: 1,
                                total: 3,
                            },
                            this_year: {
                                imports: 12,
                                exports: 7,
                                total: 19,
                            },
                        },
                        documents_uploaded: {
                            this_month: {
                                total: 31,
                                imports: 20,
                                exports: 11,
                                by_type: [{ key: 'billing', label: 'Billing and Liquidation', count: 9 }],
                            },
                            this_year: {
                                total: 144,
                                imports: 100,
                                exports: 44,
                                by_type: [{ key: 'billing', label: 'Billing and Liquidation', count: 30 }],
                            },
                        },
                        stages_completed: {
                            this_month: {
                                total: 12,
                                imports: {
                                    total: 7,
                                    stages: [{ key: 'billing', label: 'Billing and Liquidation', count: 7 }],
                                },
                                exports: {
                                    total: 5,
                                    stages: [{ key: 'cil', label: 'CIL', count: 5 }],
                                },
                            },
                            this_year: {
                                total: 58,
                                imports: { total: 32, stages: [] },
                                exports: { total: 26, stages: [] },
                            },
                        },
                        records_finalized: {
                            this_month: {
                                imports: 2,
                                exports: 1,
                                total: 3,
                            },
                            this_year: {
                                imports: 12,
                                exports: 7,
                                total: 19,
                            },
                        },
                    },
                    status_breakdown: [
                        { key: 'pending', label: 'Pending', value: 1 },
                        { key: 'in_progress', label: 'In Progress', value: 9 },
                        { key: 'completed', label: 'Completed', value: 4 },
                        { key: 'cancelled', label: 'Cancelled', value: 0 },
                    ],
                    overdue_transactions: {
                        threshold_hours: 48,
                        total: 2,
                        imports: {
                            overdue_count: 1,
                            stale_48_72_count: 1,
                            stale_over_72_count: 0,
                            oldest_hours: 60,
                        },
                        exports: {
                            overdue_count: 1,
                            stale_48_72_count: 0,
                            stale_over_72_count: 1,
                            oldest_hours: 90,
                        },
                    },
                },
                attention_items: [
                    {
                        id: 'needs-update-import-1',
                        ref: 'IMP-ENC-001',
                        type: 'import',
                        status: 'needs_update',
                        title: 'Import record needs an update',
                        detail: 'Current status: Processing. Update the record or upload the next required document.',
                        age: '3d ago',
                        destination: 'imports',
                    },
                    {
                        id: 'remark-export-1',
                        ref: 'BL-ENC-002',
                        type: 'export',
                        status: 'remark',
                        title: 'Open remark needs resolution',
                        detail: 'Client correction still pending.',
                        age: '1h ago',
                        destination: 'documents',
                    },
                ],
            },
            isLoading: false,
            isError: false,
        });
    });

    it('renders encoder workload kpis and attention items', () => {
        renderWithProviders(<EncoderDashboard />, {
            route: appRoutes.encoderDashboard,
            path: appRoutes.encoderDashboard,
        });

        expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
        expect(screen.getByText('Operation Queue')).toBeInTheDocument();
        expect(screen.getByText('Work Completed By You')).toBeInTheDocument();
        expect(screen.getByText('My Imports')).toBeInTheDocument();
        expect(screen.getByText('My Exports')).toBeInTheDocument();
        expect(screen.getByText('ETA/ETD This Week')).toBeInTheDocument();
        expect(screen.getByText('Open Remarks')).toBeInTheDocument();
        expect(screen.getByText('No Update > 48h')).toBeInTheDocument();
        expect(screen.getByText('Needs Update')).toHaveClass('inline-flex', 'w-fit', 'rounded-md', 'uppercase');
        expect(screen.getByText('Document Gaps')).toBeInTheDocument();
        expect(screen.queryByText('My Contribution')).not.toBeInTheDocument();
        expect(screen.getByText('Transactions Completed')).toBeInTheDocument();
        expect(screen.getByText('Documents Added')).toBeInTheDocument();
        expect(screen.getByText('Volume Processed')).toBeInTheDocument();
        expect(screen.getByText('Top Clients Handled')).toBeInTheDocument();
        expect(screen.getByText('Atlas Imports')).toBeInTheDocument();
        expect(screen.getByText('IMP-ENC-001')).toBeInTheDocument();
        expect(screen.getByText('BL-ENC-002')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /View full/i })).toBeInTheDocument();
    });

    it('navigates to the tracking detail from a queue item', () => {
        renderWithProviders(<EncoderDashboard />, {
            route: appRoutes.encoderDashboard,
            path: appRoutes.encoderDashboard,
            routes: [
                {
                    path: appRoutes.trackingDetail,
                    element: <div>Tracking detail route</div>,
                },
            ],
        });

        fireEvent.click(screen.getByRole('button', { name: /IMP-ENC-001/i }));

        expect(screen.getByText('Tracking detail route')).toBeInTheDocument();
    });

    it('navigates to the separate encoder reports page', () => {
        renderWithProviders(<EncoderDashboard />, {
            route: appRoutes.encoderDashboard,
            path: appRoutes.encoderDashboard,
            routes: [
                {
                    path: appRoutes.encoderReportsAnalytics,
                    element: <div>Encoder reports route</div>,
                },
            ],
        });

        fireEvent.click(screen.getByRole('button', { name: /View full/i }));

        expect(screen.getByText('Encoder reports route')).toBeInTheDocument();
    });

    it('renders the separate encoder reports and analytics page', () => {
        renderWithProviders(<EncoderReportsAnalytics />, {
            route: appRoutes.encoderReportsAnalytics,
            path: appRoutes.encoderReportsAnalytics,
        });

        expect(screen.getByRole('heading', { name: 'Reports & Analytics' })).toBeInTheDocument();
        expect(screen.getByText('Transactions Completed')).toBeInTheDocument();
        expect(screen.getByText('Documents Added')).toBeInTheDocument();
        expect(screen.getByText('Volume Processed')).toBeInTheDocument();
        expect(screen.getByText('Top Clients Handled')).toBeInTheDocument();
        expect(screen.getByText('Turnaround Performance')).toBeInTheDocument();
        expect(screen.getByText('Import Stage Output')).toBeInTheDocument();
        expect(screen.getByText('Export Stage Output')).toBeInTheDocument();
        expect(screen.getByText('Atlas Imports')).toBeInTheDocument();
        expect(screen.getByText('Billing and Liquidation')).toBeInTheDocument();
    });
});
