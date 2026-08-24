import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, History, X } from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../../components/ui/table';
import type { ExportTransaction, ImportTransaction } from '../../../clients/types/client.types';

interface TransactionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientName: string;
    imports: ImportTransaction[];
    exports: ExportTransaction[];
}

function StatusBadge({ status }: { status: string }) {
    let className = 'border-border bg-muted/50 text-muted-foreground';
    let dotClass = 'bg-muted-foreground';

    if (status === 'completed') {
        className = 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
        dotClass = 'bg-emerald-500';
    } else if (status === 'in_progress') {
        className = 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400';
        dotClass = 'bg-blue-500';
    } else if (status === 'cancelled') {
        className = 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400';
        dotClass = 'bg-rose-500';
    }

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${className}`}>
            <span className={`size-1.5 rounded-full ${dotClass}`} />
            {status.replace(/_/g, ' ')}
        </span>
    );
}

export const TransactionHistoryModal = ({ isOpen, onClose, clientName, imports, exports }: TransactionHistoryModalProps) => {
    const [activeTab, setActiveTab] = useState<'imports' | 'exports'>('imports');

    if (!isOpen) return null;

    const totalTransactions = imports.length + exports.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-backdrop-in" onClick={onClose}>
            <div
                className="w-full max-w-4xl rounded-xl p-6 bg-card border border-border shadow-xl animate-modal-in max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border/80 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                            <History className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">
                                Transaction History
                            </h2>
                            <p className="text-[11px] text-muted-foreground">
                                <span className="font-medium text-foreground">{clientName}</span> · {totalTransactions} total transaction{totalTransactions !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Sub-Tabs Switcher */}
                <div className="flex items-center gap-1.5 pt-4 pb-3 shrink-0">
                    <Button
                        variant={activeTab === 'imports' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveTab('imports')}
                        className={`h-8 px-2.5 text-xs gap-1.5 font-medium shadow-2xs transition-all cursor-pointer ${
                            activeTab !== 'imports'
                                ? 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border-border/80'
                                : ''
                        }`}
                    >
                        <ArrowDownLeft className="size-3.5" />
                        Imports
                        <Badge
                            variant={activeTab === 'imports' ? 'secondary' : 'outline'}
                            className="text-[10px] px-1.5 py-0 font-semibold tabular-nums ml-0.5"
                        >
                            {imports.length}
                        </Badge>
                    </Button>
                    <Button
                        variant={activeTab === 'exports' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveTab('exports')}
                        className={`h-8 px-2.5 text-xs gap-1.5 font-medium shadow-2xs transition-all cursor-pointer ${
                            activeTab !== 'exports'
                                ? 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border-border/80'
                                : ''
                        }`}
                    >
                        <ArrowUpRight className="size-3.5" />
                        Exports
                        <Badge
                            variant={activeTab === 'exports' ? 'secondary' : 'outline'}
                            className="text-[10px] px-1.5 py-0 font-semibold tabular-nums ml-0.5"
                        >
                            {exports.length}
                        </Badge>
                    </Button>
                </div>

                {/* Table Container */}
                <div className="flex-1 overflow-y-auto min-h-[220px] rounded-lg border border-border/80 bg-card shadow-2xs">
                    {activeTab === 'imports' ? (
                        imports.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <p className="text-xs font-medium text-muted-foreground">No import transactions recorded for this client.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                    <TableRow className="hover:bg-transparent border-b border-border/80">
                                        <TableHead className="h-8 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Arrival Date
                                        </TableHead>
                                        <TableHead className="h-8 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Ref No
                                        </TableHead>
                                        <TableHead className="h-8 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            BL No
                                        </TableHead>
                                        <TableHead className="h-8 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Status
                                        </TableHead>
                                        <TableHead className="h-8 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">
                                            Assigned Encoder
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {imports.map((tx) => (
                                        <TableRow key={tx.id} className="hover:bg-muted/50 border-b border-border/60 transition-colors">
                                            <TableCell className="py-2.5 px-4 text-xs tabular-nums text-muted-foreground">
                                                {tx.arrival_date ? new Date(tx.arrival_date).toLocaleDateString() : '—'}
                                            </TableCell>
                                            <TableCell className="py-2.5 px-4 text-xs font-medium text-foreground">
                                                {tx.customs_ref_no || '—'}
                                            </TableCell>
                                            <TableCell className="py-2.5 px-4 text-xs font-mono font-medium text-foreground">
                                                {tx.bl_no || '—'}
                                            </TableCell>
                                            <TableCell className="py-2.5 px-4">
                                                <StatusBadge status={tx.status} />
                                            </TableCell>
                                            <TableCell className="py-2.5 px-4 text-xs text-muted-foreground text-right">
                                                {tx.assigned_user?.name ?? 'Unassigned'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )
                    ) : exports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <p className="text-xs font-medium text-muted-foreground">No export transactions recorded for this client.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent border-b border-border/80">
                                    <TableHead className="h-8 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        BL No
                                    </TableHead>
                                    <TableHead className="h-8 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Vessel
                                    </TableHead>
                                    <TableHead className="h-8 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Destination
                                    </TableHead>
                                    <TableHead className="h-8 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Status
                                    </TableHead>
                                    <TableHead className="h-8 px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">
                                        Assigned Encoder
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {exports.map((tx) => (
                                    <TableRow key={tx.id} className="hover:bg-muted/50 border-b border-border/60 transition-colors">
                                        <TableCell className="py-2.5 px-4 text-xs font-mono font-medium text-foreground">
                                            {tx.bl_no || '—'}
                                        </TableCell>
                                        <TableCell className="py-2.5 px-4 text-xs text-foreground font-medium">
                                            {tx.vessel || '—'}
                                        </TableCell>
                                        <TableCell className="py-2.5 px-4 text-xs text-muted-foreground">
                                            {tx.destination || '—'}
                                        </TableCell>
                                        <TableCell className="py-2.5 px-4">
                                            <StatusBadge status={tx.status} />
                                        </TableCell>
                                        <TableCell className="py-2.5 px-4 text-xs text-muted-foreground text-right">
                                            {tx.assigned_user?.name ?? 'Unassigned'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Footer */}
                <div className="pt-4 flex items-center justify-end shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        className="h-8 text-xs cursor-pointer"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};
