import type { ArchiveDocument } from '../../documents/types/document.types';

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
        <div className="border-b border-border bg-surface-secondary/40 px-4 py-4">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">BL Number</p>
                    <h3 className="mt-1 text-lg font-black text-text-primary">{firstDocument.bl_no}</h3>
                </div>
                {canEdit && onEdit && (
                    <button
                        type="button"
                        onClick={() => onEdit(firstDocument)}
                        className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-bold text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Archive
                    </button>
                )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {metadata.map((item) => (
                    <div key={item.label} className="rounded-xl border border-border bg-surface px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">{item.label}</p>
                        <p className="mt-1 text-sm font-semibold text-text-primary">{item.value || '—'}</p>
                    </div>
                ))}
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
