import type {
    ApiExportTransaction,
    ApiImportTransaction,
    ExportTransaction,
    ImportTransaction,
} from '../types';

function toDisplayStatus(status?: string): string {
    if (!status) {
        return 'Delayed';
    }

    const trimmedStatus = status.trim();

    if (!trimmedStatus) {
        return 'Delayed';
    }

    const needsNormalization =
        trimmedStatus === trimmedStatus.toLowerCase()
        || trimmedStatus.includes('_')
        || trimmedStatus.includes('-');

    if (!needsNormalization) {
        return trimmedStatus;
    }

    return trimmedStatus
        .split(/[_\-\s]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Maps a raw API import transaction into the UI view-model shape.
 * Centralises backend status-label normalization and selective-colour mapping.
 */
export function mapImportTransaction(t: ApiImportTransaction): ImportTransaction {
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
        status: toDisplayStatus(t.status),
        color: colorMap[t.selective_color] ?? '#ef4444',
        colorLabel: t.selective_color ? (t.selective_color.charAt(0).toUpperCase() + t.selective_color.slice(1)) : 'None',
        importer: t.importer?.name ?? 'Unknown',
        date: t.arrival_date ?? '',
        originCountry: t.origin_country?.name ?? '—',
        vesselName: t.vessel_name ?? '—',
        locationOfGoods: t.location_of_goods?.name ?? '—',
        open_remarks_count: t.open_remarks_count ?? 0,
    };
}

/**
 * Maps a raw API export transaction into the UI view-model shape.
 * Centralises backend status-label normalization and date formatting.
 */
export function mapExportTransaction(t: ApiExportTransaction): ExportTransaction {
    return {
        id: t.id,
        ref: t.bl_no || `EXP-${String(t.id).padStart(4, '0')}`,
        bl: t.bl_no,
        status: toDisplayStatus(t.status),
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
