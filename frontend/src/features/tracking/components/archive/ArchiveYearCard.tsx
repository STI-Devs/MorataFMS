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
            className="group grid items-center gap-4 px-4 cursor-pointer border-b border-border/50 hover:bg-hover transition-all duration-150"
            style={{ gridTemplateColumns: '24px 1fr 80px 100px 24px', minHeight: '64px' }}
        >
            {/* Folder icon — same 24px cell as ColHeader's empty first column */}
            <svg className="w-4 h-4 shrink-0 transition-all duration-200 group-hover:scale-110"
                fill="none" stroke="rgba(255,159,10,0.65)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>

            {/* Year + type badges — same 1fr cell as ColHeader "Name" */}
            <div className="min-w-0 py-3 flex flex-col justify-center gap-1">
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

            {/* Files — 80px cell matching ColHeader "Files" */}
            <span className="text-xs text-text-muted tabular-nums text-right">
                {archive.documents.length} {archive.documents.length === 1 ? 'file' : 'files'}
            </span>

            {/* BL Records — 100px cell matching ColHeader "BL Records" */}
            <span className="text-xs text-text-muted tabular-nums text-right">
                {blCount} {blCount === 1 ? 'BL' : 'BLs'}
            </span>

            {/* Chevron — 24px cell */}
            <svg className="w-3.5 h-3.5 text-text-muted shrink-0 group-hover:translate-x-0.5 transition-transform duration-150"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </div>
    );
};
