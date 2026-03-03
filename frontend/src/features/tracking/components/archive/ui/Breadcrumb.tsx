export const Breadcrumb = ({ parts }: { parts: { label: string; onClick?: () => void }[] }) => (
    <nav className="flex items-center gap-1 flex-wrap min-w-0">
        {parts.map((p, i) => (
            <span key={i} className="flex items-center gap-1 min-w-0">
                {i > 0 && <span className="text-gray-300 text-xs select-none">/</span>}
                {p.onClick ? (
                    <button onClick={p.onClick}
                        className="text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-2 py-0.5 rounded-md transition-all">
                        {p.label}
                    </button>
                ) : (
                    <span className="text-xs font-semibold text-gray-800 px-2 py-0.5 bg-gray-100 rounded-md">
                        {p.label}
                    </span>
                )}
            </span>
        ))}
    </nav>
);
