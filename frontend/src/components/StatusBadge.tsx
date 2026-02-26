import { getStatusStyle } from '../lib/statusStyles';

interface StatusBadgeProps {
    status: string;
}

/**
 * Coloured dot + label badge used in all transaction list and dashboard views.
 * Colour is resolved automatically from the shared `statusStyles` lookup.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
    const s = getStatusStyle(status);
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold w-fit"
            style={{ color: s.color, backgroundColor: s.bg }}
        >
            <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ backgroundColor: s.color, boxShadow: `0 0 4px ${s.color}` }}
            />
            {status}
        </span>
    );
}
