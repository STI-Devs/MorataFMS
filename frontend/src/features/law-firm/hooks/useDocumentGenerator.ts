import { useDeferredValue, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { appRoutes } from '../../../lib/appRoutes';
import {
    useCreateEditableNotarialGeneratedDocument,
    useLegalCatalog,
    useLegalParties,
    useNotarialGeneratedDocuments,
    useNotarialTemplates,
} from './useLegalWorkspace';
import type { LegalDocumentCategoryCode, LegalParty } from '../types/legalRecords.types';

const getErrorMessage = (error: unknown): string => {
    const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
        ?.response?.data;
    const first = data?.errors ? Object.values(data.errors).flat()[0] : null;
    return first ?? data?.message ?? 'Unable to prepare the draft.';
};

export const useDocumentGenerator = () => {
    const navigate = useNavigate();
    const [templateSearch, setTemplateSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<LegalDocumentCategoryCode | 'all'>('all');
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

    const [partySearch, setPartySearch] = useState('');
    const [selectedParty, setSelectedParty] = useState<LegalParty | null>(null);

    const [notes, setNotes] = useState('');
    const [generateSuccess, setGenerateSuccess] = useState(false);

    const deferredSearch = useDeferredValue(templateSearch);
    const deferredPartySearch = useDeferredValue(partySearch);

    const catalogQuery = useLegalCatalog();
    const templatesQuery = useNotarialTemplates({ per_page: 100, search: deferredSearch.trim() || undefined, is_active: true });
    const readyTemplatesQuery = useNotarialTemplates({ template_status: 'ready', is_active: true, page: 1, per_page: 1 });
    const libraryTemplatesQuery = useNotarialTemplates({ is_active: true, page: 1, per_page: 1 });
    const generatedDocumentsQuery = useNotarialGeneratedDocuments({ page: 1, per_page: 1 });
    const partiesQuery = useLegalParties(deferredPartySearch.trim());
    const createEditableRecord = useCreateEditableNotarialGeneratedDocument();

    const templates = useMemo(
        () =>
            [...(templatesQuery.data?.data ?? [])].sort((a, b) => {
                if (a.template_status === 'ready' && b.template_status !== 'ready') return -1;
                if (a.template_status !== 'ready' && b.template_status === 'ready') return 1;
                return a.label.localeCompare(b.label);
            }),
        [templatesQuery.data?.data],
    );

    const partySuggestions = useMemo(() => partiesQuery.data ?? [], [partiesQuery.data]);

    const categoryFilters = useMemo(
        () =>
            (catalogQuery.data?.categories ?? [])
                .map((cat) => ({ ...cat, count: templates.filter((t) => t.document_category === cat.code).length }))
                .filter((cat) => cat.count > 0),
        [catalogQuery.data?.categories, templates],
    );

    const filteredTemplates = useMemo(
        () => (selectedCategory === 'all' ? templates : templates.filter((t) => t.document_category === selectedCategory)),
        [selectedCategory, templates],
    );

    const selectedTemplate = filteredTemplates.find((t) => t.id === selectedTemplateId) ?? null;
    const readyTemplateCount = readyTemplatesQuery.data?.meta.total ?? 0;
    const generatedDocumentCount = generatedDocumentsQuery.data?.meta.total ?? 0;
    const totalTemplateCount = libraryTemplatesQuery.data?.meta.total ?? 0;

    const handleCategorySelect = (cat: LegalDocumentCategoryCode | 'all') => {
        setSelectedCategory(cat);
        setSelectedTemplateId(null);
        setGenerateSuccess(false);
    };

    const handleTemplateSelect = (id: number) => {
        setSelectedTemplateId(id);
        setGenerateSuccess(false);
    };

    const handlePartySelect = (party: LegalParty) => {
        setSelectedParty(party);
        setPartySearch(party.name);
    };

    const handlePartySearchChange = (value: string) => {
        setPartySearch(value);

        if (selectedParty && value.trim() !== selectedParty.name) {
            setSelectedParty(null);
        }
    };

    const handleGenerate = async () => {
        if (!selectedTemplate) return;

        const partyName = selectedParty?.name ?? partySearch.trim();
        if (!partyName) {
            toast.error('Party name is required.');
            return;
        }

        try {
            const document = await createEditableRecord.mutateAsync({
                notarial_template_id: selectedTemplate.id,
                party_name: partyName,
                party_id: selectedParty?.id,
                notes: notes.trim() || undefined,
            });

            toast.success('Draft created.');
            setPartySearch('');
            setSelectedParty(null);
            setNotes('');
            setGenerateSuccess(true);
            navigate(appRoutes.paralegalGeneratedDocumentEditor.replace(':documentId', String(document.id)));
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    const canGenerate =
        !!selectedTemplate &&
        selectedTemplate.is_active &&
        selectedTemplate.template_status === 'ready' &&
        !createEditableRecord.isPending;

    return {
        templateSearch, setTemplateSearch,
        selectedCategory, handleCategorySelect,
        filteredTemplates, selectedTemplate, handleTemplateSelect,
        categoryFilters,
        partySearch, setPartySearch: handlePartySearchChange, partySuggestions, selectedParty, handlePartySelect,
        notes, setNotes,
        canGenerate, isPending: createEditableRecord.isPending,
        generateSuccess, setGenerateSuccess,
        readyTemplateCount,
        generatedDocumentCount,
        totalTemplateCount,
        handleGenerate,
    };
};
