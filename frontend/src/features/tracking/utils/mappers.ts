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
        Pending: 'Pending',
        'Vessel Arrived': 'In Transit',
        Processing: 'In Transit',
        Completed: 'Cleared',
        Cancelled: 'Cancelled',
        pending: 'Pending',
        in_progress: 'In Transit',
        completed: 'Cleared',
        cancelled: 'Cancelled',
    };
    const colorMap: Record<string, string> = {
        green: '#22c55e',   // text-green-500
        yellow: '#eab308',  // text-yellow-500
        red: '#ef4444',     // text-red-500
        orange: '#f97316',  // text-orange-500
    };

    return {
        id: t.id,
        ref: t.customs_ref_no,
        bl: t.bl_no,
        status: statusMap[t.status] ?? 'Delayed',
        color: colorMap[t.selective_color] ?? '#ef4444',
        colorLabel: t.selective_color ? (t.selective_color.charAt(0).toUpperCase() + t.selective_color.slice(1)) : 'None',
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
        Pending: 'Processing',
        'In Transit': 'In Transit',
        Departure: 'In Transit',
        Processing: 'Processing',
        Completed: 'Shipped',
        Cancelled: 'Cancelled',
        pending: 'Processing',
        in_progress: 'In Transit',
        completed: 'Shipped',
        cancelled: 'Cancelled',
    };

    return {
        id: t.id,
        ref: t.bl_no || `EXP-${String(t.id).padStart(4, '0')}`,
        bl: t.bl_no,
        status: statusMap[t.status] ?? 'Delayed',
        color: '',
        colorLabel: '',
        shipper: t.shipper?.name ?? 'Unknown',

        vessel: t.vessel ?? '—',
        departureDate: t.export_date
            ? new Date(`${t.export_date}T00:00:00`).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            })
            : '',
        portOfDestination: t.destination_country?.name ?? '—',
        open_remarks_count: t.open_remarks_count ?? 0,
    };
}
