import {
    CheckCircle2,
    FileText,
    Files,
    Info,
    Layers,
    Loader2,
    MousePointerClick,
} from 'lucide-react';
import { useDocumentGenerator } from '../../hooks/useDocumentGenerator';
import { DocumentTypeRail } from '../generator/DocumentTypeRail';
import { PartyCombobox } from '../generator/PartyCombobox';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import type { LawFirmDocumentModule, NotarialTemplate } from '../../types/legalRecords.types';

type Props = {
    module?: LawFirmDocumentModule;
};

const moduleCopy: Record<LawFirmDocumentModule, {
    description: string;
    missingMasterText: string;
}> = {
    notarial: {
        description: 'Select a DOCX master, assign the party, then open the working copy in the editor.',
        missingMasterText: 'Master DOCX not uploaded - contact admin.',
    },
    legal: {
        description: 'Select a legal DOCX master, assign the party, then open the working copy in the editor.',
        missingMasterText: 'Legal master DOCX not uploaded - contact admin.',
    },
};

const extractTemplateVariant = (template: NotarialTemplate): string | null => {
    const documentLabel = template.document_code_label ?? template.document_code;
    const prefix = `${documentLabel} - `;

    if (template.label.startsWith(prefix)) {
        return template.label.slice(prefix.length).trim() || null;
    }

    return template.label !== documentLabel ? template.label : null;
};

export const DocumentGeneratorPage = ({ module = 'notarial' }: Props) => {
    const gen = useDocumentGenerator(module);
    const selectedTemplateVariant = gen.selectedTemplate ? extractTemplateVariant(gen.selectedTemplate) : null;
    const copy = moduleCopy[module];

    return (
        <div className="w-full space-y-6 pb-8">
            {/* Header */}
            <header className="flex flex-col gap-1 border-b border-border/80 pb-5">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Create Draft
                </h1>
                <p className="text-sm text-muted-foreground">
                    {copy.description}
                </p>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Ready Masters</CardTitle>
                        <CheckCircle2 className="size-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {gen.readyTemplateCount}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Masters with source DOCX files</p>
                    </CardContent>
                </Card>

                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Master Variants</CardTitle>
                        <Layers className="size-4 text-amber-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {gen.totalTemplateCount}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Total template configurations</p>
                    </CardContent>
                </Card>

                <Card className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Generated Documents</CardTitle>
                        <Files className="size-4 text-blue-500" />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                            {gen.generatedDocumentCount}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Editable Word outputs created</p>
                    </CardContent>
                </Card>
            </div>

            {/* Generator Grid */}
            <div className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)] items-start">
                
                {/* Left Rail */}
                <Card className="border border-border/80 bg-card shadow-2xs overflow-hidden rounded-xl">
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
                </Card>

                {/* Draft Builder - Main Panel */}
                <Card className="flex flex-col border border-border/80 bg-card shadow-2xs overflow-hidden rounded-xl">
                    <div className="border-b border-border/80 bg-muted/20 p-6">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Draft Builder</p>
                        <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
                            {gen.selectedTemplate?.label ?? 'Select a document master'}
                        </h2>
                        {gen.selectedTemplate?.description && (
                            <p className="mt-1.5 border-l-2 border-primary/40 pl-3 text-xs leading-relaxed text-muted-foreground italic">
                                "{gen.selectedTemplate.description}"
                            </p>
                        )}
                    </div>

                    {gen.selectedTemplate ? (
                        <div className="p-6 space-y-6">
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Document Type</p>
                                    <p className="mt-1 text-xs font-semibold text-foreground">
                                        {gen.selectedTemplate.document_code_label ?? gen.selectedTemplate.document_code}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Variant</p>
                                    <p className="mt-1 text-xs font-semibold text-foreground">
                                        {selectedTemplateVariant ?? 'Primary master'}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Source DOCX</p>
                                    <div className="mt-1 flex items-center gap-1.5 min-w-0">
                                        <FileText className="size-3.5 text-blue-500 shrink-0" />
                                        <p className="truncate text-xs font-semibold text-foreground">
                                            {gen.selectedTemplate.source_file?.filename ?? 'Source DOCX missing'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center rounded-lg border border-border/80 bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground">
                                    {gen.selectedTemplate.document_category_label ?? 'Document master'}
                                </span>
                                <span className="inline-flex items-center rounded-lg border border-border/80 bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground">
                                    {selectedTemplateVariant ?? 'Primary master'}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${gen.selectedTemplate.source_file ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}>
                                    <span className={`size-1.5 rounded-full ${gen.selectedTemplate.source_file ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                    {gen.selectedTemplate.source_file ? 'DOCX ready' : 'Missing DOCX'}
                                </span>
                            </div>

                            {/* Party Combobox */}
                            <div className="relative">
                                <PartyCombobox
                                    search={gen.partySearch}
                                    onSearchChange={gen.setPartySearch}
                                    suggestions={gen.partySuggestions}
                                    selectedParty={gen.selectedParty}
                                    onSelect={gen.handlePartySelect}
                                />
                            </div>

                            <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-muted-foreground">
                                <Info className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-foreground">Output Destination</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        A fresh DOCX copy will be created from this master and opened in the editor.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="generator-notes" className="text-xs font-medium text-foreground">Internal Notes</label>
                                <textarea
                                    id="generator-notes"
                                    rows={3}
                                    value={gen.notes}
                                    onChange={(e) => gen.setNotes(e.target.value)}
                                    placeholder="Optional note for this generated document..."
                                    className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground transition-colors hover:bg-muted/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            {gen.generateSuccess && (
                                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    <span className="font-medium">
                                        Draft created. Opening the Word editor...
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => gen.setGenerateSuccess(false)}
                                        className="ml-auto font-medium underline hover:opacity-80 cursor-pointer"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
                            <div className="mb-3 flex size-12 items-center justify-center rounded-xl border border-border/80 bg-muted shadow-2xs">
                                <MousePointerClick className="size-5 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">Choose a master to continue</p>
                            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                                Select a DOCX master from the library on the left to activate the draft builder.
                            </p>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-4 border-t border-border/80 bg-muted/20 px-6 py-4 mt-auto">
                        <p className="text-xs font-medium text-muted-foreground">
                            {gen.selectedTemplate?.source_file
                                ? 'Copy will be saved under Generated Documents.'
                                : gen.selectedTemplate
                                ? copy.missingMasterText
                                : ''}
                        </p>
                        <Button
                            type="button"
                            id="generate-document"
                            onClick={() => void gen.handleGenerate()}
                            disabled={!gen.canGenerate}
                            className="h-8.5 px-4 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {gen.isPending ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    Preparing...
                                </>
                            ) : (
                                'Open in Editor'
                            )}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};
