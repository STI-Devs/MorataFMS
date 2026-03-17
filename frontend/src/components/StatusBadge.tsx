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
            className="inline-flex items-center text-xs font-bold w-fit whitespace-nowrap uppercase tracking-[0.05em]"
            style={{ color: s.color }}
        >
            {status}
        </span>
    );
}
