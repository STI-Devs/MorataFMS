import { useDocumentGenerator } from '../../hooks/useDocumentGenerator';
import { DocumentTypeRail } from '../generator/DocumentTypeRail';
import { PartyCombobox } from '../generator/PartyCombobox';
import type { NotarialTemplate } from '../../types/legalRecords.types';

const extractTemplateVariant = (template: NotarialTemplate): string | null => {
    const documentLabel = template.document_code_label ?? template.document_code;
    const prefix = `${documentLabel} - `;

    if (template.label.startsWith(prefix)) {
        return template.label.slice(prefix.length).trim() || null;
    }

    return template.label !== documentLabel ? template.label : null;
};

const SummaryCard = ({ label, value }: { label: string; value: string | number }) => (
    <div className="rounded-xl border border-border bg-surface-elevated px-4 py-3 shadow-sm dark:shadow-none">
        <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">{value}</p>
    </div>
);

export const DocumentGeneratorPage = () => {
    const gen = useDocumentGenerator();
    const selectedTemplateVariant = gen.selectedTemplate ? extractTemplateVariant(gen.selectedTemplate) : null;

    return (
        <div className="relative min-h-full w-full bg-surface-secondary font-sans selection:bg-text-primary selection:text-surface">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-surface-elevated to-transparent" />

            <div className="relative z-10 mx-auto w-full max-w-7xl space-y-5 p-6 pb-12">

                <header className="space-y-0.5">
                    <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
                        Create Draft
                    </h1>
                    <p className="text-[13px] text-text-secondary">
                        Select a DOCX master, assign the party, then open the working copy in the editor.
                    </p>
                </header>

                <div className="grid grid-cols-3 gap-3">
                    <SummaryCard label="Ready Masters" value={gen.readyTemplateCount} />
                    <SummaryCard label="Master Variants" value={gen.totalTemplateCount} />
                    <SummaryCard label="Generated Documents" value={gen.generatedDocumentCount} />
                </div>

                <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)] items-start">
                    
                    {/* Left Rail (DocumentTypeRail remains functionally identical, styling handled there or wraps smoothly) */}
                    <div className="relative overflow-hidden rounded-[2rem] border border-border bg-surface-elevated shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
                        <DocumentTypeRail
                            search={gen.templateSearch}
                            onSearchChange={gen.setTemplateSearch}
                            categoryFilters={gen.categoryFilters}
                            selectedCategory={gen.selectedCategory}
                            onCategorySelect={gen.handleCategorySelect}
                            templates={gen.filteredTemplates}
                            selectedTemplateId={gen.selectedTemplate?.id ?? null}
                            onTemplateSelect={gen.handleTemplateSelect}
                            totalCount={gen.filteredTemplates.length}
                        />
                    </div>

                    {/* Draft Builder - Main Panel */}
                    <section className="flex flex-col overflow-hidden rounded-[2rem] border border-border bg-surface-elevated shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
                        <div className="border-b border-border bg-surface-elevated/70 px-8 py-6 backdrop-blur-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">Draft Builder</p>
                            <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-text-primary">
                                {gen.selectedTemplate?.label ?? 'Select a document master'}
                            </h2>
                            {gen.selectedTemplate?.description && (
                                <p className="mt-2 border-l-2 border-border pl-3 text-[14px] leading-relaxed text-text-secondary italic">
                                    "{gen.selectedTemplate.description}"
                                </p>
                            )}
                        </div>

                        {gen.selectedTemplate ? (
                            <div className="p-8 space-y-8">
                                <div className="grid gap-4 lg:grid-cols-3">
                                    <div className="rounded-2xl border border-border bg-surface-secondary p-5">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">Document Type</p>
                                        <p className="mt-2 text-[14px] font-semibold text-text-primary">
                                            {gen.selectedTemplate.document_code_label ?? gen.selectedTemplate.document_code}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-border bg-surface-secondary p-5">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">Variant</p>
                                        <p className="mt-2 text-[14px] font-semibold text-text-primary">
                                            {selectedTemplateVariant ?? 'Primary master'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-border bg-surface-secondary p-5">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">Source DOCX</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <svg className="h-4 w-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="truncate text-[14px] font-semibold text-text-primary">
                                                {gen.selectedTemplate.source_file?.filename ?? 'Source DOCX missing'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-[12px] font-medium text-text-secondary shadow-sm dark:shadow-none">
                                        {gen.selectedTemplate.document_category_label ?? 'Document master'}
                                    </span>
                                    <span className="inline-flex items-center rounded-full border border-border bg-surface-elevated px-3 py-1.5 text-[12px] font-medium text-text-secondary shadow-sm dark:shadow-none">
                                        {selectedTemplateVariant ?? 'Primary master'}
                                    </span>
                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium shadow-sm dark:shadow-none ${gen.selectedTemplate.source_file ? 'border-emerald-200/60 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-amber-200/60 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300'}`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${gen.selectedTemplate.source_file ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                        {gen.selectedTemplate.source_file ? 'DOCX ready' : 'Missing DOCX'}
                                    </span>
                                </div>

                                {/* Party Combobox wrapper */}
                                <div className="relative">
                                    <PartyCombobox
                                        search={gen.partySearch}
                                        onSearchChange={gen.setPartySearch}
                                        suggestions={gen.partySuggestions}
                                        selectedParty={gen.selectedParty}
                                        onSelect={gen.handlePartySelect}
                                    />
                                </div>

                                <div className="flex items-start gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-400/20 dark:bg-blue-500/10">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-100/80 dark:border-blue-400/20 dark:bg-blue-500/15">
                                        <svg className="h-4 w-4 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-semibold text-blue-950 dark:text-blue-100">Output Destination</p>
                                        <p className="mt-1 text-[13px] leading-relaxed text-blue-800/80 dark:text-blue-200/80">
                                            A fresh DOCX copy will be created from this master and opened in the editor.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="generator-notes" className="text-[13px] font-medium text-text-secondary">Internal Notes</label>
                                    <textarea
                                        id="generator-notes"
                                        rows={3}
                                        value={gen.notes}
                                        onChange={(e) => gen.setNotes(e.target.value)}
                                        placeholder="Optional note for this generated document..."
                                        className="w-full resize-y rounded-xl border border-border bg-input-bg px-4 py-3 text-[14px] font-medium text-text-primary placeholder:font-normal placeholder:text-text-muted transition-colors hover:bg-hover focus:border-text-primary focus:bg-surface-elevated focus:outline-none focus:ring-1 focus:ring-text-primary"
                                    />
                                </div>

                                {gen.generateSuccess && (
                                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-400/20 dark:bg-emerald-500/10">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-500/15">
                                            <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-[14px] font-medium text-emerald-800 dark:text-emerald-200">
                                            Draft created. Opening the Word editor...
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => gen.setGenerateSuccess(false)}
                                            className="ml-auto text-[12px] font-medium text-emerald-600 hover:text-emerald-700 focus:outline-none dark:text-emerald-300 dark:hover:text-emerald-200"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex min-h-[500px] flex-col items-center justify-center px-8 text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-surface-secondary shadow-sm dark:shadow-none">
                                    <svg className="h-6 w-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                    </svg>
                                </div>
                                <p className="text-[17px] font-semibold text-text-primary">Choose a master to continue</p>
                                <p className="mt-2 max-w-sm text-[14px] text-text-secondary">
                                    Select a DOCX master from the library on the left to activate the draft builder.
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-4 border-t border-border bg-surface-secondary px-8 py-5">
                            <p className="text-[12px] font-medium text-text-secondary">
                                {gen.selectedTemplate?.source_file
                                    ? 'Copy will be saved under Generated Documents.'
                                    : gen.selectedTemplate
                                    ? 'Master DOCX not uploaded - contact admin.'
                                    : ''}
                            </p>
                            <button
                                type="button"
                                id="generate-document"
                                onClick={() => void gen.handleGenerate()}
                                disabled={!gen.canGenerate}
                                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-neutral-900 px-6 py-3 text-[14px] font-medium text-white shadow-sm transition-all hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 dark:focus:ring-white/20"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full transition-transform group-hover:translate-y-0" />
                                <span className="relative z-10 flex items-center gap-2">
                                    {gen.isPending ? (
                                        <>
                                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Preparing...
                                        </>
                                    ) : 'Open in Editor'}
                                </span>
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
