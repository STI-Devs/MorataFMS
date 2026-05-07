import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CurrentDateTime } from '../../../../components/CurrentDateTime';
import { useAuth } from '../../../auth';
import {
    useCreateNotarialTemplate,
    useLegalCatalog,
    useNotarialGeneratedDocuments,
    useNotarialTemplates,
} from '../../hooks/useLegalWorkspace';
import type { LegalDocumentType, NotarialTemplate } from '../../types/legalRecords.types';

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

export const NotarialTemplateUploadPage = () => {
    const { user } = useAuth();
    const canManageTemplates = Boolean(user?.permissions.manage_notarial_templates);

    const [draftVariantName, setDraftVariantName] = useState('');
    const [draftDocumentCode, setDraftDocumentCode] = useState('');
    const [draftDescription, setDraftDescription] = useState('');
    const [draftFile, setDraftFile] = useState<File | null>(null);

    const catalogQuery = useLegalCatalog();
    const templatesQuery = useNotarialTemplates({ per_page: 100 });
    const readyTemplatesQuery = useNotarialTemplates({ template_status: 'ready', page: 1, per_page: 1 });
    const missingTemplatesQuery = useNotarialTemplates({ template_status: 'missing_file', page: 1, per_page: 1 });
    const generatedDocumentsQuery = useNotarialGeneratedDocuments({ page: 1, per_page: 1 });
    const createTemplate = useCreateNotarialTemplate();

    const templates = useMemo(
        () => templatesQuery.data?.data ?? [],
        [templatesQuery.data?.data],
    );
    const documentTypes = useMemo(
        () => catalogQuery.data?.document_types ?? [],
        [catalogQuery.data?.document_types],
    );
    const readyTemplateCount = readyTemplatesQuery.data?.meta.total ?? 0;
    const missingTemplateCount = missingTemplatesQuery.data?.meta.total ?? 0;
    const generatedDocuments = generatedDocumentsQuery.data?.meta.total ?? 0;
    const documentTypeCount = documentTypes.length;
    const selectedDocumentType = useMemo(
        () => documentTypes.find((documentType) => documentType.code === draftDocumentCode),
        [documentTypes, draftDocumentCode],
    );
    const draftTemplate = useMemo(
        () => buildTemplateDraft(selectedDocumentType, draftVariantName),
        [selectedDocumentType, draftVariantName],
    );

    const sortedTemplates = useMemo(
        () =>
            [...templates].sort((left, right) => {
                if (left.template_status === 'missing_file' && right.template_status !== 'missing_file') {
                    return -1;
                }

                if (left.template_status !== 'missing_file' && right.template_status === 'missing_file') {
                    return 1;
                }

                return left.label.localeCompare(right.label);
            }),
        [templates],
    );

    const handleCreateTemplate = async () => {
        if (!selectedDocumentType || !draftTemplate) {
            toast.error('Document type is required.');
            return;
        }

        try {
            await createTemplate.mutateAsync({
                code: draftTemplate.code,
                label: draftTemplate.label,
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

    if (!canManageTemplates) {
        return (
            <div className="flex min-h-full items-center justify-center p-8 bg-[#fdfdfd]">
                <div className="max-w-md rounded-3xl border border-neutral-200/60 bg-white/50 p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 shadow-inner">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-lg font-semibold tracking-tight text-neutral-900">Access Restricted</p>
                    <p className="mt-2 text-sm text-neutral-500">You don't have permission to manage document masters. Please contact an administrator.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-full w-full bg-[#FAFAFA] font-sans selection:bg-neutral-900 selection:text-white">
            {/* Subtle Top Gradient background */}
            <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-neutral-100 to-transparent pointer-events-none" />
            
            <div className="relative z-10 mx-auto w-full max-w-7xl space-y-10 p-8 pb-16">
                
                {/* 21st.dev Style Header */}
                <header className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                    <div className="max-w-2xl space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200/60 bg-white px-3 py-1 shadow-sm">
                            <span className="flex h-2 w-2 rounded-full bg-neutral-900" />
                            <p className="text-[11px] font-medium tracking-wide text-neutral-600">Master Library</p>
                        </div>
                        <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 md:text-5xl">
                            Document Masters
                        </h1>
                        <p className="text-[15px] leading-relaxed text-neutral-500">
                            Configure root templates and DOCX variants. The drafting engine uses these blueprints to generate isolated client documents.
                        </p>
                    </div>
                    
                    <div className="flex shrink-0 items-center justify-end">
                        <CurrentDateTime
                            className="text-right"
                            timeClassName="text-2xl font-semibold tracking-tight text-neutral-900 tabular-nums"
                            dateClassName="text-[13px] font-medium text-neutral-500"
                        />
                    </div>
                </header>

                {/* Metrics Bento Grid */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <div className="group relative overflow-hidden rounded-3xl border border-neutral-200/60 bg-white p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <p className="text-[13px] font-medium text-neutral-500">Ready</p>
                        <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">{readyTemplateCount}</p>
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/5 transition-transform group-hover:scale-110" />
                    </div>
                    <div className="group relative overflow-hidden rounded-3xl border border-neutral-200/60 bg-white p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <p className="text-[13px] font-medium text-neutral-500">Needs DOCX</p>
                        <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">{missingTemplateCount}</p>
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/5 transition-transform group-hover:scale-110" />
                    </div>
                    <div className="group relative overflow-hidden rounded-3xl border border-neutral-200/60 bg-white p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <p className="text-[13px] font-medium text-neutral-500">Generated Outputs</p>
                        <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">{generatedDocuments}</p>
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-500/5 transition-transform group-hover:scale-110" />
                    </div>
                    <div className="group relative overflow-hidden rounded-3xl border border-neutral-200/60 bg-white p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <p className="text-[13px] font-medium text-neutral-500">Catalog Types</p>
                        <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">{documentTypeCount}</p>
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-purple-500/5 transition-transform group-hover:scale-110" />
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr] items-start">
                    
                    {/* INTAKE FORM - Sleek Card */}
                    <section className="relative overflow-hidden rounded-[2rem] border border-neutral-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <div className="border-b border-neutral-100 bg-white/50 px-8 py-6 backdrop-blur-sm">
                            <h2 className="text-[17px] font-semibold tracking-tight text-neutral-900">Add Document Master</h2>
                            <p className="mt-1 text-[13px] text-neutral-500">Configure a new template variant and attach its source document.</p>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label htmlFor="template-document-code" className="text-[13px] font-medium text-neutral-700">Root Type</label>
                                    <div className="relative">
                                        <select
                                            id="template-document-code"
                                            value={draftDocumentCode}
                                            onChange={(event) => setDraftDocumentCode(event.target.value)}
                                            className="w-full appearance-none rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-[14px] font-medium text-neutral-900 transition-colors hover:bg-neutral-50 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                        >
                                            <option value="" disabled>Select document type</option>
                                            {documentTypes.map((documentType) => (
                                                <option key={documentType.code} value={documentType.code}>
                                                    {documentType.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                                            <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="template-variant-name" className="flex items-center justify-between text-[13px] font-medium text-neutral-700">
                                        Variant Name
                                        <span className="text-[11px] font-normal text-neutral-400">Optional</span>
                                    </label>
                                    <input
                                        id="template-variant-name"
                                        value={draftVariantName}
                                        onChange={(event) => setDraftVariantName(event.target.value)}
                                        placeholder="e.g. Standard, TIN, Driver's License"
                                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-[14px] font-medium text-neutral-900 placeholder:font-normal placeholder:text-neutral-400 transition-colors hover:bg-neutral-50 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                    />
                                </div>
                            </div>

                            {/* Code Preview - Premium subtle box */}
                            <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50/30 p-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-200/50">
                                        <svg className="h-4 w-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-medium text-neutral-500">System Code & Label</p>
                                        <p className="font-mono text-[13px] font-semibold text-neutral-900">
                                            {draftTemplate?.code ?? <span className="text-neutral-400 font-normal italic">Waiting for selection...</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="template-description" className="text-[13px] font-medium text-neutral-700">Internal Usage Notes</label>
                                <textarea
                                    id="template-description"
                                    value={draftDescription}
                                    onChange={(event) => setDraftDescription(event.target.value)}
                                    rows={3}
                                    placeholder="Provide context on when staff should use this master..."
                                    className="w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-[14px] font-medium text-neutral-900 placeholder:font-normal placeholder:text-neutral-400 transition-colors hover:bg-neutral-50 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                />
                            </div>

                            {/* UPLOAD ZONE */}
                            <div className="relative overflow-hidden rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 p-1 transition-all hover:border-neutral-400 hover:bg-neutral-50">
                                <label className="flex cursor-pointer flex-col items-center justify-center px-6 py-10 text-center">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-200/60">
                                        <svg className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                    </div>
                                    <p className="text-[14px] font-medium text-neutral-900">Attach Master Document</p>
                                    <p className="mt-1 text-[13px] text-neutral-500">Upload a <span className="font-semibold">.docx</span> file to be used as the generator source.</p>
                                    
                                    <input
                                        id="template-file"
                                        type="file"
                                        accept=".docx"
                                        onChange={(event) => setDraftFile(event.target.files?.[0] ?? null)}
                                        className="hidden"
                                    />
                                    
                                    {draftFile && (
                                        <div className="mt-4 flex items-center gap-3 rounded-full border border-neutral-200 bg-white py-1.5 pl-3 pr-1.5 shadow-sm">
                                            <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span className="max-w-[180px] truncate text-[13px] font-medium text-neutral-900">{draftFile.name}</span>
                                            <button 
                                                type="button" 
                                                onClick={(e) => { e.preventDefault(); setDraftFile(null); }}
                                                className="ml-1 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none"
                                            >
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </label>
                            </div>

                            <button
                                type="button"
                                id="template-save"
                                onClick={() => void handleCreateTemplate()}
                                disabled={createTemplate.isPending}
                                className="group relative w-full overflow-hidden rounded-xl bg-neutral-900 px-6 py-3.5 text-[14px] font-medium text-white shadow-sm transition-all hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full transition-transform group-hover:translate-y-0" />
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {createTemplate.isPending ? (
                                        <>
                                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </>
                                    ) : 'Save Document Master'}
                                </span>
                            </button>
                        </div>
                    </section>

                    {/* LIBRARY LIST - Vercel / Linear Style Stack */}
                    <section className="flex max-h-[850px] flex-col overflow-hidden rounded-[2rem] border border-neutral-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 bg-white/50 px-8 py-6 backdrop-blur-sm">
                            <div>
                                <h2 className="text-[17px] font-semibold tracking-tight text-neutral-900">Deployed Masters</h2>
                                <p className="mt-1 text-[13px] text-neutral-500">Live templates available for generation.</p>
                            </div>
                            <div className="flex h-7 min-w-[28px] items-center justify-center rounded-full bg-neutral-100 px-2 text-[12px] font-semibold text-neutral-600">
                                {sortedTemplates.length}
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {sortedTemplates.length > 0 ? (
                                sortedTemplates.map((template) => (
                                    <div 
                                        key={template.id} 
                                        className="group relative flex items-center justify-between gap-4 rounded-2xl border border-neutral-100 bg-white p-4 transition-all hover:border-neutral-200 hover:shadow-[0_4px_20px_rgb(0,0,0,0.03)]"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-100 bg-neutral-50 group-hover:bg-white transition-colors">
                                                <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-[14px] font-medium text-neutral-900">
                                                    {template.document_code_label ?? template.document_code}
                                                </p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className="truncate text-[13px] text-neutral-500">
                                                        {extractTemplateVariant(template) ?? 'Primary'}
                                                    </span>
                                                    <span className="h-1 w-1 rounded-full bg-neutral-300" />
                                                    <span className="truncate text-[12px] font-mono text-neutral-400">
                                                        {template.source_file?.filename ?? 'No File attached'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="shrink-0 pl-4">
                                            {template.template_status === 'ready' ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/50 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    Ready
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/50 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                                    Missing
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50 p-8 text-center">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                                        <svg className="h-6 w-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-[14px] font-medium text-neutral-900">No Masters Found</p>
                                    <p className="mt-1 text-[13px] text-neutral-500">Upload your first DOCX to begin.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
