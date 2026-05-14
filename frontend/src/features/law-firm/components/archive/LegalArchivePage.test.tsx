import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { LegalArchivePage } from './LegalArchivePage';

const { mockDocumentGeneratorPage } = vi.hoisted(() => ({
    mockDocumentGeneratorPage: vi.fn(({ module }: { module?: string }) => (
        <div data-testid="document-generator-page">module:{module}</div>
    )),
}));

vi.mock('../records/DocumentGeneratorPage', () => ({
    DocumentGeneratorPage: mockDocumentGeneratorPage,
}));

describe('LegalArchivePage', () => {
    it('uses the Word draft generator in legal mode', () => {
        renderWithProviders(<LegalArchivePage />, {
            route: appRoutes.paralegalLegalFiles,
            path: appRoutes.paralegalLegalFiles,
        });

        expect(screen.getByTestId('document-generator-page')).toHaveTextContent('module:legal');
    });
});
