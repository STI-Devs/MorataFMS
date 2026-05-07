import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { DocumentGeneratorPage } from './DocumentGeneratorPage';

const { mockUseDocumentGenerator } = vi.hoisted(() => ({
    mockUseDocumentGenerator: vi.fn(),
}));

vi.mock('../../../../components/CurrentDateTime', () => ({
    CurrentDateTime: () => <div data-testid="current-date-time" />,
}));

vi.mock('../../hooks/useDocumentGenerator', () => ({
    useDocumentGenerator: mockUseDocumentGenerator,
}));

vi.mock('../generator/DocumentTypeRail', () => ({
    DocumentTypeRail: () => <div data-testid="document-type-rail" />,
}));

vi.mock('../generator/PartyCombobox', () => ({
    PartyCombobox: () => <div data-testid="party-combobox" />,
}));

describe('DocumentGeneratorPage', () => {
    beforeEach(() => {
        mockUseDocumentGenerator.mockReturnValue({
            templateSearch: '',
            setTemplateSearch: vi.fn(),
            selectedCategory: 'all',
            handleCategorySelect: vi.fn(),
            filteredTemplates: [],
            selectedTemplate: {
                id: 12,
                code: 'affidavit_loss-tin',
                label: 'Affidavit of Loss - TIN',
                document_code: 'AFFIDAVIT_LOSS',
                document_code_label: 'Affidavit of Loss',
                document_category: 'affidavit_oath',
                document_category_label: 'Affidavits / Oaths',
                description: 'Template for national ID replacements.',
                is_active: true,
                template_status: 'ready',
                source_file: {
                    filename: 'affidavit-of-loss-tin.docx',
                    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    size_bytes: 1024,
                    formatted_size: '1 KB',
                    download_url: 'https://example.test/master.docx',
                },
                created_at: null,
                updated_at: null,
            },
            handleTemplateSelect: vi.fn(),
            categoryFilters: [],
            partySearch: '',
            setPartySearch: vi.fn(),
            partySuggestions: [],
            selectedParty: null,
            handlePartySelect: vi.fn(),
            notes: '',
            setNotes: vi.fn(),
            canGenerate: true,
            isPending: false,
            generateSuccess: false,
            setGenerateSuccess: vi.fn(),
            readyTemplateCount: 4,
            generatedDocumentCount: 9,
            totalTemplateCount: 7,
            handleGenerate: vi.fn(),
        });
    });

    it('keeps the draft workflow focused on masters, variants, and generated documents', () => {
        renderWithProviders(<DocumentGeneratorPage />);

        expect(screen.getByRole('heading', { name: 'Create Draft' })).toBeInTheDocument();
        expect(screen.getByText('Generated Documents')).toBeInTheDocument();
        expect(screen.getByText('Variant')).toBeInTheDocument();
        expect(screen.queryByText('Book Reference Link')).not.toBeInTheDocument();
        expect(screen.queryByText('Notarial Act')).not.toBeInTheDocument();
        expect(screen.queryByText('Primary master')).not.toBeInTheDocument();
        expect(screen.getAllByText('TIN')).toHaveLength(2);
        expect(screen.getByRole('button', { name: 'Open in Editor' })).toBeEnabled();
    });
});
