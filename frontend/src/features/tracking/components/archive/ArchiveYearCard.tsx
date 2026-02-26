import type { ArchiveYear, TransactionType } from '../../types/document.types';

interface Props {
    archive: ArchiveYear;
    onClick: () => void;
}

export const ArchiveYearCard = ({ archive, onClick }: Props) => {
    const typeSummary: { type: TransactionType; count: number; color: string; label: string }[] = [
        { type: 'import' as TransactionType, count: archive.imports, color: '#30d158', label: 'Import' },
        { type: 'export' as TransactionType, count: archive.exports, color: '#0a84ff', label: 'Export' },
    ].filter(t => t.count > 0);

    return (
        <div
            onClick={onClick}
            className="group flex items-center gap-0 cursor-pointer transition-all duration-200 hover:bg-surface-subtler"
            style={{ minHeight: '64px' }}
        >
            {/* Drawer pull tab — left amber strip */}
            <div
                className="self-stretch w-1 shrink-0 transition-all duration-200"
                style={{ backgroundColor: 'rgba(255,159,10,0.18)' }}
            />

            {/* Folder icon block */}
            <div className="flex items-center justify-center w-12 shrink-0 self-stretch"
                style={{ backgroundColor: 'rgba(255,159,10,0.05)' }}>
                <svg className="w-5 h-5 transition-colors duration-200 group-hover:stroke-amber-400"
                    fill="none" stroke="rgba(255,159,10,0.55)" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                        d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                </svg>
            </div>

            {/* Year label + breakdown */}
            <div className="flex-1 min-w-0 px-4 py-3">
                {/* Record ref line */}
                <p className="text-[9px] font-black tracking-[0.18em] uppercase mb-1"
                    style={{ color: 'rgba(255,159,10,0.5)' }}>
                    Record Group · FY {archive.year}
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-base font-black text-text-primary tabular-nums">
                        {archive.year}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                        {typeSummary.map(t => (
                            <span
                                key={t.type}
                                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ color: t.color, backgroundColor: `${t.color}18` }}
                            >
                                <span className="w-1 h-1 rounded-full" style={{ backgroundColor: t.color }} />
                                {t.count} {t.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Document count — right side */}
            <div className="text-right shrink-0 px-4">
                <p className="text-xl font-black tabular-nums text-text-primary">{archive.documents.length}</p>
                <p className="text-[10px] text-text-muted font-medium">
                    {archive.documents.length === 1 ? 'record' : 'records'}
                </p>
            </div>

            {/* Chevron */}
            <div className="pr-4 shrink-0">
                <svg className="w-4 h-4 text-text-muted group-hover:translate-x-0.5 transition-all duration-200"
                    style={{ color: 'rgba(255,159,10,0.4)' }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </div>
    );
};
