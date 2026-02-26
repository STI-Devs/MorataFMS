import { Icon } from './Icon';

interface EmptyStateProps {
    label: string;
    message?: string;
}

/**
 * Centered empty-state placeholder with icon, used when a list has no items.
 */
export function EmptyState({ label, message }: EmptyStateProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-muted p-12">
            <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center">
                <Icon name="search" className="w-5 h-5 opacity-40" />
            </div>
            <p className="text-xs font-medium tracking-wide">
                {message ?? `No active ${label}.`}
            </p>
        </div>
    );
}
