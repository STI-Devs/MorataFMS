import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { appRoutes } from '../../../../lib/appRoutes';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import { LegalFileMasterSetupPage } from './LegalFileMasterSetupPage';

const { mockTemplateUploadPage } = vi.hoisted(() => ({
    mockTemplateUploadPage: vi.fn(({ module }: { module?: string }) => (
        <div data-testid="template-upload-page">module:{module}</div>
    )),
}));

vi.mock('../notarial/NotarialTemplateUploadPage', () => ({
    NotarialTemplateUploadPage: mockTemplateUploadPage,
}));

describe('LegalFileMasterSetupPage', () => {
    it('uses the DOCX document master setup page in legal mode', () => {
        renderWithProviders(<LegalFileMasterSetupPage />, {
            route: appRoutes.paralegalLegalFileMasters,
            path: appRoutes.paralegalLegalFileMasters,
        });

        expect(screen.getByTestId('template-upload-page')).toHaveTextContent('module:legal');
    });
});
