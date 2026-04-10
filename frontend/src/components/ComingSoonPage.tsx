type ComingSoonPageProps = {
    title: string;
    subtitle: string;
    description: string;
    accent: string;
};

export const ComingSoonPage = ({ title, subtitle, description, accent }: ComingSoonPageProps) => (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div
            className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${accent}18` }}
        >
            <svg
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: accent }}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.75"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
            </svg>
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-text-muted">{subtitle}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-text-primary">{title}</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-text-secondary">{description}</p>
        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-xs font-semibold text-text-muted shadow-sm">
            <div
                className="h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ backgroundColor: accent }}
            />
            Coming Soon
        </div>
    </div>
);
