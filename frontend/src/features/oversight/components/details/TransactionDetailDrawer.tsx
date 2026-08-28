import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ExternalLink, Eye, FileText, Flag, Loader2, Paperclip, User, Building2 } from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { appRoutes } from '../../../../lib/appRoutes';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../../components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../../../components/ui/sheet';
import { Skeleton } from '../../../../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Textarea } from '../../../../components/ui/textarea';
import { FilePreviewModal } from '../../../../components/modals/FilePreviewModal';
import { useTransactionSyncSubscription } from '../../../../hooks/useTransactionSyncSubscription';
import { trackingApi } from '../../../tracking/api/trackingApi';
import { useDocumentPreview } from '../../../tracking/hooks/useDocumentPreview';
import { useCreateRemark, useDocuments, useRemarks, useResolveRemark } from '../../hooks/useRemarks';
import type { CreateRemarkData, Remark, RemarkDocument } from '../../types/remark.types';
import type { OversightTransaction } from '../../types/transaction.types';
import { StagePipeline } from './StagePipeline';

// ─── Severity Config ────────────────────────────────────────────────────────

const SEVERITY_CFG = {
    info:     { label: 'Info',     variant: 'outline' as const, className: 'border-sky-500/30 text-sky-600 dark:text-sky-400 bg-sky-500/5' },
    warning:  { label: 'Warning',  variant: 'outline' as const, className: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5' },
    critical: { label: 'Critical', variant: 'destructive' as const, className: '' },
} as const;

type Tab = 'Documents' | 'Stages' | 'Remarks';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    transaction: OversightTransaction | null;
    onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const TransactionDetailDrawer = ({ transaction, onClose }: Props) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('Documents');
    const { previewFile, setPreviewFile, handlePreviewDoc } = useDocumentPreview();
    const [previewLoading, setPreviewLoading] = useState<number | null>(null);

    // Remark form state
    const [severity, setSeverity] = useState<CreateRemarkData['severity']>('warning');
    const [message, setMessage] = useState('');
    const [documentId, setDocumentId] = useState<number | null>(null);

    const isOpen = !!transaction;
    const type = transaction?.type ?? 'import';
    const id = transaction?.id ?? null;

    useTransactionSyncSubscription({
        type: transaction?.type ?? null,
        id,
        reference: transaction?.reference_no ?? null,
        enabled: isOpen && id !== null,
    });

    // Data
    const { data: docsResult, isLoading: docsLoading } = useDocuments(type, id, isOpen);
    const documents: RemarkDocument[] = docsResult?.data ?? [];
    const { data: remarksResult, isLoading: remarksLoading } = useRemarks(type, id, isOpen);
    const remarks: Remark[] = remarksResult?.data ?? [];
    const createRemark = useCreateRemark();
    const resolveRemark = useResolveRemark(type, id);

    // Reset tab & form when drawer opens with a new transaction
    useEffect(() => {
        if (isOpen) {
            setActiveTab('Documents');
            setSeverity('warning');
            setMessage('');
            setDocumentId(null);
        }
    }, [isOpen, transaction?.id]);

    if (!transaction) return null;

    const handlePreview = async (docId: number, filename: string) => {
        setPreviewLoading(docId);
        try {
            await handlePreviewDoc({ id: docId, filename } as import('../../../tracking/types').ApiDocument);
        } finally {
            setPreviewLoading(null);
        }
    };

    const handleDownload = (docId: number, filename: string) => {
        trackingApi.downloadDocument(docId, filename);
    };

    const handleCreateRemark = async () => {
        if (!id || !message.trim()) return;
        await createRemark.mutateAsync({
            type,
            id,
            data: { severity, message: message.trim(), document_id: documentId },
        });
        setMessage('');
        setDocumentId(null);
    };

    const transactionLabel = `${transaction.type === 'import' ? 'Import' : 'Export'} — ${transaction.reference_no || transaction.bl_no || `#${transaction.id}`}`;

    const targetRef = transaction.type === 'import'
        ? (transaction.reference_no || transaction.bl_no || String(transaction.id))
        : (transaction.bl_no || transaction.reference_no || `EXP-${String(transaction.id).padStart(4, '0')}` || String(transaction.id));

    const trackingPath = appRoutes.trackingDetail.replace(':referenceId', encodeURIComponent(targetRef));

    return (
        <>
            <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
                <SheetContent side="right" className="w-full sm:max-w-[540px] p-0 flex flex-col gap-0 border-l shadow-2xl bg-card">
                    {/* Header */}
                    <SheetHeader className="text-start px-6 pt-6 pb-4 border-b border-border space-y-2.5 bg-card">
                        <div className="flex items-center justify-between gap-2 pr-6">
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={transaction.type === 'import' ? 'secondary' : 'outline'}
                                    className="text-[10px] font-bold uppercase tracking-wider font-mono px-2 py-0.5"
                                >
                                    {transaction.type}
                                </Badge>
                                {transaction.open_remarks_count > 0 && (
                                    <Badge variant="destructive" className="text-[10px] font-bold px-2 py-0.5 gap-1">
                                        <Flag className="size-3" />
                                        {transaction.open_remarks_count} open
                                    </Badge>
                                )}
                                <Badge variant="outline" className="capitalize text-[10px] font-medium text-muted-foreground">
                                    {transaction.status?.replace(/_/g, ' ')}
                                </Badge>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                    navigate(trackingPath);
                                    onClose();
                                }}
                                className="h-7.5 px-3 text-xs font-medium gap-1.5 shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
                            >
                                <ExternalLink className="size-3.5" />
                                View in Tracking
                            </Button>
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-bold tracking-tight text-foreground">{transactionLabel}</SheetTitle>
                            <SheetDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                    <Building2 className="size-3.5 text-muted-foreground" />
                                    {transaction.client || 'No client'}
                                </span>
                                <span>&bull;</span>
                                <span className="inline-flex items-center gap-1">
                                    <User className="size-3.5 text-muted-foreground" />
                                    {transaction.assigned_to || 'Unassigned'}
                                </span>
                            </SheetDescription>
                        </div>
                    </SheetHeader>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Tab)} className="flex-1 flex flex-col overflow-hidden">
                        <div className="border-b border-border bg-muted/30 px-6 pt-2">
                            <TabsList className="grid w-full grid-cols-3 h-9 p-1">
                                <TabsTrigger value="Documents" className="text-xs font-semibold">
                                    Documents
                                </TabsTrigger>
                                <TabsTrigger value="Stages" className="text-xs font-semibold">
                                    Stages
                                </TabsTrigger>
                                <TabsTrigger value="Remarks" className="text-xs font-semibold">
                                    Remarks {transaction.open_remarks_count > 0 ? `(${transaction.open_remarks_count})` : ''}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Tab Contents */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Documents Tab */}
                            <TabsContent value="Documents" className="mt-0 space-y-4">
                                {docsLoading ? (
                                    <div className="space-y-3">
                                        <Skeleton className="h-14 w-full rounded-lg" />
                                        <Skeleton className="h-14 w-full rounded-lg" />
                                    </div>
                                ) : documents.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="mb-3 flex size-10 items-center justify-center rounded-lg border bg-muted">
                                            <FileText className="size-5 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-semibold text-foreground">No documents uploaded yet</p>
                                        <p className="mt-1 text-xs text-muted-foreground">The encoder has not uploaded any documents for this transaction.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-muted-foreground">
                                            {documents.length} Document{documents.length !== 1 ? 's' : ''}
                                        </p>
                                        {documents.map(doc => (
                                            <div
                                                key={doc.id}
                                                className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/40"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted text-foreground">
                                                        <FileText className="size-4 text-muted-foreground" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-semibold text-foreground font-mono">{doc.filename}</p>
                                                        <p className="text-[11px] capitalize text-muted-foreground">{doc.type?.replace(/_/g, ' ')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handlePreview(doc.id, doc.filename)}
                                                        disabled={previewLoading === doc.id}
                                                        className="h-7 px-2 text-xs gap-1"
                                                        title="Preview"
                                                    >
                                                        {previewLoading === doc.id ? (
                                                            <Loader2 className="size-3 animate-spin" />
                                                        ) : (
                                                            <Eye className="size-3" />
                                                        )}
                                                        Preview
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleDownload(doc.id, doc.filename)}
                                                        className="size-7"
                                                        title="Download"
                                                    >
                                                        <Download className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* Stages Tab */}
                            <TabsContent value="Stages" className="mt-0 space-y-4">
                                <p className="text-xs font-medium text-muted-foreground">Stage Progress</p>
                                {transaction.stages ? (
                                    <div className="rounded-lg border bg-card p-4 shadow-xs">
                                        <StagePipeline transaction={transaction} />
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No stage data available.</p>
                                )}
                            </TabsContent>

                            {/* Remarks Tab */}
                            <TabsContent value="Remarks" className="mt-0 space-y-6">
                                {/* Add Remark Form */}
                                <Card className="p-4 space-y-3 border shadow-xs bg-card">
                                    <p className="text-xs font-medium text-foreground">Add Remark</p>

                                    {/* Severity */}
                                    <div className="flex gap-2">
                                        {(Object.entries(SEVERITY_CFG) as [string, typeof SEVERITY_CFG['info']][]).map(([key, cfg]) => (
                                            <Button
                                                key={key}
                                                type="button"
                                                size="sm"
                                                variant={severity === key ? 'default' : 'outline'}
                                                onClick={() => setSeverity(key as CreateRemarkData['severity'])}
                                                className="h-7 text-xs font-medium px-2.5"
                                            >
                                                {cfg.label}
                                            </Button>
                                        ))}
                                    </div>

                                    {/* Pin to document */}
                                    <div className="space-y-1">
                                        <label className="block text-xs font-medium text-muted-foreground">
                                            Pin to document <span className="font-normal opacity-60">(optional)</span>
                                        </label>
                                        {documents.length > 0 ? (
                                            <Select
                                                value={documentId !== null ? String(documentId) : 'none'}
                                                onValueChange={(value) => setDocumentId(value === 'none' ? null : Number(value))}
                                            >
                                                <SelectTrigger className="w-full h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none" className="text-xs">No specific document</SelectItem>
                                                    {documents.map(doc => (
                                                        <SelectItem key={doc.id} value={String(doc.id)} className="text-xs">{doc.filename}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="w-full rounded-md border border-dashed px-3 py-1.5 text-xs text-muted-foreground">
                                                No documents uploaded yet.
                                            </div>
                                        )}
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <Textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Describe the issue clearly for the encoder…"
                                            rows={3}
                                            maxLength={500}
                                            className="resize-none text-xs"
                                        />
                                        <div className="mt-1 text-right text-[10px] text-muted-foreground">
                                            {message.length}/500
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleCreateRemark}
                                        disabled={!message.trim() || createRemark.isPending}
                                        className="w-full font-medium h-8 text-xs"
                                    >
                                        {createRemark.isPending ? 'Submitting…' : '🚩 Flag this Transaction'}
                                    </Button>
                                </Card>

                                {/* Existing Remarks */}
                                <div className="space-y-3">
                                    <p className="text-xs font-medium text-foreground">Remark History</p>
                                    {remarksLoading ? (
                                        <div className="space-y-2">
                                            <Skeleton className="h-16 w-full rounded-lg" />
                                            <Skeleton className="h-16 w-full rounded-lg" />
                                        </div>
                                    ) : remarks.length === 0 ? (
                                        <p className="py-6 text-center text-xs text-muted-foreground">No remarks yet.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {remarks.map((r) => {
                                                const scfg = SEVERITY_CFG[r.severity as keyof typeof SEVERITY_CFG] ?? SEVERITY_CFG.info;
                                                return (
                                                    <div
                                                        key={r.id}
                                                        className={`rounded-lg border p-3.5 transition-colors ${
                                                            r.is_resolved
                                                                ? 'bg-muted/20 border-border/60 opacity-60'
                                                                : 'bg-card border-border shadow-xs'
                                                        }`}
                                                    >
                                                        <div className="mb-1.5 flex items-start justify-between gap-3">
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                <Badge
                                                                    variant={scfg.variant}
                                                                    className={`px-1.5 py-0 text-[10px] font-semibold ${scfg.className}`}
                                                                >
                                                                    {scfg.label}
                                                                </Badge>
                                                                {r.is_resolved && (
                                                                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-1.5 py-0 text-[10px] font-semibold">
                                                                        ✓ Resolved
                                                                    </Badge>
                                                                )}
                                                                {r.document && (
                                                                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                                                                        <Paperclip className="size-3" />
                                                                        {r.document.filename}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {!r.is_resolved && (
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => resolveRemark.mutate(r.id)}
                                                                    disabled={resolveRemark.isPending}
                                                                    className="h-6 text-[11px] px-2"
                                                                >
                                                                    Mark Done
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <p className="text-xs font-normal text-foreground leading-relaxed">{r.message}</p>
                                                        <p className="mt-2 text-[10px] text-muted-foreground">
                                                            {r.author?.name ?? 'System'} &bull; {new Date(r.created_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                                                            {r.resolved_by && ` &bull; Resolved by ${r.resolved_by.name}`}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </SheetContent>
            </Sheet>

            {/* File Preview Modal */}
            <FilePreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                file={previewFile?.file ?? null}
                fileName={previewFile?.name ?? ''}
                onDownload={previewFile ? () => {
                    const doc = documents.find(d => d.filename === previewFile.name);
                    if (doc) handleDownload(doc.id, doc.filename);
                } : undefined}
            />
        </>
    );
};
