import {
    AlertCircle,
    CheckCircle2,
    CircleDashed,
    CircleDot,
    CircleOff,
    Flag,
    Timer,
} from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import { TableCell, TableRow } from '../../../../components/ui/table';
import type { OversightTransaction } from '../../types/transaction.types';
import {
    formatCompactDate,
    normalizeStatus,
} from '../../utils/oversightTransaction.utils';
import { OversightRowActions } from './OversightRowActions';

interface OversightTableRowProps {
    transaction: OversightTransaction;
    isDeleting: boolean;
    onOpen: () => void;
    onStatus: () => void;
    onRemarks: () => void;
    onDelete: () => void;
    onVesselFilter?: (vesselName: string) => void;
}

function toTitleCase(str: string | null | undefined): string {
    if (!str) return '—';
    return str
        .toLowerCase()
        .replace(/\b([a-z])/g, (match) => match.toUpperCase())
        .replace(/\bInc\b\.?/gi, 'Inc.')
        .replace(/\bCo\b\.?/gi, 'Co.')
        .replace(/\bCorp\b\.?/gi, 'Corp.')
        .replace(/\bLlc\b/gi, 'LLC')
        .replace(/\bLtd\b\.?/gi, 'Ltd.')
        .replace(/\.{2,}/g, '.');
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
    completed: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300',
    cleared: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300',
    shipped: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300',
    in_progress: 'border-transparent bg-sky-500/15 text-sky-700 dark:bg-sky-500/25 dark:text-sky-300',
    vessel_arrived: 'border-transparent bg-sky-500/15 text-sky-700 dark:bg-sky-500/25 dark:text-sky-300',
    in_transit: 'border-transparent bg-sky-500/15 text-sky-700 dark:bg-sky-500/25 dark:text-sky-300',
    processing: 'border-transparent bg-amber-500/15 text-amber-700 dark:bg-amber-500/25 dark:text-amber-300',
    pending: 'border-transparent bg-amber-500/15 text-amber-700 dark:bg-amber-500/25 dark:text-amber-300',
    cancelled: 'border-transparent bg-rose-500/15 text-rose-700 dark:bg-rose-500/25 dark:text-rose-300',
    delayed: 'border-transparent bg-rose-500/15 text-rose-700 dark:bg-rose-500/25 dark:text-rose-300',
};

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    completed: CheckCircle2,
    cleared: CheckCircle2,
    shipped: CheckCircle2,
    in_progress: Timer,
    vessel_arrived: Timer,
    in_transit: Timer,
    processing: CircleDashed,
    pending: CircleDashed,
    cancelled: CircleOff,
    delayed: AlertCircle,
};

export const OversightTableRow = ({
    transaction,
    isDeleting,
    onOpen,
    onStatus,
    onRemarks,
    onDelete,
    onVesselFilter,
}: OversightTableRowProps) => {
    const isExport = transaction.type === 'export';
    const primaryRef = isExport
        ? transaction.bl_no || transaction.reference_no || `ID #${transaction.id}`
        : transaction.reference_no || transaction.bl_no || `ID #${transaction.id}`;
    const secondaryRef = isExport ? transaction.reference_no : transaction.bl_no;

    const normalizedStatus = normalizeStatus(transaction.status);
    const badgeClass = STATUS_BADGE_CLASSES[normalizedStatus] ?? STATUS_BADGE_CLASSES.pending;
    const StatusIcon = STATUS_ICONS[normalizedStatus] ?? CircleDot;

    const fullVessel = toTitleCase(transaction.vessel);
    const fullClient = toTitleCase(transaction.client);
    const fullEncoder = toTitleCase(transaction.assigned_to);

    return (
        <TableRow
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpen();
                }
            }}
            className="group cursor-pointer hover:bg-muted/50 transition-colors"
        >
            {/* 1. Type */}
            <TableCell className="py-3 w-[75px]">
                <Badge
                    variant="outline"
                    className={`font-mono text-[10px] font-semibold capitalize px-2 py-0.5 ${
                        transaction.type === 'import'
                            ? 'border-transparent bg-blue-500/15 text-blue-700 dark:bg-blue-500/25 dark:text-blue-300'
                            : 'border-transparent bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300'
                    }`}
                >
                    {transaction.type}
                </Badge>
            </TableCell>

            {/* 2. Vessel */}
            <TableCell className="py-3 w-[20%] min-w-[160px]" onClick={(e) => e.stopPropagation()}>
                {transaction.vessel ? (
                    <button
                        type="button"
                        onClick={() => onVesselFilter?.(transaction.vessel ?? '')}
                        aria-label={`Shared Vessel ${transaction.vessel} ${transaction.type}`}
                        title={`Filter by vessel: ${fullVessel}`}
                        className="text-left group/vessel cursor-pointer focus:outline-none block w-full truncate"
                    >
                        <span className="text-xs font-semibold text-foreground group-hover/vessel:text-primary group-hover/vessel:underline transition-colors truncate block">
                            {fullVessel}
                        </span>
                        <span className="sr-only">{transaction.type}</span>
                    </button>
                ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                )}
            </TableCell>

            {/* 3. Reference */}
            <TableCell className="py-3 w-[15%] min-w-[130px] font-mono">
                <div
                    className="flex flex-col truncate"
                    title={secondaryRef && secondaryRef !== primaryRef ? `${primaryRef} / ${secondaryRef}` : primaryRef}
                >
                    <span className="font-medium text-xs text-foreground group-hover:text-primary transition-colors truncate block">
                        {primaryRef}
                    </span>
                    {secondaryRef && secondaryRef !== primaryRef && (
                        <span className="text-[11px] text-muted-foreground truncate block">
                            {secondaryRef}
                        </span>
                    )}
                </div>
            </TableCell>

            {/* 4. Client */}
            <TableCell className="py-3 w-[25%] min-w-[200px]">
                <span
                    className="text-xs font-medium text-foreground truncate block cursor-default"
                    title={fullClient}
                >
                    {fullClient}
                </span>
            </TableCell>

            {/* 5. Status */}
            <TableCell className="py-3 w-[12%] min-w-[110px]">
                <Badge
                    variant="outline"
                    className={`capitalize text-xs font-medium rounded-md px-2 py-0.5 gap-1.5 inline-flex items-center ${badgeClass}`}
                >
                    <StatusIcon className="size-3 shrink-0" />
                    <span>{transaction.status.replace(/_/g, ' ')}</span>
                </Badge>
            </TableCell>

            {/* 6. Encoder */}
            <TableCell className="py-3 hidden md:table-cell w-[14%] min-w-[120px]">
                <span
                    className="text-xs text-muted-foreground truncate block"
                    title={fullEncoder !== '—' ? fullEncoder : undefined}
                >
                    {fullEncoder !== '—' ? fullEncoder : <span className="italic opacity-50">Unassigned</span>}
                </span>
            </TableCell>

            {/* 7. Remarks */}
            <TableCell className="py-3 text-center w-[60px]">
                {transaction.open_remarks_count > 0 ? (
                    <Badge
                        variant="outline"
                        className="border-transparent bg-rose-500/15 text-rose-700 dark:bg-rose-500/25 dark:text-rose-300 h-5 px-1.5 text-[10px] font-semibold gap-1 inline-flex items-center"
                        title={`${transaction.open_remarks_count} open remark(s)`}
                    >
                        <Flag className="size-3" />
                        {transaction.open_remarks_count}
                    </Badge>
                ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                )}
            </TableCell>

            {/* 8. Date */}
            <TableCell
                className="py-3 hidden md:table-cell text-right text-xs text-muted-foreground whitespace-nowrap w-[95px]"
                title={transaction.date ?? transaction.created_at ?? undefined}
            >
                {formatCompactDate(transaction.date ?? transaction.created_at)}
            </TableCell>

            {/* 9. Actions */}
            <TableCell
                className="py-3 text-right w-[50px]"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
            >
                <OversightRowActions
                    transaction={transaction}
                    onOverride={onStatus}
                    onRestore={onStatus}
                    onRemarks={onRemarks}
                    onDelete={onDelete}
                    deleting={isDeleting}
                />
            </TableCell>
        </TableRow>
    );
};
