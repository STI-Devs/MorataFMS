import { Icon } from '../../../../components/Icon';
import type { DocumentTransaction } from '../../types/document.types';

const STATUS_CONFIG = {
    pending:     { label: 'Pending',     color: '#ff9f0a', bg: 'rgba(255,159,10,0.13)' },
    in_progress: { label: 'In Progress', color: '#64d2ff', bg: 'rgba(100,210,255,0.13)' },
    completed:   { label: 'Completed',   color: '#30d158', bg: 'rgba(48,209,88,0.13)' },
    cancelled:   { label: 'Cancelled',   color: '#ff453a', bg: 'rgba(255,69,58,0.13)' },
};

interface Props {
    tx: DocumentTransaction;
    onClick: () => void;
}

export const TransactionCard = ({ tx, onClick }: Props) => {
    const s = STATUS_CONFIG[tx.status];
    const isImport = tx.type === 'import';

    return (
        <div
            onClick={onClick}
            className="group bg-surface border border-border rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:border-blue-500/40 hover:shadow-sm transition-all duration-200"
        >
            {/* Type icon */}
            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: isImport ? 'rgba(48,209,88,0.1)' : 'rgba(10,132,255,0.1)' }}
            >
                <Icon
                    name={isImport ? 'download' : 'truck'}
                    className="w-5 h-5"
                    stroke={isImport ? '#30d158' : '#0a84ff'}
                />
            </div>

            {/* Ref + client */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-bold text-text-primary">{tx.ref}</p>
                    <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ color: s.color, backgroundColor: s.bg }}
                    >
                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.label}
                    </span>
                </div>
                <p className="text-xs text-text-muted truncate">{tx.client}</p>
            </div>

            {/* Document count */}
            <div className="text-center shrink-0">
                <p className="text-lg font-bold tabular-nums text-text-primary">{tx.documents.length}</p>
                <p className="text-[10px] text-text-muted font-medium">
                    {tx.documents.length === 1 ? 'document' : 'documents'}
                </p>
            </div>

            {/* Date */}
            <p className="text-xs text-text-muted font-medium shrink-0 hidden sm:block">{tx.date}</p>

            {/* Arrow */}
            <Icon name="chevron-right" className="w-4 h-4 text-text-muted group-hover:text-blue-500 transition-colors shrink-0" />
        </div>
    );
};
