import { Icon } from '../../../../components/Icon';
import type { ArchiveYear, TransactionType } from '../../types/document.types';

interface Props {
    archive: ArchiveYear;
    onClick: () => void;
}

export const ArchiveYearCard = ({ archive, onClick }: Props) => {
    const importCount = archive.documents.filter(d => d.type === 'import').length;
    const exportCount = archive.documents.filter(d => d.type === 'export').length;

    const typeSummary: { type: TransactionType; count: number; color: string; label: string }[] = [
        { type: 'import' as TransactionType, count: importCount, color: '#30d158', label: 'Import' },
        { type: 'export' as TransactionType, count: exportCount, color: '#0a84ff', label: 'Export' },
    ].filter(t => t.count > 0);

    return (
        <div
            onClick={onClick}
            className="group bg-surface border border-border rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:border-amber-500/40 hover:shadow-sm transition-all duration-200"
        >
            {/* Year icon */}
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(255,159,10,0.1)' }}>
                <Icon name="clock" className="w-5 h-5" stroke="#ff9f0a" />
            </div>

            {/* Year + breakdown */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-primary mb-1">{archive.year}</p>
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

            {/* Total doc count */}
            <div className="text-center shrink-0">
                <p className="text-lg font-bold tabular-nums text-text-primary">{archive.documents.length}</p>
                <p className="text-[10px] text-text-muted font-medium">
                    {archive.documents.length === 1 ? 'document' : 'documents'}
                </p>
            </div>

            <Icon name="chevron-right" className="w-4 h-4 text-text-muted group-hover:text-amber-500 transition-colors shrink-0" />
        </div>
    );
};
