import type { ArchiveYear, TransactionType } from '../../types/document.types';

interface Props {
    archive: ArchiveYear;
    onClick: () => void;
}

export const ArchiveYearCard = ({ archive, onClick }: Props) => {
    const typeSummary: { type: TransactionType; count: number; color: string; bg: string; label: string }[] = [
        { type: 'import' as TransactionType, count: archive.imports, color: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: 'Import' },
        { type: 'export' as TransactionType, count: archive.exports, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'Export' },
    ].filter(t => t.count > 0);

    const blCount = archive.imports + archive.exports;

    return (
        <div
            onClick={onClick}
            role="button"
            className="group grid items-center gap-4 cursor-pointer border-b border-border/50 hover:bg-hover transition-all duration-150 px-4"
            style={{ gridTemplateColumns: '24px 1fr 80px 100px 24px', minHeight: '64px' }}
        >
            {/* Folder icon */}
            <div className="flex items-center justify-center"
                style={{ borderLeft: '2px solid rgba(255,159,10,0.35)' }}>
                <svg className="w-4 h-4 ml-2 transition-all duration-200 group-hover:scale-110"
                    fill="none" stroke="rgba(255,159,10,0.65)" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                        d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                </svg>
            </div>

            {/* Year + type badges */}
            <div className="min-w-0 py-3.5 flex flex-col justify-center gap-1.5">
                <p className="text-[9px] font-bold tracking-[0.2em] uppercase"
                    style={{ color: 'rgba(255,159,10,0.55)' }}>
                    FY {archive.year}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-black text-text-primary tabular-nums">
                        {archive.year}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {typeSummary.map(t => (
                            <span
                                key={t.type}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                style={{ color: t.color, backgroundColor: t.bg }}
                            >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                                {t.count} {t.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* FILES column — total document files */}
            <div className="text-right">
                <p className="text-sm font-semibold tabular-nums text-text-secondary">
                    {archive.documents.length}
                </p>
                <p className="text-[10px] text-text-muted">files</p>
            </div>

            {/* BL RECORDS column — number of BL transactions */}
            <div className="text-right">
                <p className="text-sm font-semibold tabular-nums text-text-primary">
                    {blCount}
                </p>
                <p className="text-[10px] text-text-muted">
                    {blCount === 1 ? 'BL' : 'BLs'}
                </p>
            </div>

            {/* Chevron */}
            <div className="flex items-center justify-center">
                <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150"
                    style={{ color: 'rgba(255,159,10,0.5)' }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </div>
    );
};
