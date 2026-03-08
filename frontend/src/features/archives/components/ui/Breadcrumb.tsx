export const Breadcrumb = ({ parts }: { parts: { label: string; onClick?: () => void }[] }) => (
    <nav className="flex items-center gap-1 flex-wrap min-w-0">
        {parts.map((p, i) => (
            <span key={i} className="flex items-center gap-1 min-w-0">
                {i > 0 && <span className="text-text-muted text-xs select-none">/</span>}
                {p.onClick ? (
                    <button onClick={p.onClick}
                        className="text-xs font-medium text-text-muted hover:text-text-primary hover:bg-hover px-2 py-0.5 rounded-md transition-all">
                        {p.label}
                    </button>
                ) : (
                    <span className="text-xs font-semibold text-text-primary px-2 py-0.5 bg-surface-secondary border border-border rounded-md">
                        {p.label}
                    </span>
                )}
            </span>
        ))}
    </nav>
);
