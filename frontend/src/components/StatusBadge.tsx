import {
    AlertCircle,
    CheckCircle2,
    CircleDashed,
    CircleDot,
    CircleOff,
    Timer,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface StatusBadgeProps {
    status: string;
    className?: string;
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
    completed: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300',
    cleared: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300',
    shipped: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300',
    in_progress: 'border-transparent bg-sky-500/15 text-sky-700 dark:bg-sky-500/25 dark:text-sky-300',
    vessel_arrived: 'border-transparent bg-sky-500/15 text-sky-700 dark:bg-sky-500/25 dark:text-sky-300',
    in_transit: 'border-transparent bg-sky-500/15 text-sky-700 dark:bg-sky-500/25 dark:text-sky-300',
    processing: 'border-transparent bg-amber-500/15 text-amber-700 dark:bg-amber-500/25 dark:text-amber-300',
    pending: 'border-transparent bg-amber-500/15 text-amber-700 dark:bg-amber-500/25 dark:text-amber-300',
    cancelled: 'border-transparent bg-rose-500/15 text-rose-700 dark:bg-rose-500/25 dark:text-rose-300',
    delayed: 'border-transparent bg-rose-500/15 text-rose-700 dark:bg-rose-500/25 dark:text-rose-300',
};

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    completed: CheckCircle2,
    cleared: CheckCircle2,
    shipped: CheckCircle2,
    in_progress: Timer,
    vessel_arrived: Timer,
    in_transit: Timer,
    processing: CircleDashed,
    pending: CircleDashed,
    cancelled: CircleOff,
    delayed: AlertCircle,
};

function normalizeStatus(status: string): string {
    return status.trim().toLowerCase().replace(/\s+/g, '_');
}

/**
 * Modern Shadcn-styled status badge with icon and semantic tint.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
    const normalized = normalizeStatus(status);
    const badgeClass = STATUS_BADGE_CLASSES[normalized] ?? STATUS_BADGE_CLASSES.pending;
    const StatusIcon = STATUS_ICONS[normalized] ?? CircleDot;

    return (
        <Badge
            variant="outline"
            className={cn(
                'capitalize text-xs font-medium rounded-md px-2 py-0.5 gap-1.5 inline-flex items-center whitespace-nowrap shadow-none',
                badgeClass,
                className
            )}
        >
            <StatusIcon className="size-3 shrink-0" />
            <span>{status.replace(/_/g, ' ')}</span>
        </Badge>
    );
}
