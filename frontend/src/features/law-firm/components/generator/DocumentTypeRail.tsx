import { FileText, Layers, Search } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import type { DocumentTemplateCategoryCode, NotarialTemplate } from '../../types/legalRecords.types';

type CategoryFilter = { code: DocumentTemplateCategoryCode; label: string; count: number };

type Props = {
    search: string;
    onSearchChange: (v: string) => void;
    categoryFilters: CategoryFilter[];
    selectedCategory: DocumentTemplateCategoryCode | 'all';
    onCategorySelect: (cat: DocumentTemplateCategoryCode | 'all') => void;
    templates: NotarialTemplate[];
    selectedTemplateId: number | null;
    onTemplateSelect: (id: number) => void;
    totalCount: number;
};

const extractTemplateVariant = (template: NotarialTemplate): string | null => {
    const documentLabel = template.document_code_label ?? template.document_code;
    const prefix = `${documentLabel} - `;

    if (template.label.startsWith(prefix)) {
        return template.label.slice(prefix.length).trim() || null;
    }

    return template.label !== documentLabel ? template.label : null;
};

export const DocumentTypeRail = ({
    search,
    onSearchChange,
    categoryFilters,
    selectedCategory,
    onCategorySelect,
    templates,
    selectedTemplateId,
    onTemplateSelect,
    totalCount,
}: Props) => (
    <div className="flex h-full flex-col">
        {/* Rail Header */}
        <div className="border-b border-border/80 bg-muted/20 p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Master Library</p>
                    <h2 className="text-base font-semibold tracking-tight text-foreground">Choose a master</h2>
                </div>
                <span className="inline-flex h-6 items-center justify-center rounded-md bg-muted px-2 text-xs font-semibold text-muted-foreground">
                    {templates.length} visible
                </span>
            </div>

            {/* Category Filter Pills */}
            <div className="mt-4 flex flex-wrap gap-1.5">
                <button
                    type="button"
                    onClick={() => onCategorySelect('all')}
                    className={[
                        'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer shadow-2xs',
                        selectedCategory === 'all'
                            ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                            : 'border border-border/80 bg-background text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                    ].join(' ')}
                >
                    All <span className={`ml-1 text-[11px] ${selectedCategory === 'all' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{totalCount}</span>
                </button>
                {categoryFilters.map((cat) => (
                    <button
                        key={cat.code}
                        type="button"
                        onClick={() => onCategorySelect(cat.code)}
                        className={[
                            'inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer shadow-2xs',
                            selectedCategory === cat.code
                                ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                                : 'border border-border/80 bg-background text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                        ].join(' ')}
                    >
                        {cat.label} <span className={`ml-1 text-[11px] ${selectedCategory === cat.code ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{cat.count}</span>
                    </button>
                ))}
            </div>

            {/* Search Box */}
            <div className="mt-3.5 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="size-3.5 text-muted-foreground" />
                </div>
                <Input
                    id="master-search"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search masters by document or variant..."
                    className="pl-8.5 h-8.5 text-xs bg-background"
                />
            </div>
        </div>

        {/* Master Cards List */}
        <div className="max-h-[calc(100vh-320px)] min-h-[420px] flex-1 overflow-y-auto p-3 space-y-2 bg-muted/10">
            {templates.length > 0 ? (
                templates.map((tpl) => {
                    const variantLabel = extractTemplateVariant(tpl);
                    const title = variantLabel ?? (tpl.document_code_label ?? tpl.document_code);
                    const subtitle = variantLabel
                        ? (tpl.document_code_label ?? tpl.document_code)
                        : 'Primary master';

                    const isSelected = selectedTemplateId === tpl.id;
                    const isReady = tpl.template_status === 'ready';

                    return (
                        <button
                            key={tpl.id}
                            type="button"
                            disabled={!isReady}
                            onClick={() => onTemplateSelect(tpl.id)}
                            className={[
                                'group flex w-full flex-col items-start rounded-xl border p-3.5 text-left transition-colors cursor-pointer shadow-2xs',
                                isSelected
                                    ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary'
                                    : !isReady
                                    ? 'cursor-not-allowed border-dashed border-border/80 bg-muted/20 opacity-60'
                                    : 'border-border/80 bg-card hover:border-primary/40 hover:bg-muted/40',
                            ].join(' ')}
                        >
                            <div className="flex w-full items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className={`truncate text-xs font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                        {title}
                                    </p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
                                </div>
                                <span
                                    className={[
                                        'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase',
                                        isReady
                                            ? isSelected
                                                ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30'
                                                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20',
                                    ].join(' ')}
                                >
                                    {isReady ? 'Ready' : 'Missing'}
                                </span>
                            </div>
                            <div className="mt-2.5 flex w-full items-center gap-1.5 border-t border-border/50 pt-2 text-muted-foreground">
                                <FileText className="size-3 shrink-0" />
                                <p className="truncate text-[11px] font-mono">
                                    {tpl.source_file?.filename ?? 'Source DOCX not uploaded'}
                                </p>
                            </div>
                        </button>
                    );
                })
            ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center text-center p-6">
                    <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-border/80 bg-muted shadow-2xs">
                        <Layers className="size-4.5 text-muted-foreground" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">No masters found</p>
                    <p className="mt-0.5 max-w-[200px] text-xs text-muted-foreground">Try adjusting your filters or search term.</p>
                </div>
            )}
        </div>
    </div>
);
