import type { ArchiveDocument } from '../../../documents/types/document.types';

interface ArchiveRecordOverviewProps {
    docs: ArchiveDocument[];
    canEdit?: boolean;
    onEdit?: (record: ArchiveDocument) => void;
}

export const ArchiveRecordOverview = ({ docs, canEdit = false, onEdit }: ArchiveRecordOverviewProps) => {
    const firstDocument = docs[0];

    if (!firstDocument) {
        return null;
    }

    const metadata = firstDocument.type === 'import'
        ? [
            { label: 'Importer', value: firstDocument.client },
            { label: 'BLSC', value: firstDocument.selective_color ? titleCase(firstDocument.selective_color) : '—' },
            { label: 'Vessel Name', value: firstDocument.vessel_name ?? '—' },
            { label: 'Location of Goods', value: firstDocument.location_of_goods ?? '—' },
            { label: 'Arrival Date', value: formatArchiveDate(firstDocument.transaction_date) },
        ]
        : [
            { label: 'Shipper', value: firstDocument.client },
            { label: 'Destination', value: firstDocument.destination_country ?? '—' },
            { label: 'Vessel', value: firstDocument.vessel_name ?? '—' },
            { label: 'Export Date', value: formatArchiveDate(firstDocument.transaction_date) },
        ];

    return (
        <div className="border-b border-border bg-surface-secondary/40 px-4 py-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">BL Record</p>
                        <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-bold text-text-muted">
                            {docs.length.toLocaleString()} file{docs.length === 1 ? '' : 's'}
                        </span>
                    </div>
                    <h3 className="mt-1 truncate text-lg font-black text-text-primary">{firstDocument.bl_no}</h3>
                </div>

                <div className="flex min-w-0 flex-1 flex-wrap gap-2 xl:justify-end">
                    {metadata.map((item) => (
                        <div key={item.label} className="min-w-0 rounded-lg border border-border bg-surface px-3 py-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-text-muted">{item.label}</p>
                            <p className="mt-0.5 max-w-[220px] truncate text-xs font-bold text-text-primary" title={item.value || '—'}>
                                {item.value || '—'}
                            </p>
                        </div>
                    ))}
                </div>

                {canEdit && onEdit && (
                    <button
                        type="button"
                        onClick={() => onEdit(firstDocument)}
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-bold text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Record
                    </button>
                )}
            </div>
        </div>
    );
};

function formatArchiveDate(value: string): string {
    const parsed = new Date(`${value}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function titleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
