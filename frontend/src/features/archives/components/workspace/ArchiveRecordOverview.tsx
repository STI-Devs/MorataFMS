import { Pencil } from 'lucide-react';
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
        <div className="border-b border-border/80 bg-muted/20 px-5 py-3.5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">BL Record</p>
                        <span className="rounded-full border border-border/80 bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            {docs.length.toLocaleString()} file{docs.length === 1 ? '' : 's'}
                        </span>
                    </div>
                    <h3 className="mt-1 truncate text-lg font-bold text-foreground font-mono">{firstDocument.bl_no}</h3>
                </div>

                <div className="flex min-w-0 flex-1 flex-wrap gap-2 xl:justify-end">
                    {metadata.map((item) => (
                        <div key={item.label} className="min-w-0 rounded-lg border border-border/80 bg-background px-3 py-1.5 shadow-2xs">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                            <p className="mt-0.5 max-w-[220px] truncate text-xs font-semibold text-foreground" title={item.value || '—'}>
                                {item.value || '—'}
                            </p>
                        </div>
                    ))}
                </div>

                {canEdit && onEdit && (
                    <button
                        type="button"
                        onClick={() => onEdit(firstDocument)}
                        className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-muted cursor-pointer"
                    >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
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
