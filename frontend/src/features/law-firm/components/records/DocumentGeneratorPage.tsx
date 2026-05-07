import { CurrentDateTime } from '../../../../components/CurrentDateTime';
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

const SummaryCard = ({ label, value, description, accentColor }: { label: string; value: string | number; description: string, accentColor?: string }) => (
    <div className="group relative overflow-hidden rounded-3xl border border-neutral-200/60 bg-white p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <p className="text-[13px] font-medium text-neutral-500">{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">{value}</p>
        <p className="mt-2 text-[12px] text-neutral-400">{description}</p>
        {accentColor && (
            <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${accentColor} transition-transform group-hover:scale-110`} />
        )}
    </div>
);

export const DocumentGeneratorPage = () => {
    const gen = useDocumentGenerator();
    const selectedTemplateVariant = gen.selectedTemplate ? extractTemplateVariant(gen.selectedTemplate) : null;

    return (
        <div className="relative min-h-full w-full bg-[#FAFAFA] font-sans selection:bg-neutral-900 selection:text-white">
            {/* Subtle Top Gradient background */}
            <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-neutral-100 to-transparent pointer-events-none" />
            
            <div className="relative z-10 mx-auto w-full max-w-7xl space-y-10 p-8 pb-16">
                
                {/* 21st.dev Style Header */}
                <header className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                    <div className="max-w-2xl space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200/60 bg-white px-3 py-1 shadow-sm">
                            <span className="flex h-2 w-2 rounded-full bg-purple-500" />
                            <p className="text-[11px] font-medium tracking-wide text-neutral-600">Notarial Drafting</p>
                        </div>
                        <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 md:text-5xl">
                            Create Draft
                        </h1>
                        <p className="text-[15px] leading-relaxed text-neutral-500">
                            Select a DOCX master, assign the party, then open the working copy in the editor.
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
                <div className="grid gap-4 md:grid-cols-3">
                    <SummaryCard
                        label="Ready Masters"
                        value={gen.readyTemplateCount}
                        description="DOCX masters available for drafting."
                        accentColor="bg-emerald-500/5"
                    />
                    <SummaryCard
                        label="Master Variants"
                        value={gen.totalTemplateCount}
                        description="Reusable template variants in library."
                        accentColor="bg-purple-500/5"
                    />
                    <SummaryCard
                        label="Generated Documents"
                        value={gen.generatedDocumentCount}
                        description="Editable outputs already created."
                        accentColor="bg-blue-500/5"
                    />
                </div>

                <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)] items-start">
                    
                    {/* Left Rail (DocumentTypeRail remains functionally identical, styling handled there or wraps smoothly) */}
                    <div className="relative rounded-[2rem] border border-neutral-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
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
                    <section className="flex flex-col overflow-hidden rounded-[2rem] border border-neutral-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <div className="border-b border-neutral-100 bg-white/50 px-8 py-6 backdrop-blur-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Draft Builder</p>
                            <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-neutral-900">
                                {gen.selectedTemplate?.label ?? 'Select a document master'}
                            </h2>
                            {gen.selectedTemplate?.description && (
                                <p className="mt-2 text-[14px] text-neutral-500 leading-relaxed border-l-2 border-neutral-200 pl-3 italic">
                                    "{gen.selectedTemplate.description}"
                                </p>
                            )}
                        </div>

                        {gen.selectedTemplate ? (
                            <div className="p-8 space-y-8">
                                <div className="grid gap-4 lg:grid-cols-3">
                                    <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50/50 p-5">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Document Type</p>
                                        <p className="mt-2 text-[14px] font-semibold text-neutral-900">
                                            {gen.selectedTemplate.document_code_label ?? gen.selectedTemplate.document_code}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50/50 p-5">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Variant</p>
                                        <p className="mt-2 text-[14px] font-semibold text-neutral-900">
                                            {selectedTemplateVariant ?? 'Primary master'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50/50 p-5">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Source DOCX</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <svg className="h-4 w-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="truncate text-[14px] font-semibold text-neutral-900">
                                                {gen.selectedTemplate.source_file?.filename ?? 'Source DOCX missing'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center rounded-full border border-neutral-200/60 bg-white px-3 py-1.5 text-[12px] font-medium text-neutral-600 shadow-sm">
                                        {gen.selectedTemplate.document_category_label ?? 'Document master'}
                                    </span>
                                    <span className="inline-flex items-center rounded-full border border-neutral-200/60 bg-white px-3 py-1.5 text-[12px] font-medium text-neutral-600 shadow-sm">
                                        {selectedTemplateVariant ?? 'Primary master'}
                                    </span>
                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium shadow-sm ${gen.selectedTemplate.source_file ? 'border-emerald-200/60 bg-emerald-50 text-emerald-700' : 'border-amber-200/60 bg-amber-50 text-amber-700'}`}>
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

                                <div className="flex items-start gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100/80 border border-blue-200">
                                        <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-semibold text-neutral-900">Output Destination</p>
                                        <p className="mt-1 text-[13px] leading-relaxed text-neutral-600">
                                            A fresh DOCX copy will be created from this master and opened in the editor.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="generator-notes" className="text-[13px] font-medium text-neutral-700">Internal Notes</label>
                                    <textarea
                                        id="generator-notes"
                                        rows={3}
                                        value={gen.notes}
                                        onChange={(e) => gen.setNotes(e.target.value)}
                                        placeholder="Optional note for this generated document..."
                                        className="w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-[14px] font-medium text-neutral-900 placeholder:font-normal placeholder:text-neutral-400 transition-colors hover:bg-neutral-50 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                                    />
                                </div>

                                {gen.generateSuccess && (
                                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 border border-emerald-200">
                                            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-[14px] font-medium text-emerald-800">
                                            Draft created. Opening the Word editor...
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => gen.setGenerateSuccess(false)}
                                            className="ml-auto text-[12px] font-medium text-emerald-600 hover:text-emerald-700 focus:outline-none"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex min-h-[500px] flex-col items-center justify-center px-8 text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-50 shadow-sm border border-neutral-200/60">
                                    <svg className="h-6 w-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                    </svg>
                                </div>
                                <p className="text-[17px] font-semibold text-neutral-900">Choose a master to continue</p>
                                <p className="mt-2 max-w-sm text-[14px] text-neutral-500">
                                    Select a DOCX master from the library on the left to activate the draft builder.
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-between gap-4 border-t border-neutral-100 bg-neutral-50/50 px-8 py-5">
                            <p className="text-[12px] font-medium text-neutral-500">
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
                                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-neutral-900 px-6 py-3 text-[14px] font-medium text-white shadow-sm transition-all hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 disabled:cursor-not-allowed disabled:opacity-50"
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
