import { cn } from '@/lib/utils';

/**
 * Renders a raw SVG path (`d`) string as an icon sized for the sidebar menu.
 * Nav data carries Heroicons-style path strings rather than lucide components,
 * so we wrap them in an svg here (mirrors the previous inline svg markup).
 */
export const SidebarIcon = ({ d, className }: { d: string; className?: string }) => (
    <svg
        className={cn('size-4 shrink-0', className)}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={d} />
    </svg>
);
