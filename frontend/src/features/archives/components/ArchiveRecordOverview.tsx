import type { ArchiveDocument } from '../../documents/types/document.types';

interface ArchiveRecordOverviewProps {
    docs: ArchiveDocument[];
}

export const ArchiveRecordOverview = ({ docs }: ArchiveRecordOverviewProps) => {
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
