import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../../../../components/ui/alert-dialog';
import type { OversightTransaction } from '../../types/transaction.types';

interface Props {
    transaction: OversightTransaction;
    open?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export const DeleteCancelledTransactionModal = ({ transaction, open = true, onCancel, onConfirm }: Props) => {
    const label = transaction.reference_no || transaction.bl_no || `#${transaction.id}`;

    return (
        <AlertDialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Cancelled Transaction</AlertDialogTitle>
                    <AlertDialogDescription>
                        You are about to permanently delete the cancelled{' '}
                        <span className="font-semibold capitalize">{transaction.type}</span>{' '}transaction{' '}
                        <span className="font-semibold text-text-primary">{label}</span>.
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-white hover:bg-destructive/90"
                        onClick={onConfirm}
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
