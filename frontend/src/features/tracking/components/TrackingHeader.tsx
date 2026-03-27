import { Icon } from '../../../components/Icon';
import type { ExportTransaction, ImportTransaction, LayoutContext } from '../types';
import { useOutletContext } from 'react-router-dom';


interface TrackingHeaderProps {
    transaction:       ImportTransaction | ExportTransaction;
    onRemarksClick:    () => void;
    onEditClick:       () => void;
    onBack:            () => void;
    statusColor:       string;
    statusBg:          string;
}

export const TrackingHeader = ({
    transaction,
    onRemarksClick,
    onEditClick,
    onBack,
    statusColor,
    statusBg,
}: TrackingHeaderProps) => {
    const { user } = useOutletContext<LayoutContext>();

    return (
        <div>
            <button
                onClick={onBack}
                className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 mb-3 transition-colors"
            >
                <Icon name="chevron-left" className="w-3.5 h-3.5" />
                Back
            </button>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary mb-0.5">{transaction.ref}</h1>
                    <p className="text-xs text-text-muted">
                        Dashboard / Tracking / {transaction.ref}
                        {user && <span className="ml-2 opacity-50">· {user.name}</span>}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={onRemarksClick}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-text-secondary border border-border-strong rounded-lg hover:bg-hover hover:text-text-primary transition-colors"
                    >
                        <Icon name="flag" className="w-3.5 h-3.5" />
                        Remarks
                        {transaction.open_remarks_count > 0 && (
                            <span
                                aria-hidden="true"
                                data-testid="tracking-header-remark-dot"
                                className="ml-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.12)]"
                            />
                        )}
                    </button>
                    <button
                        onClick={onEditClick}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-text-secondary border border-border-strong rounded-lg hover:bg-hover hover:text-text-primary transition-colors"
                    >
                        <Icon name="edit" className="w-3.5 h-3.5" />
                        Edit
                    </button>
                    <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold"
                        style={{ color: statusColor, backgroundColor: statusBg }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: statusColor, boxShadow: `0 0 4px ${statusColor}` }} />
                        {transaction.status}
                    </span>
                </div>
            </div>
        </div>
    );
};
