import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ArchiveRecordOverview } from './ArchiveRecordOverview';

describe('ArchiveRecordOverview', () => {
    it('renders import archive metadata including vessel name and location of goods', () => {
        render(
            <ArchiveRecordOverview
                docs={[
                    {
                        id: 1,
                        type: 'import',
                        bl_no: 'BL-ARCH-IMP-001',
                        month: 4,
                        client: 'Aktiv Multi Trading Co. Phils. Inc.',
                        selective_color: 'orange',
                        vessel_name: 'MV Archive Pearl',
                        location_of_goods: 'South Harbor Warehouse',
                        transaction_date: '2026-04-15',
                        transaction_id: 10,
                        documentable_type: 'App\\Models\\ImportTransaction',
                        stage: 'boc',
                        filename: 'archive-boc.pdf',
                        formatted_size: '100 KB',
                        size_bytes: 102400,
                        archive_origin: 'direct_archive_upload',
                        archived_at: '2026-04-15T00:00:00Z',
                        uploaded_at: '2026-04-15T00:00:00Z',
                        uploader: { id: 1, name: 'Encoder User' },
                    },
                ]}
            />,
        );

        expect(screen.getByText('MV Archive Pearl')).toBeInTheDocument();
        expect(screen.getByText('South Harbor Warehouse')).toBeInTheDocument();
        expect(screen.getByText('Orange')).toBeInTheDocument();
    });

    it('renders export archive metadata including vessel and destination', () => {
        render(
            <ArchiveRecordOverview
                docs={[
                    {
                        id: 2,
                        type: 'export',
                        bl_no: 'BL-ARCH-EXP-001',
                        month: 4,
                        client: 'Global Export Corp.',
                        destination_country: 'Japan',
                        vessel_name: 'MV Export Horizon',
                        transaction_date: '2026-04-16',
                        transaction_id: 11,
                        documentable_type: 'App\\Models\\ExportTransaction',
                        stage: 'boc',
                        filename: 'archive-export.pdf',
                        formatted_size: '120 KB',
                        size_bytes: 122880,
                        archive_origin: 'direct_archive_upload',
                        archived_at: '2026-04-16T00:00:00Z',
                        uploaded_at: '2026-04-16T00:00:00Z',
                        uploader: { id: 2, name: 'Admin User' },
                    },
                ]}
            />,
        );

        expect(screen.getByText('MV Export Horizon')).toBeInTheDocument();
        expect(screen.getByText('Japan')).toBeInTheDocument();
    });

    it('shows the edit action when the archive record is editable', () => {
        const onEdit = vi.fn();

        render(
            <ArchiveRecordOverview
                docs={[
                    {
                        id: 3,
                        type: 'import',
                        bl_no: 'BL-ARCH-EDIT-001',
                        month: 4,
                        client: 'Archive Client',
                        selective_color: 'green',
                        transaction_date: '2026-04-15',
                        transaction_id: 12,
                        documentable_type: 'App\\Models\\ImportTransaction',
                        stage: 'boc',
                        filename: 'archive-boc.pdf',
                        formatted_size: '100 KB',
                        size_bytes: 102400,
                        archive_origin: 'direct_archive_upload',
                        archived_at: '2026-04-15T00:00:00Z',
                        uploaded_at: '2026-04-15T00:00:00Z',
                        uploader: { id: 1, name: 'Encoder User' },
                    },
                ]}
                canEdit
                onEdit={onEdit}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /Edit Record/i }));

        expect(onEdit).toHaveBeenCalledTimes(1);
    });
});
