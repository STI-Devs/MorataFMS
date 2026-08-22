import { Icon } from '../../../../components/Icon';
import type { DocumentTransaction } from '../../../documents/types/document.types';

const STATUS_CONFIG = {
    pending:     { label: 'Pending',     color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 13%, transparent)' },
    in_progress: { label: 'In Progress', color: 'var(--sky)', bg: 'color-mix(in srgb, var(--sky) 13%, transparent)' },
    completed:   { label: 'Completed',   color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 13%, transparent)' },
    cancelled:   { label: 'Cancelled',   color: 'var(--danger)', bg: 'color-mix(in srgb, var(--danger) 13%, transparent)' },
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
            className="group bg-surface border border-border rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all duration-200"
        >
            {/* Type icon */}
            <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isImport ? 'bg-success/10' : 'bg-primary/10'}`}
            >
                <Icon
                    name={isImport ? 'download' : 'truck'}
                    className="w-5 h-5"
                    stroke={isImport ? 'var(--success)' : 'var(--primary)'}
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
            <Icon name="chevron-right" className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors shrink-0" />
        </div>
    );
};
