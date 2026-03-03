export const ColHeader = ({ cols, template, alignRight }: {
    cols: string[]; template: string; alignRight?: Set<number>;
}) => (
    <div className="grid items-center gap-4 px-5 py-2.5 border-b border-gray-100 bg-gray-50 sticky top-0 z-10"
        style={{ gridTemplateColumns: template }}>
        {cols.map((h, i) => (
            <span key={i} className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate ${alignRight?.has(i) ? 'text-right' : ''}`}>{h}</span>
        ))}
    </div>
);
