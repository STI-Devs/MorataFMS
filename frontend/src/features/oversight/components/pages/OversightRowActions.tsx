import { AlertCircle, CheckCircle, Flag, MoreHorizontal, Trash2 } from 'lucide-react';

import { Button } from '../../../../components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import type { OversightTransaction } from '../../types/transaction.types';
import { normalizeStatus } from '../../utils/oversightTransaction.utils';

interface OversightRowActionsProps {
    transaction: OversightTransaction;
    onOverride: () => void;
    onRestore: () => void;
    onRemarks: () => void;
    onDelete: () => void;
    deleting: boolean;
}

export const OversightRowActions = ({
    transaction,
    onOverride,
    onRestore,
    onRemarks,
    onDelete,
    deleting,
}: OversightRowActionsProps) => {
    const normalizedStatus = normalizeStatus(transaction.status);
    const isCancelled = normalizedStatus === 'cancelled';
    const isCompleted = normalizedStatus === 'completed';
    const isActive = !isCancelled && !isCompleted;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Row actions">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {isActive ? (
                    <>
                        <DropdownMenuItem onSelect={onOverride}>
                            <AlertCircle className="h-4 w-4" />
                            Override Status
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={onRemarks}>
                            <Flag className="h-4 w-4" />
                            View Remarks
                        </DropdownMenuItem>
                    </>
                ) : isCancelled ? (
                    <>
                        <DropdownMenuItem onSelect={onRestore}>
                            <CheckCircle className="h-4 w-4" />
                            Restore
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={onRemarks}>
                            <Flag className="h-4 w-4" />
                            View Remarks
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={onDelete} disabled={deleting}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </>
                ) : (
                    <DropdownMenuItem onSelect={onRemarks}>
                        <Flag className="h-4 w-4" />
                        View Remarks
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
