export const ColHeader = ({ cols, template, alignRight, alignCenter }: {
    cols: string[]; template: string; alignRight?: Set<number>; alignCenter?: Set<number>;
}) => (
    <div className="grid items-center gap-4 px-4 py-2.5 border-b border-border bg-surface sticky top-0 z-10"
        style={{ gridTemplateColumns: template }}>
        {cols.map((h, i) => (
            <span key={i} className={`text-[10px] font-bold text-text-muted uppercase tracking-widest truncate ${alignRight?.has(i) ? 'text-right' : alignCenter?.has(i) ? 'text-center' : ''}`}>{h}</span>
        ))}
    </div>
);
