import { getStatusStyle } from '../lib/statusStyles';

interface StatusBadgeProps {
    status: string;
}

/**
 * iOS-style capsule pill badge used in all transaction list and dashboard views.
 * Renders a tinted background, a glowing dot, and the status label.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
    const s = getStatusStyle(status);
    return (
        <span
            className="inline-flex items-center justify-start gap-1.5 w-[100px] px-3 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap"
            style={{
                color: s.color,
                backgroundColor: s.bg,
                border: `1px solid ${s.color}30`,
            }}
        >
            <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: s.color, boxShadow: `0 0 4px ${s.color}` }}
            />
            {status}
        </span>
    );
}
