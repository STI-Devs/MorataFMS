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
        <div className="border-b border-border bg-surface-elevated/70 px-8 py-6 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">Master Library</p>
                    <h2 className="text-[17px] font-semibold tracking-tight text-text-primary">Choose a master</h2>
                </div>
                <span className="inline-flex h-7 items-center justify-center rounded-full bg-surface-secondary px-3 text-[12px] font-semibold text-text-secondary">
                    {templates.length} visible
                </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => onCategorySelect('all')}
                    className={[
                        'rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-text-primary/20',
                        selectedCategory === 'all'
                            ? 'bg-neutral-900 text-white shadow-sm dark:bg-white dark:text-neutral-950'
                            : 'border border-border bg-surface-elevated text-text-secondary hover:bg-hover hover:text-text-primary',
                    ].join(' ')}
                >
                    All <span className={`ml-1.5 ${selectedCategory === 'all' ? 'text-white/70 dark:text-neutral-950/70' : 'text-text-muted'}`}>{totalCount}</span>
                </button>
                {categoryFilters.map((cat) => (
                    <button
                        key={cat.code}
                        type="button"
                        onClick={() => onCategorySelect(cat.code)}
                        className={[
                            'rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-text-primary/20',
                            selectedCategory === cat.code
                                ? 'bg-neutral-900 text-white shadow-sm dark:bg-white dark:text-neutral-950'
                                : 'border border-border bg-surface-elevated text-text-secondary hover:bg-hover hover:text-text-primary',
                        ].join(' ')}
                    >
                        {cat.label} <span className={`ml-1.5 ${selectedCategory === cat.code ? 'text-white/70 dark:text-neutral-950/70' : 'text-text-muted'}`}>{cat.count}</span>
                    </button>
                ))}
            </div>

            <div className="mt-5 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    id="master-search"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search masters by document or variant..."
                    className="w-full rounded-xl border border-border bg-input-bg py-2.5 pl-10 pr-4 text-[13px] font-medium text-text-primary placeholder:font-normal placeholder:text-text-muted transition-colors hover:bg-hover focus:border-text-primary focus:bg-surface-elevated focus:outline-none focus:ring-1 focus:ring-text-primary"
                />
            </div>
        </div>

        <div className="max-h-[calc(100vh-330px)] min-h-[420px] flex-1 overflow-y-auto bg-surface-secondary p-4">
            {templates.length > 0 ? (
                <div className="space-y-3">
                    {templates.map((tpl) => {
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
                                    'group flex w-full flex-col items-start rounded-2xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-text-primary/20',
                                    isSelected
                                        ? 'border-text-primary bg-surface-elevated shadow-[0_4px_20px_rgb(0,0,0,0.06)] ring-1 ring-text-primary dark:shadow-none'
                                        : !isReady
                                        ? 'cursor-not-allowed border-border bg-surface-secondary opacity-60'
                                        : 'border-border bg-surface-elevated hover:border-border-strong hover:bg-hover hover:shadow-sm dark:hover:shadow-none',
                                ].join(' ')}
                            >
                                <div className="flex w-full items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-[14px] font-semibold text-text-primary">
                                            {title}
                                        </p>
                                        <p className="mt-1 text-[12px] text-text-secondary">{subtitle}</p>
                                    </div>
                                    <span
                                        className={[
                                            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase',
                                            isReady
                                                ? isSelected ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
                                        ].join(' ')}
                                    >
                                        {isReady ? 'Ready' : 'Missing'}
                                    </span>
                                </div>
                                <div className="mt-3 flex w-full items-center gap-1.5 border-t border-border pt-3">
                                    <svg className="h-3.5 w-3.5 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className="truncate text-[11px] font-medium text-text-muted">
                                        {tpl.source_file?.filename ?? 'Source DOCX not uploaded'}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center text-center px-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface-elevated shadow-sm dark:shadow-none">
                        <svg className="h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <p className="text-[14px] font-medium text-text-primary">No masters found</p>
                    <p className="mt-1 max-w-[200px] text-[12px] text-text-secondary">Try adjusting your filters or search term.</p>
                </div>
            )}
        </div>
    </div>
);
