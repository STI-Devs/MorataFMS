import { Icon } from '../../../../components/Icon';
import type { ExportTransaction, ImportTransaction, LayoutContext } from '../../types';
import { useOutletContext } from 'react-router-dom';

interface TrackingHeaderProps {
    transaction:       ImportTransaction | ExportTransaction;
    onRemarksClick:    () => void;
    onEditClick:       () => void;
    onBack:            () => void;
    statusColor:       string;
    statusBg:          string;
}

function getVesselName(transaction: ImportTransaction | ExportTransaction): string {
    if ('vesselName' in transaction) return transaction.vesselName ?? '—';
    if ('vessel' in transaction) return (transaction as ExportTransaction).vessel ?? '—';
    return '—';
}

function getEntryRef(transaction: ImportTransaction | ExportTransaction): string {
    return transaction.ref ?? '—';
}

function getBl(transaction: ImportTransaction | ExportTransaction): string {
    return transaction.bl ?? '—';
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
    const vesselName = getVesselName(transaction);
    const entryRef = getEntryRef(transaction);
    const bl = getBl(transaction);
    const openRemarksCount = transaction.open_remarks_count ?? 0;
    const hasOpenRemarks = openRemarksCount > 0;

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
                    {/* Vessel-first breadcrumb */}
                    <p className="text-xs text-text-muted flex items-center gap-1 flex-wrap">
                        <span className="font-semibold text-text-secondary">{vesselName}</span>
                        {entryRef !== '—' && bl !== entryRef && (
                            <>
                                <span className="opacity-40">›</span>
                                <span>{entryRef}</span>
                            </>
                        )}
                        {bl !== '—' && bl !== entryRef && (
                            <>
                                <span className="opacity-40">›</span>
                                <span className="font-mono">{bl}</span>
                            </>
                        )}
                        {user && <span className="ml-2 opacity-50">· {user.name}</span>}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={onRemarksClick}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            hasOpenRemarks
                                ? 'border-red-500/35 bg-red-50 text-red-700 shadow-sm shadow-red-500/10 hover:bg-red-100 dark:bg-red-950/25 dark:text-red-200 dark:hover:bg-red-950/40'
                                : 'border-border-strong text-text-secondary hover:bg-hover hover:text-text-primary'
                        }`}
                    >
                        <Icon name="flag" className="w-3.5 h-3.5" />
                        Remarks
                        {hasOpenRemarks && (
                            <span
                                aria-label={`${openRemarksCount} open remarks`}
                                data-testid="tracking-header-remark-dot"
                                className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-black leading-none text-white shadow-[0_0_0_3px_rgba(239,68,68,0.16)]"
                            >
                                {openRemarksCount}
                            </span>
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
