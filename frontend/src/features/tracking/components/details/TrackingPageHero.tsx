import { CurrentDateTime } from '../../../../components/CurrentDateTime';

interface TrackingPageHeroProps {
    eyebrow?: string;
    title: string;
    description: string;
    chips?: string[];
}

export function TrackingPageHero({
    eyebrow,
    title,
    description,
    chips,
}: TrackingPageHeroProps) {
    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
                {eyebrow && (
                    <span className="inline-flex items-center rounded-full border border-border bg-surface-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                        {eyebrow}
                    </span>
                )}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-text-primary">{title}</h1>
                    <p className="mt-1 max-w-2xl text-sm text-text-secondary">
                        {description}
                    </p>
                </div>
                {chips && chips.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-muted">
                        {chips.map((chip) => (
                            <span
                                key={chip}
                                className="rounded-full border border-border bg-surface px-3 py-1"
                            >
                                {chip}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <CurrentDateTime
                className="hidden shrink-0 text-right sm:block"
                timeClassName="text-2xl font-bold tabular-nums text-text-primary leading-none"
                dateClassName="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted"
            />
        </div>
    );
}
