import { ChevronLeft, Flag, Pencil, User } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Separator } from '../../../../components/ui/separator';
import type { ExportTransaction, ImportTransaction, LayoutContext } from '../../types';

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
    const isImport = 'vesselName' in transaction || 'importer' in transaction;
    const openRemarksCount = transaction.open_remarks_count ?? 0;
    const hasOpenRemarks = openRemarksCount > 0;

    return (
        <div className="space-y-2.5">
            {/* Top Navigation Back Button */}
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="-ml-2 h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                    <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                    Back to {isImport ? 'Import Transactions' : 'Export Transactions'}
                </Button>
                <Separator orientation="vertical" className="h-3.5" />
                <span className="text-xs font-mono text-muted-foreground">{transaction.ref}</span>
            </div>

            {/* Header Main Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-mono text-foreground">
                            {transaction.ref}
                        </h1>

                        <Badge variant="secondary" className="font-semibold text-xs">
                            {isImport ? 'Import' : 'Export'}
                        </Badge>

                        <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs"
                            style={{
                                color: statusColor,
                                backgroundColor: statusBg,
                                borderColor: `${statusColor}33`,
                            }}
                        >
                            <span
                                className="size-1.5 rounded-full inline-block"
                                style={{ backgroundColor: statusColor }}
                            />
                            {transaction.status}
                        </span>
                    </div>

                    {user && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="size-3 text-muted-foreground" />
                            <span>Encoder: <strong className="font-medium text-foreground">{user.name}</strong></span>
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant={hasOpenRemarks ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={onRemarksClick}
                        className="cursor-pointer"
                    >
                        <Flag className="mr-1.5 h-3.5 w-3.5" />
                        Remarks
                        {hasOpenRemarks && (
                            <Badge
                                aria-label={`${openRemarksCount} open remarks`}
                                data-testid="tracking-header-remark-dot"
                                className="ml-1.5 size-4 rounded-full p-0 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground"
                            >
                                {openRemarksCount}
                            </Badge>
                        )}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onEditClick}
                        className="cursor-pointer"
                    >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                    </Button>
                </div>
            </div>
        </div>
    );
};
