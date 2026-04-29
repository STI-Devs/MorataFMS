import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CurrentDateTime } from '../../../../components/CurrentDateTime';
import { useAuth } from '../../../auth';
import {
    useCreateNotarialTemplate,
    useLegalBooks,
    useLegalCatalog,
    useNotarialTemplateRecords,
    useNotarialTemplates,
} from '../../hooks/useLegalWorkspace';
import type {
    NotarialActTypeCode,
    NotarialTemplateFieldDefinition,
    NotarialTemplateFieldTypeCode,
} from '../../types/legalRecords.types';

type DraftTemplateField = {
    name: string;
    label: string;
    type: NotarialTemplateFieldTypeCode;
    required: boolean;
    placeholder: string;
    help_text: string;
    options_text: string;
};

const emptyDraftField = (): DraftTemplateField => ({
    name: '',
    label: '',
    type: 'text',
    required: true,
    placeholder: '',
    help_text: '',
    options_text: '',
});

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

    return firstValidationMessage ?? responseData?.message ?? 'Unable to save the template.';
};

const normalizeDraftField = (field: DraftTemplateField): NotarialTemplateFieldDefinition => ({
    name: field.name.trim(),
    label: field.label.trim(),
    type: field.type,
    required: field.required,
    placeholder: field.placeholder.trim() || undefined,
    help_text: field.help_text.trim() || undefined,
    options: field.type === 'select'
        ? field.options_text
            .split(',')
            .map((option) => option.trim())
            .filter(Boolean)
        : undefined,
});

export const NotarialTemplateUploadPage = () => {
    const { user } = useAuth();
    const canManageTemplates = Boolean(user?.permissions.manage_notarial_templates);

    const [draftCode, setDraftCode] = useState('');
    const [draftLabel, setDraftLabel] = useState('');
    const [draftDocumentCode, setDraftDocumentCode] = useState('');
    const [draftDescription, setDraftDescription] = useState('');
    const [draftNotarialActType, setDraftNotarialActType] = useState<NotarialActTypeCode | ''>('');
    const [draftFile, setDraftFile] = useState<File | null>(null);
    const [draftFields, setDraftFields] = useState<DraftTemplateField[]>([emptyDraftField()]);

    const catalogQuery = useLegalCatalog();
    const templatesQuery = useNotarialTemplates({ per_page: 100 });
    const templateRecordsQuery = useNotarialTemplateRecords({ page: 1, per_page: 1 });
    const booksQuery = useLegalBooks({ per_page: 100 });
    const createTemplate = useCreateNotarialTemplate();

    const templates = useMemo(
        () => templatesQuery.data?.data ?? [],
        [templatesQuery.data?.data],
    );
    const documentTypes = catalogQuery.data?.document_types ?? [];
    const notarialActTypes = catalogQuery.data?.notarial_act_types ?? [];
    const fieldTypeOptions = catalogQuery.data?.template_field_types ?? [];
    const readyTemplateCount = templates.filter((template) => template.template_status === 'ready').length;
    const missingTemplateCount = templates.filter((template) => template.template_status === 'missing_file').length;
    const generatedRecords = templateRecordsQuery.data?.meta.total ?? 0;
    const bookCount = booksQuery.data?.data?.length ?? 0;

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

    const handleDraftFieldChange = (
        index: number,
        key: keyof DraftTemplateField,
        value: string | boolean,
    ) => {
        setDraftFields((currentFields) =>
            currentFields.map((field, fieldIndex) =>
                fieldIndex === index
                    ? {
                        ...field,
                        [key]: value,
                    }
                    : field,
            ),
        );
    };

    const handleCreateTemplate = async () => {
        try {
            await createTemplate.mutateAsync({
                code: draftCode.trim(),
                label: draftLabel.trim(),
                document_code: draftDocumentCode,
                default_notarial_act_type: draftNotarialActType || undefined,
                description: draftDescription.trim() || undefined,
                field_schema: draftFields.map(normalizeDraftField),
                is_active: true,
                file: draftFile,
            });

            toast.success('Master template saved.');
            setDraftCode('');
            setDraftLabel('');
            setDraftDocumentCode('');
            setDraftDescription('');
            setDraftNotarialActType('');
            setDraftFile(null);
            setDraftFields([emptyDraftField()]);
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    if (!canManageTemplates) {
        return (
            <div className="flex min-h-full items-center justify-center p-8">
                <div className="max-w-md rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
                    <p className="text-sm font-semibold text-text-primary">Template upload is restricted</p>
                    <p className="mt-2 text-sm text-text-muted">Ask an authorized legal user to upload or update master Word templates.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 p-8 pb-12">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-text-primary">Template Upload</h1>
                    <p className="mt-2 max-w-3xl text-sm text-text-muted">
                        Upload master DOCX files and define the fill-up fields used by the generator.
                    </p>
                </div>
                <CurrentDateTime
                    className="shrink-0 text-right"
                    timeClassName="text-2xl font-bold tabular-nums text-text-primary"
                    dateClassName="text-sm text-text-muted"
                />
            </div>

            <div className="grid gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Ready</p>
                    <p className="mt-1.5 text-xl font-bold tracking-tight text-text-primary">{readyTemplateCount}</p>
                    <p className="mt-1 text-sm text-text-muted">Templates with DOCX files.</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Missing</p>
                    <p className="mt-1.5 text-xl font-bold tracking-tight text-text-primary">{missingTemplateCount}</p>
                    <p className="mt-1 text-sm text-text-muted">Templates still waiting for files.</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Generated</p>
                    <p className="mt-1.5 text-xl font-bold tracking-tight text-text-primary">{generatedRecords}</p>
                    <p className="mt-1 text-sm text-text-muted">Outputs already created.</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Books</p>
                    <p className="mt-1.5 text-xl font-bold tracking-tight text-text-primary">{bookCount}</p>
                    <p className="mt-1 text-sm text-text-muted">Archived books available.</p>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Master Template</p>
                        <h2 className="mt-1.5 text-xl font-bold tracking-tight text-text-primary">Upload Word Template</h2>
                        <p className="mt-1 text-sm text-text-muted">Save the source file and the fields the staff will fill in.</p>
                    </div>

                    <div className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-1.5">
                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Template Code</span>
                                    <input
                                        id="template-code"
                                        value={draftCode}
                                        onChange={(event) => setDraftCode(event.target.value)}
                                        placeholder="affidavit-loss-standard"
                                        className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                                    />
                                </label>

                                <label className="space-y-1.5">
                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Template Label</span>
                                    <input
                                        id="template-label"
                                        value={draftLabel}
                                        onChange={(event) => setDraftLabel(event.target.value)}
                                        placeholder="Affidavit of Loss"
                                        className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                                    />
                                </label>

                                <label className="space-y-1.5">
                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Document Type</span>
                                    <select
                                        id="template-document-code"
                                        value={draftDocumentCode}
                                        onChange={(event) => setDraftDocumentCode(event.target.value)}
                                        className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                                    >
                                        <option value="">Select document type</option>
                                        {documentTypes.map((documentType) => (
                                            <option key={documentType.code} value={documentType.code}>
                                                {documentType.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="space-y-1.5">
                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Default Act</span>
                                    <select
                                        id="template-notarial-act"
                                        value={draftNotarialActType}
                                        onChange={(event) => setDraftNotarialActType(event.target.value as NotarialActTypeCode | '')}
                                        className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                                    >
                                        <option value="">Use catalog default</option>
                                        {notarialActTypes.map((actType) => (
                                            <option key={actType.code} value={actType.code}>
                                                {actType.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <label className="space-y-1.5">
                                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Description</span>
                                <textarea
                                    id="template-description"
                                    value={draftDescription}
                                    onChange={(event) => setDraftDescription(event.target.value)}
                                    rows={3}
                                    placeholder="Short internal note for this template."
                                    className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                                />
                            </label>

                            <div className="space-y-3 rounded-2xl border border-border p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary">Fill-Up Fields</p>
                                        <p className="mt-1 text-sm text-text-muted">Match these names with the Word placeholders.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setDraftFields((current) => [...current, emptyDraftField()])}
                                        className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-secondary/20"
                                    >
                                        Add Field
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {draftFields.map((field, index) => (
                                        <div key={`${field.name}-${index}`} className="rounded-xl border border-border p-3">
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <label className="space-y-1.5">
                                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Placeholder</span>
                                                    <input
                                                        value={field.name}
                                                        onChange={(event) => handleDraftFieldChange(index, 'name', event.target.value)}
                                                        placeholder="party_name"
                                                        className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                                                    />
                                                </label>
                                                <label className="space-y-1.5">
                                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Label</span>
                                                    <input
                                                        value={field.label}
                                                        onChange={(event) => handleDraftFieldChange(index, 'label', event.target.value)}
                                                        placeholder="Party Name"
                                                        className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                                                    />
                                                </label>
                                                <label className="space-y-1.5">
                                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Type</span>
                                                    <select
                                                        value={field.type}
                                                        onChange={(event) => handleDraftFieldChange(index, 'type', event.target.value as NotarialTemplateFieldTypeCode)}
                                                        className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                                                    >
                                                        {fieldTypeOptions.map((fieldType) => (
                                                            <option key={fieldType.code} value={fieldType.code}>
                                                                {fieldType.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className="space-y-1.5">
                                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Placeholder Hint</span>
                                                    <input
                                                        value={field.placeholder}
                                                        onChange={(event) => handleDraftFieldChange(index, 'placeholder', event.target.value)}
                                                        placeholder="Enter party name"
                                                        className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                                                    />
                                                </label>
                                            </div>

                                            <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                                                <label className="space-y-1.5">
                                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Help Text</span>
                                                    <input
                                                        value={field.help_text}
                                                        onChange={(event) => handleDraftFieldChange(index, 'help_text', event.target.value)}
                                                        placeholder="Short prompt for staff"
                                                        className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                                                    />
                                                </label>
                                                <label className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-text-primary">
                                                    <input
                                                        type="checkbox"
                                                        checked={field.required}
                                                        onChange={(event) => handleDraftFieldChange(index, 'required', event.target.checked)}
                                                    />
                                                    Required
                                                </label>
                                            </div>

                                            {field.type === 'select' ? (
                                                <label className="mt-3 block space-y-1.5">
                                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">Options</span>
                                                    <input
                                                        value={field.options_text}
                                                        onChange={(event) => handleDraftFieldChange(index, 'options_text', event.target.value)}
                                                        placeholder="Single, Married, Widowed"
                                                        className="w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-black/10"
                                                    />
                                                </label>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 rounded-2xl border border-border bg-surface-secondary/20 p-4">
                            <div>
                                <p className="text-sm font-semibold text-text-primary">Master Word File</p>
                                <p className="mt-1 text-sm text-text-muted">Upload the source DOCX for this template.</p>
                            </div>

                            <input
                                id="template-file"
                                type="file"
                                accept=".docx"
                                onChange={(event) => setDraftFile(event.target.files?.[0] ?? null)}
                                className="block w-full text-sm text-text-primary file:mr-4 file:rounded-lg file:border-0 file:bg-surface file:px-3 file:py-2 file:text-sm file:font-semibold"
                            />

                            <button
                                type="button"
                                id="template-save"
                                onClick={() => void handleCreateTemplate()}
                                disabled={createTemplate.isPending}
                                className="inline-flex w-full items-center justify-center rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Save Template
                            </button>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Template List</p>
                        <h2 className="mt-1.5 text-xl font-bold tracking-tight text-text-primary">Current Masters</h2>
                    </div>
                    <div className="max-h-[720px] overflow-y-auto p-3">
                        {sortedTemplates.length > 0 ? (
                            <div className="space-y-2">
                                {sortedTemplates.map((template) => (
                                    <div key={template.id} className="rounded-xl border border-border bg-surface px-3.5 py-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-text-primary">{template.label}</p>
                                                <p className="mt-1 text-xs text-text-muted">{template.document_code_label ?? template.document_code}</p>
                                            </div>
                                            <span
                                                className={[
                                                    'rounded-full px-2 py-0.5 text-[10px] font-bold',
                                                    template.template_status === 'ready'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-amber-100 text-amber-700',
                                                ].join(' ')}
                                            >
                                                {template.template_status === 'ready' ? 'Ready' : 'Missing'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex min-h-48 items-center justify-center px-6 text-center">
                                <p className="text-sm text-text-muted">No master templates yet.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};
