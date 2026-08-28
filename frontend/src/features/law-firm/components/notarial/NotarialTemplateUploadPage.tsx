import { useMemo, useState } from 'react';
import {
    AlertCircle,
    Archive,
    CheckCircle2,
    Code2,
    FileText,
    Files,
    FolderArchive,
    Loader2,
    ShieldAlert,
    Trash2,
    UploadCloud,
    X,
} from 'lucide-react';
import { DeleteConfirmModal } from '../shared/DeleteConfirmModal';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { useAuth } from '../../../auth';
import { isAdmin } from '../../../auth/utils/access';
import {
    useCreateNotarialTemplate,
    useDeleteNotarialTemplate,
    useLegalCatalog,
    useNotarialGeneratedDocuments,
    useNotarialTemplates,
    useUpdateNotarialTemplate,
} from '../../hooks/useLegalWorkspace';
import type { LawFirmDocumentModule, LegalDocumentType, NotarialTemplate } from '../../types/legalRecords.types';

type Props = {
    module?: LawFirmDocumentModule;
};

const moduleCopy: Record<LawFirmDocumentModule, {
    description: string;
    accessDescription: string;
}> = {
    notarial: {
        description: 'Configure root templates and DOCX variants for the drafting engine.',
        accessDescription: "You don't have permission to manage document masters. Please contact an administrator.",
    },
    legal: {
        description: 'Configure legal DOCX masters and variants for the drafting engine.',
        accessDescription: "You don't have permission to manage legal document masters. Please contact an administrator.",
    },
};

const getErrorMessage = (error: unknown): string => {
    const responseData = (error as {
        response?: {
            data?: {
                message?: string;
                errors?: Record<string, string[]>;
            };
        };
    })?.response?.data;

    const firstValidationMessage = responseData?.errors
        ? Object.values(responseData.errors).flat()[0]
        : null;

    return firstValidationMessage ?? responseData?.message ?? 'Unable to save the document master.';
};

const getDeleteErrorMessage = (error: unknown): string =>
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Unable to delete the document master.';

const getArchiveErrorMessage = (error: unknown): string =>
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Unable to archive the document master.';

const slugify = (value: string): string =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const buildTemplateDraft = (
    documentType: LegalDocumentType | undefined,
    variantName: string,
): { code: string; label: string } | null => {
    if (!documentType) {
        return null;
    }

    const normalizedVariantName = variantName.trim();
    const normalizedVariantCode = slugify(normalizedVariantName);

    return {
        code: normalizedVariantCode !== ''
            ? `${documentType.code.toLowerCase()}-${normalizedVariantCode}`
            : `${documentType.code.toLowerCase()}-primary`,
        label: normalizedVariantName !== ''
            ? `${documentType.label} - ${normalizedVariantName}`
            : documentType.label,
    };
};

const extractTemplateVariant = (template: NotarialTemplate): string | null => {
    const documentLabel = template.document_code_label ?? template.document_code;
    const prefix = `${documentLabel} - `;

    if (template.label.startsWith(prefix)) {
        return template.label.slice(prefix.length).trim() || null;
    }

    return template.label !== documentLabel ? template.label : null;
};

export const NotarialTemplateUploadPage = ({ module = 'notarial' }: Props) => {
    const { user } = useAuth();
    const [draftDocumentCode, setDraftDocumentCode] = useState('');
    const [draftVariantName, setDraftVariantName] = useState('');
    const [draftDescription, setDraftDescription] = useState('');
    const [draftFile, setDraftFile] = useState<File | null>(null);
    const [pendingDeleteTemplate, setPendingDeleteTemplate] = useState<NotarialTemplate | null>(null);

    const catalogQuery = useLegalCatalog(module);
    const templatesQuery = useNotarialTemplates({ module, per_page: 100 });
    const generatedDocumentsQuery = useNotarialGeneratedDocuments({ module, per_page: 1 });
    const createTemplate = useCreateNotarialTemplate();
    const updateTemplate = useUpdateNotarialTemplate();
    const deleteTemplate = useDeleteNotarialTemplate(module);

    const documentTypes = useMemo(() => catalogQuery.data?.document_types ?? [], [catalogQuery.data?.document_types]);
    const templates = useMemo(() => templatesQuery.data?.data ?? [], [templatesQuery.data?.data]);
    const sortedTemplates = useMemo(
        () => [...templates].sort((a, b) => a.label.localeCompare(b.label)),
        [templates],
    );

    const selectedDocumentType = useMemo(
        () => documentTypes.find((type) => type.code === draftDocumentCode),
        [documentTypes, draftDocumentCode],
    );

    const draftTemplate = useMemo(
        () => buildTemplateDraft(selectedDocumentType, draftVariantName),
        [selectedDocumentType, draftVariantName],
    );

    const readyTemplateCount = templates.filter((template) => template.template_status === 'ready').length;
    const missingTemplateCount = templates.filter((template) => template.template_status === 'missing_file').length;
    const generatedDocuments = generatedDocumentsQuery.data?.meta.total ?? 0;
    const documentTypeCount = documentTypes.length;

    const canManageTemplates = Boolean(user?.permissions.manage_notarial_templates) || isAdmin(user);
    const canArchiveTemplates = canManageTemplates;
    const canDeleteTemplates = isAdmin(user);
    const copy = moduleCopy[module];

    const handleCreateTemplate = async () => {
        if (!selectedDocumentType || !draftTemplate) {
            toast.error('Document type is required.');
            return;
        }

        try {
            await createTemplate.mutateAsync({
                code: draftTemplate.code,
                label: draftTemplate.label,
                module,
                document_code: draftDocumentCode,
                description: draftDescription.trim() || undefined,
                is_active: true,
                file: draftFile,
            });

            toast.success('Document master saved.');
            setDraftVariantName('');
            setDraftDocumentCode('');
            setDraftDescription('');
            setDraftFile(null);
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    const handleDeleteTemplate = (template: NotarialTemplate) => {
        setPendingDeleteTemplate(template);
    };

    const handleArchiveTemplate = async (template: NotarialTemplate) => {
        try {
            await updateTemplate.mutateAsync({
                templateId: template.id,
                data: { module, is_active: false },
            });
            toast.success('Document master archived. Existing generated documents remain available.');
        } catch (error) {
            toast.error(getArchiveErrorMessage(error));
        }
    };

    const handleConfirmDeleteTemplate = async () => {
        if (!pendingDeleteTemplate) return;

        try {
            await deleteTemplate.mutateAsync(pendingDeleteTemplate.id);
            toast.success('Document master deleted.');
            setPendingDeleteTemplate(null);
        } catch (error) {
            toast.error(getDeleteErrorMessage(error));
        }
    };

    if (!canManageTemplates) {
        return (
            <div className="flex min-h-[400px] items-center justify-center p-8">
                <Card className="max-w-md p-8 text-center border border-border/80 bg-card shadow-xs rounded-2xl">
                    <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                        <ShieldAlert className="size-6" />
                    </div>
                    <p className="text-base font-semibold text-foreground">Access Restricted</p>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{copy.accessDescription}</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 pb-8">
            <DeleteConfirmModal
                isOpen={pendingDeleteTemplate !== null}
                title={`Delete "${pendingDeleteTemplate?.label ?? ''}"`}
                description="This permanently removes an unused source DOCX master from storage. If generated records already use this master, archive it instead so existing document history stays intact."
                confirmLabel="Delete Master"
                isPending={deleteTemplate.isPending}
                onConfirm={() => void handleConfirmDeleteTemplate()}
                onCancel={() => setPendingDeleteTemplate(null)}
            />

            <header className="flex flex-col gap-1 border-b border-border/80 pb-5">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Document Masters
                </h1>
                <p className="text-sm text-muted-foreground">
                    {copy.description}
                </p>
            </header>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Ready</CardTitle>
                        <CheckCircle2 className="size-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {readyTemplateCount}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Masters with source files</p>
                    </CardContent>
                </Card>

                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Needs DOCX</CardTitle>
                        <AlertCircle className="size-4 text-amber-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {missingTemplateCount}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Templates pending DOCX upload</p>
                    </CardContent>
                </Card>

                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Generated Outputs</CardTitle>
                        <Files className="size-4 text-blue-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {generatedDocuments}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Total generated Word documents</p>
                    </CardContent>
                </Card>

                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Catalog Types</CardTitle>
                        <FileText className="size-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {documentTypeCount}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Registered document root types</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr] items-start">
                
                <Card className="border border-border/80 bg-card shadow-2xs overflow-hidden rounded-xl">
                    <div className="border-b border-border/80 bg-muted/20 p-6">
                        <h2 className="text-base font-semibold tracking-tight text-foreground">Add Document Master</h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">Configure a new template variant and attach its source document.</p>
                    </div>

                    <div className="p-6 space-y-5">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <label htmlFor="template-document-code" className="text-xs font-medium text-foreground">Root Type</label>
                                <select
                                    id="template-document-code"
                                    value={draftDocumentCode}
                                    onChange={(event) => setDraftDocumentCode(event.target.value)}
                                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/30 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
                                >
                                    <option value="" disabled>Select document type</option>
                                    {documentTypes.map((documentType) => (
                                        <option key={documentType.code} value={documentType.code}>
                                            {documentType.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="template-variant-name" className="flex items-center justify-between text-xs font-medium text-foreground">
                                    Variant Name
                                    <span className="text-[10px] font-normal text-muted-foreground">Optional</span>
                                </label>
                                <Input
                                    id="template-variant-name"
                                    value={draftVariantName}
                                    onChange={(event) => setDraftVariantName(event.target.value)}
                                    placeholder="e.g. Standard, TIN, Driver's License"
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>

                        <div className="rounded-xl border border-border/80 bg-muted/30 p-4 shadow-2xs">
                            <div className="flex items-center gap-3">
                                <div className="flex size-8 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground">
                                    <Code2 className="size-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">System Code & Label</p>
                                    <p className="font-mono text-xs font-semibold text-foreground">
                                        {draftTemplate?.code ?? <span className="font-normal italic text-muted-foreground">Waiting for selection...</span>}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="template-description" className="text-xs font-medium text-foreground">Internal Usage Notes</label>
                            <textarea
                                id="template-description"
                                value={draftDescription}
                                onChange={(event) => setDraftDescription(event.target.value)}
                                rows={3}
                                placeholder="Provide context on when staff should use this master..."
                                className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground transition-colors hover:bg-muted/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="relative overflow-hidden rounded-xl border border-dashed border-border/80 bg-muted/20 p-2 transition-colors hover:bg-muted/40 hover:border-primary/50">
                            <label className="flex cursor-pointer flex-col items-center justify-center p-6 text-center">
                                <div className="mb-2.5 flex size-10 items-center justify-center rounded-lg border border-border/80 bg-background shadow-2xs">
                                    <UploadCloud className="size-5 text-muted-foreground" />
                                </div>
                                <p className="text-xs font-semibold text-foreground">Attach Master Document</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">Upload a <span className="font-semibold">.docx</span> file to be used as generator source.</p>
                                
                                <input
                                    id="template-file"
                                    type="file"
                                    accept=".docx"
                                    onChange={(event) => setDraftFile(event.target.files?.[0] ?? null)}
                                    className="hidden"
                                />
                                
                                {draftFile && (
                                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/80 bg-background py-1 pl-2.5 pr-1 shadow-2xs">
                                        <FileText className="size-3.5 text-primary shrink-0" />
                                        <span className="max-w-[160px] truncate text-xs font-medium text-foreground">{draftFile.name}</span>
                                        <button 
                                            type="button" 
                                            onClick={(e) => { e.preventDefault(); setDraftFile(null); }}
                                            className="rounded-md p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    </div>
                                )}
                            </label>
                        </div>

                        <Button
                            type="button"
                            id="template-save"
                            onClick={() => void handleCreateTemplate()}
                            disabled={createTemplate.isPending}
                            className="w-full h-9 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {createTemplate.isPending ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Save Document Master'
                            )}
                        </Button>
                    </div>
                </Card>

                <Card className="flex max-h-[850px] flex-col border border-border/80 bg-card shadow-2xs overflow-hidden rounded-xl">
                    <div className="flex shrink-0 items-center justify-between border-b border-border/80 bg-muted/20 p-6">
                        <div>
                            <h2 className="text-base font-semibold tracking-tight text-foreground">Deployed Masters</h2>
                            <p className="mt-0.5 text-xs text-muted-foreground">Live templates available for generation.</p>
                        </div>
                        <span className="flex h-6 min-w-[24px] items-center justify-center rounded-md bg-muted px-2 text-xs font-semibold text-muted-foreground">
                            {sortedTemplates.length}
                        </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {sortedTemplates.length > 0 ? (
                            sortedTemplates.map((template) => (
                                <div 
                                    key={template.id} 
                                    className="group flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-card p-3.5 transition-colors hover:bg-muted/30"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-background shadow-2xs">
                                            <FileText className="size-4.5 text-muted-foreground" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-semibold text-foreground">
                                                {template.document_code_label ?? template.document_code}
                                            </p>
                                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <span className="truncate">
                                                    {extractTemplateVariant(template) ?? 'Primary'}
                                                </span>
                                                <span className="size-1 rounded-full bg-muted-foreground/40" />
                                                <span className="truncate font-mono">
                                                    {template.source_file?.filename ?? 'No File attached'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex shrink-0 items-center gap-2 pl-2">
                                        <div>
                                            {template.template_status === 'ready' ? (
                                                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                                                    <span className="size-1.5 rounded-full bg-emerald-500" />
                                                    Ready
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                                                    <span className="size-1.5 rounded-full bg-amber-500" />
                                                    Missing
                                                </span>
                                            )}
                                        </div>
                                        {canArchiveTemplates || canDeleteTemplates ? (
                                            <div className="flex items-center gap-1">
                                                {canArchiveTemplates ? (
                                                    <button
                                                        type="button"
                                                        title="Archive"
                                                        aria-label="Archive"
                                                        onClick={() => void handleArchiveTemplate(template)}
                                                        disabled={updateTemplate.isPending}
                                                        className="inline-flex size-7 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-amber-300 cursor-pointer shadow-2xs transition-colors"
                                                    >
                                                        <Archive className="size-3.5" />
                                                    </button>
                                                ) : null}
                                                {canDeleteTemplates ? (
                                                    <button
                                                        type="button"
                                                        title="Delete"
                                                        aria-label="Delete"
                                                        onClick={() => void handleDeleteTemplate(template)}
                                                        disabled={deleteTemplate.isPending}
                                                        className="inline-flex size-7 items-center justify-center rounded-lg border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-2xs transition-colors"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 text-center">
                                <div className="mb-3 flex size-12 items-center justify-center rounded-xl border border-border/80 bg-muted shadow-2xs">
                                    <FolderArchive className="size-5 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-semibold text-foreground">No Masters Found</p>
                                <p className="mt-1 text-xs text-muted-foreground">Upload your first DOCX to begin.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};
