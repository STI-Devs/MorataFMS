import { useDeferredValue, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CurrentDateTime } from '../../../../components/CurrentDateTime';
import {
    useGenerateNotarialTemplateRecord,
    useLegalBooks,
    useLegalCatalog,
    useLegalParties,
    useNotarialTemplates,
} from '../../hooks/useLegalWorkspace';
import type { LegalDocumentCategoryCode } from '../../types/legalRecords.types';

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

    return firstValidationMessage ?? responseData?.message ?? 'Unable to generate the notarial template.';
};

export const LegalDocumentsPage = () => {
    const [templateSearch, setTemplateSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<LegalDocumentCategoryCode | 'all'>('all');
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
    const [partyName, setPartyName] = useState('');
    const [selectedBookId, setSelectedBookId] = useState('');
    const [notes, setNotes] = useState('');
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

    const deferredTemplateSearch = useDeferredValue(templateSearch);
    const deferredPartyName = useDeferredValue(partyName);

    const catalogQuery = useLegalCatalog();
    const templatesQuery = useNotarialTemplates({
        per_page: 100,
        search: deferredTemplateSearch.trim() || undefined,
    });
    const booksQuery = useLegalBooks({ per_page: 100 });
    const legalPartiesQuery = useLegalParties(deferredPartyName.trim());
    const generateRecord = useGenerateNotarialTemplateRecord();

    const templates = useMemo(
        () =>
            [...(templatesQuery.data?.data ?? [])].sort((left, right) => {
                if (left.template_status === 'ready' && right.template_status !== 'ready') {
                    return -1;
                }

                if (left.template_status !== 'ready' && right.template_status === 'ready') {
                    return 1;
                }

                return left.label.localeCompare(right.label);
            }),
        [templatesQuery.data?.data],
    );

    const books = useMemo(
        () =>
            [...(booksQuery.data?.data ?? [])].sort((left, right) => {
                if (left.year !== right.year) {
                    return right.year - left.year;
                }

                return right.book_number - left.book_number;
            }),
        [booksQuery.data?.data],
    );

    const legalPartySuggestions = useMemo(
        () => legalPartiesQuery.data ?? [],
        [legalPartiesQuery.data],
    );

    const categoryFilters = useMemo(
        () =>
            (catalogQuery.data?.categories ?? [])
                .map((category) => ({
                    ...category,
                    count: templates.filter((template) => template.document_category === category.code).length,
                }))
                .filter((category) => category.count > 0),
        [catalogQuery.data?.categories, templates],
    );

    const filteredTemplates = useMemo(
        () =>
            selectedCategory === 'all'
                ? templates
                : templates.filter((template) => template.document_category === selectedCategory),
        [selectedCategory, templates],
    );

    const selectedTemplate =
        filteredTemplates.find((template) => template.id === selectedTemplateId) ?? filteredTemplates[0] ?? null;

    const activeFieldValues = useMemo(() => {
        if (!selectedTemplate) {
            return {} as Record<string, string>;
        }

        return Object.fromEntries(
            selectedTemplate.field_schema.map((field) => [field.name, fieldValues[field.name] ?? '']),
        );
    }, [fieldValues, selectedTemplate]);

    const handleCategorySelection = (category: LegalDocumentCategoryCode | 'all') => {
        setSelectedCategory(category);
        setSelectedTemplateId(null);
        setFieldValues({});
    };

    const handleTemplateSelection = (templateId: number) => {
        setSelectedTemplateId(templateId);
        setFieldValues({});
    };

    const handleGenerateDocument = async () => {
        if (!selectedTemplate) {
            return;
        }

        try {
            await generateRecord.mutateAsync({
                notarial_template_id: selectedTemplate.id,
                notarial_book_id: selectedBookId ? Number(selectedBookId) : undefined,
                party_name: partyName.trim(),
                notes: notes.trim() || undefined,
                template_data: activeFieldValues,
            });

            toast.success('Word document generated.');
            setPartyName('');
            setSelectedBookId('');
            setNotes('');
            setFieldValues({});
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    return (
        <div className="w-full space-y-6 p-8 pb-12">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-text-primary">Template Generator</h1>
                    <p className="mt-2 max-w-3xl text-sm text-text-muted">
                        Choose a notarial template, fill the required fields, and generate a ready-to-edit Word document.
                    </p>
                </div>
                <CurrentDateTime
                    className="shrink-0 text-right"
                    timeClassName="text-2xl font-bold tabular-nums text-text-primary"
                    dateClassName="text-sm text-text-muted"
                />
            </div>

            <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
                <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Notarial Selector</p>
                                <p className="mt-1 text-sm text-text-muted">Pick the template to generate.</p>
                            </div>
                            <div className="rounded-full border border-border bg-surface-secondary/40 px-2.5 py-1 text-[11px] font-semibold text-text-muted">
                                {filteredTemplates.length} shown
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => handleCategorySelection('all')}
                                className={[
                                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                                    selectedCategory === 'all'
                                        ? 'border-black bg-black text-white'
                                        : 'border-border bg-surface text-text-primary hover:bg-surface-secondary/30',
                                ].join(' ')}
                            >
                                All <span className="ml-1 text-[11px] opacity-75">{templates.length}</span>
                            </button>
                            {categoryFilters.map((category) => (
                                <button
                                    key={category.code}
                                    type="button"
                                    onClick={() => handleCategorySelection(category.code)}
                                    className={[
                                        'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                                        selectedCategory === category.code
                                            ? 'border-black bg-black text-white'
                                            : 'border-border bg-surface text-text-primary hover:bg-surface-secondary/30',
                                    ].join(' ')}
                                >
                                    {category.label} <span className="ml-1 text-[11px] opacity-75">{category.count}</span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-4">
                            <input
                                id="template-search"
                                value={templateSearch}
                                onChange={(event) => setTemplateSearch(event.target.value)}
                                placeholder="Search template..."
                                className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-black/10"
                            />
                        </div>
                    </div>

                    <div className="max-h-[calc(100vh-360px)] min-h-[360px] overflow-y-auto p-3">
                        {filteredTemplates.length > 0 ? (
                            <div className="space-y-1.5">
                                {filteredTemplates.map((template) => (
                                    <button
                                        key={template.id}
                                        type="button"
                                        onClick={() => handleTemplateSelection(template.id)}
                                        className={[
                                            'flex w-full items-start justify-between rounded-xl border px-3.5 py-3 text-left transition-colors',
                                            selectedTemplate?.id === template.id
                                                ? 'border-emerald-400/40 bg-emerald-500/10 shadow-sm'
                                                : 'border-transparent bg-surface hover:border-border hover:bg-surface-secondary/20',
                                        ].join(' ')}
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-text-primary">{template.label}</p>
                                            <p className="mt-1 text-xs text-text-muted">{template.document_code_label ?? template.document_code}</p>
                                        </div>
                                        <span
                                            className={[
                                                'ml-3 rounded-full px-2 py-0.5 text-[10px] font-bold',
                                                template.template_status === 'ready'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-amber-100 text-amber-700',
                                            ].join(' ')}
                                        >
                                            {template.template_status === 'ready' ? 'Ready' : 'Missing'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
                                <p className="text-sm font-semibold text-text-primary">No templates found</p>
                                <p className="mt-2 text-sm text-text-muted">Try another category or search term.</p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Fill-Up Form</p>
                        <h2 className="mt-1.5 text-xl font-bold tracking-tight text-text-primary">
                            {selectedTemplate?.label ?? 'Select a template'}
                        </h2>
                        <p className="mt-1 text-sm text-text-muted">
                            Enter the details that will be merged into the Word template.
                        </p>
                    </div>

                    {selectedTemplate ? (
                        <div className="grid gap-4 p-5 md:grid-cols-2">
                            <div className="rounded-xl border border-border bg-surface-secondary/20 p-4 md:col-span-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-text-primary">
                                        {selectedTemplate.document_code_label ?? selectedTemplate.document_code}
                                    </span>
                                    <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-text-primary">
                                        {selectedTemplate.default_notarial_act_type_label ?? selectedTemplate.default_notarial_act_type}
                                    </span>
                                    <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-text-primary">
                                        {selectedTemplate.field_schema.length} fields
                                    </span>
                                </div>
                                {selectedTemplate.source_file ? (
                                    <a
                                        href={selectedTemplate.source_file.download_url}
                                        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface"
                                    >
                                        Download Master DOCX
                                    </a>
                                ) : (
                                    <p className="mt-3 text-sm font-medium text-amber-700">Master DOCX is not uploaded yet.</p>
                                )}
                            </div>

                            <label className="space-y-1.5">
                                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Party Name</span>
                                <input
                                    id="generated-party-name"
                                    list="notarial-party-suggestions"
                                    value={partyName}
                                    onChange={(event) => setPartyName(event.target.value)}
                                    placeholder="Enter client or requesting party"
                                    className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                                />
                                <datalist id="notarial-party-suggestions">
                                    {legalPartySuggestions.map((legalParty) => (
                                        <option key={legalParty.id} value={legalParty.name} />
                                    ))}
                                </datalist>
                            </label>

                            <label className="space-y-1.5">
                                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Book Archive Link</span>
                                <select
                                    id="generated-book-id"
                                    value={selectedBookId}
                                    onChange={(event) => setSelectedBookId(event.target.value)}
                                    className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                                >
                                    <option value="">No linked book</option>
                                    {books.map((book) => (
                                        <option key={book.id} value={book.id}>
                                            {`Book ${book.book_number} • ${book.year}`}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {selectedTemplate.field_schema.map((field) => (
                                <label key={field.name} className={`space-y-1.5 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                                        {field.label}
                                        {field.required ? ' *' : ''}
                                    </span>
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            id={`template-field-${field.name}`}
                                            rows={4}
                                            value={activeFieldValues[field.name] ?? ''}
                                            onChange={(event) => setFieldValues((current) => ({
                                                ...current,
                                                [field.name]: event.target.value,
                                            }))}
                                            placeholder={field.placeholder ?? undefined}
                                            className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                                        />
                                    ) : field.type === 'select' ? (
                                        <select
                                            id={`template-field-${field.name}`}
                                            value={activeFieldValues[field.name] ?? ''}
                                            onChange={(event) => setFieldValues((current) => ({
                                                ...current,
                                                [field.name]: event.target.value,
                                            }))}
                                            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                                        >
                                            <option value="">Select option</option>
                                            {(field.options ?? []).map((option) => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            id={`template-field-${field.name}`}
                                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text'}
                                            value={activeFieldValues[field.name] ?? ''}
                                            onChange={(event) => setFieldValues((current) => ({
                                                ...current,
                                                [field.name]: event.target.value,
                                            }))}
                                            placeholder={field.placeholder ?? undefined}
                                            className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                                        />
                                    )}
                                    {field.help_text ? (
                                        <p className="text-xs text-text-muted">{field.help_text}</p>
                                    ) : null}
                                </label>
                            ))}

                            <label className="space-y-1.5 md:col-span-2">
                                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Internal Notes</span>
                                <textarea
                                    id="generated-notes"
                                    rows={3}
                                    value={notes}
                                    onChange={(event) => setNotes(event.target.value)}
                                    placeholder="Optional note for this generated document."
                                    className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                                />
                            </label>
                        </div>
                    ) : (
                        <div className="flex min-h-96 flex-col items-center justify-center px-6 text-center">
                            <p className="text-base font-semibold text-text-primary">No template selected</p>
                            <p className="mt-2 max-w-md text-sm text-text-muted">
                                Choose a template from the selector to start.
                            </p>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-3 border-t border-border bg-surface-secondary/20 px-5 py-4">
                        <p className="text-xs text-text-muted">
                            {selectedTemplate?.source_file
                                ? 'Generated output is saved in Notarial Records.'
                                : 'Upload the master DOCX before generating.'}
                        </p>
                        <button
                            type="button"
                            id="generate-template-record"
                            onClick={() => void handleGenerateDocument()}
                            disabled={!selectedTemplate || selectedTemplate.template_status !== 'ready' || generateRecord.isPending}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Generate Word Document
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};
