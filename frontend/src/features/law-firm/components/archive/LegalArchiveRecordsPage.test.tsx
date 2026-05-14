import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { LegalArchiveRecordsPage } from './LegalArchiveRecordsPage';

const { mockGeneratedDocumentsPage } = vi.hoisted(() => ({
    mockGeneratedDocumentsPage: vi.fn(({ module }: { module?: string }) => (
        <div data-testid="generated-documents-page">module:{module}</div>
    )),
}));

vi.mock('../records/NotarialGeneratedDocumentsPage', () => ({
    NotarialGeneratedDocumentsPage: mockGeneratedDocumentsPage,
}));

describe('LegalArchiveRecordsPage', () => {
    it('uses the generated Word documents page in legal mode', () => {
        renderWithProviders(<LegalArchiveRecordsPage />, {
            route: appRoutes.paralegalLegalFileRecords,
            path: appRoutes.paralegalLegalFileRecords,
        });

        expect(screen.getByTestId('generated-documents-page')).toHaveTextContent('module:legal');
    });
});
