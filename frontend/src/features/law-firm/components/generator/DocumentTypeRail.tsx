import type { LegalDocumentCategoryCode, NotarialTemplate } from '../../types/legalRecords.types';

type CategoryFilter = { code: LegalDocumentCategoryCode; label: string; count: number };

type Props = {
    search: string;
    onSearchChange: (v: string) => void;
    categoryFilters: CategoryFilter[];
    selectedCategory: LegalDocumentCategoryCode | 'all';
    onCategorySelect: (cat: LegalDocumentCategoryCode | 'all') => void;
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
        <div className="border-b border-neutral-100 bg-white/50 px-8 py-6 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Master Library</p>
                    <h2 className="text-[17px] font-semibold tracking-tight text-neutral-900">Choose a master</h2>
                </div>
                <span className="inline-flex h-7 items-center justify-center rounded-full bg-neutral-100 px-3 text-[12px] font-semibold text-neutral-600">
                    {templates.length} visible
                </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => onCategorySelect('all')}
                    className={[
                        'rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-neutral-900/20',
                        selectedCategory === 'all'
                            ? 'bg-neutral-900 text-white shadow-sm'
                            : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
                    ].join(' ')}
                >
                    All <span className={`ml-1.5 ${selectedCategory === 'all' ? 'text-white/70' : 'text-neutral-400'}`}>{totalCount}</span>
                </button>
                {categoryFilters.map((cat) => (
                    <button
                        key={cat.code}
                        type="button"
                        onClick={() => onCategorySelect(cat.code)}
                        className={[
                            'rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all focus:outline-none focus:ring-2 focus:ring-neutral-900/20',
                            selectedCategory === cat.code
                                ? 'bg-neutral-900 text-white shadow-sm'
                                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
                        ].join(' ')}
                    >
                        {cat.label} <span className={`ml-1.5 ${selectedCategory === cat.code ? 'text-white/70' : 'text-neutral-400'}`}>{cat.count}</span>
                    </button>
                ))}
            </div>

            <div className="mt-5 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    id="master-search"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search masters by document or variant..."
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 py-2.5 pl-10 pr-4 text-[13px] font-medium text-neutral-900 placeholder:font-normal placeholder:text-neutral-400 transition-colors hover:bg-neutral-50 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#FAFAFA]/50 p-4 min-h-[420px] max-h-[calc(100vh-330px)]">
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
                                    'group flex w-full flex-col items-start rounded-2xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-neutral-900/20',
                                    isSelected
                                        ? 'border-neutral-900 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.06)] ring-1 ring-neutral-900'
                                        : !isReady
                                        ? 'cursor-not-allowed border-neutral-200/50 bg-neutral-50/30 opacity-60'
                                        : 'border-neutral-200/60 bg-white hover:border-neutral-300 hover:shadow-sm',
                                ].join(' ')}
                            >
                                <div className="flex w-full items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className={`truncate text-[14px] font-semibold ${isSelected ? 'text-neutral-900' : 'text-neutral-800'}`}>
                                            {title}
                                        </p>
                                        <p className="mt-1 text-[12px] text-neutral-500">{subtitle}</p>
                                    </div>
                                    <span
                                        className={[
                                            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase',
                                            isReady
                                                ? isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-50 text-emerald-600'
                                                : 'bg-amber-50 text-amber-600',
                                        ].join(' ')}
                                    >
                                        {isReady ? 'Ready' : 'Missing'}
                                    </span>
                                </div>
                                <div className="mt-3 flex items-center gap-1.5 border-t border-neutral-100 pt-3 w-full">
                                    <svg className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-neutral-500' : 'text-neutral-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p className={`truncate text-[11px] font-medium ${isSelected ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                        {tpl.source_file?.filename ?? 'Source DOCX not uploaded'}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center text-center px-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-200/60">
                        <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <p className="text-[14px] font-medium text-neutral-900">No masters found</p>
                    <p className="mt-1 max-w-[200px] text-[12px] text-neutral-500">Try adjusting your filters or search term.</p>
                </div>
            )}
        </div>
    </div>
);
