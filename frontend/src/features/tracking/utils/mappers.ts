import type {
    ApiExportTransaction,
    ApiImportTransaction,
    ExportTransaction,
    ImportTransaction,
} from '../types';

/**
 * Maps a raw API import transaction into the UI view-model shape.
 * Centralises status-label and selective-colour → CSS-class conversions
 * that were previously duplicated across ImportList and TrackingDashboard.
 */
export function mapImportTransaction(t: ApiImportTransaction): ImportTransaction {
    const statusMap: Record<string, string> = {
        pending: 'Pending',
        in_progress: 'In Transit',
        completed: 'Cleared',
        cancelled: 'Cancelled',
    };
    const colorMap: Record<string, string> = {
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        red: 'bg-red-500',
        orange: 'bg-orange-500',
    };

    return {
        id: t.id,
        ref: t.customs_ref_no,
        bl: t.bl_no,
        status: statusMap[t.status] ?? 'Delayed',
        color: colorMap[t.selective_color] ?? 'bg-red-500',
        importer: t.importer?.name ?? 'Unknown',
        date: t.arrival_date ?? '',
        open_remarks_count: t.open_remarks_count ?? 0,
    };
}

/**
 * Maps a raw API export transaction into the UI view-model shape.
 * Centralises status-label and date formatting that were previously
 * duplicated across ExportList and TrackingDashboard.
 */
export function mapExportTransaction(t: ApiExportTransaction): ExportTransaction {
    const statusMap: Record<string, string> = {
        pending: 'Processing',
        in_progress: 'In Transit',
        completed: 'Shipped',
        cancelled: 'Cancelled',
    };

    return {
        id: t.id,
        ref: `EXP-${String(t.id).padStart(4, '0')}`,
        bl: t.bl_no,
        status: statusMap[t.status] ?? 'Delayed',
        color: '',
        shipper: t.shipper?.name ?? 'Unknown',
        vessel: t.vessel ?? '—',
        departureDate: t.created_at
            ? new Date(t.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            })
            : '',
        portOfDestination: t.destination_country?.name ?? '—',
        open_remarks_count: t.open_remarks_count ?? 0,
    };
}
