import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArchiveLegacyUploadPage } from './ArchiveLegacyUploadPage';

const trackingApiMock = vi.hoisted(() => ({
    getClients: vi.fn(),
    getCountries: vi.fn(),
    createClient: vi.fn(),
    createArchiveImport: vi.fn(),
    createArchiveExport: vi.fn(),
    uploadDocument: vi.fn(),
}));

vi.mock('../../tracking/api/trackingApi', () => ({
    trackingApi: trackingApiMock,
}));

vi.mock('../../documents/components/StageUploadRow', () => ({
    StageUploadRow: ({
        label,
        onChange,
    }: {
        label: string;
        onChange: (next: { file: File | null }) => void;
    }) => (
        <button
            type="button"
            onClick={() => onChange({
                file: new File(['archive'], `${label}.pdf`, { type: 'application/pdf' }),
            })}
        >
            Attach {label}
        </button>
    ),
}));

describe('ArchiveLegacyUploadPage', () => {
    beforeEach(() => {
        trackingApiMock.getClients.mockReset();
        trackingApiMock.getCountries.mockReset();
        trackingApiMock.createClient.mockReset();
        trackingApiMock.createArchiveImport.mockReset();
        trackingApiMock.createArchiveExport.mockReset();
        trackingApiMock.uploadDocument.mockReset();

        trackingApiMock.getClients.mockResolvedValue([
            { id: 1, name: 'AKTIV MULTI TRADING CORP', type: 'importer' },
        ]);
        trackingApiMock.getCountries.mockResolvedValue([]);
        trackingApiMock.createArchiveImport.mockResolvedValue({ id: 123 });
    });

    it('submits archive documents in the initial archive request', async () => {
        const onSubmit = vi.fn();

        render(
            <ArchiveLegacyUploadPage
                defaultYear={2024}
                onBack={vi.fn()}
                onSubmit={onSubmit}
            />,
        );

        await waitFor(() => {
            expect(trackingApiMock.getClients).toHaveBeenCalledWith('importer');
        });

        fireEvent.change(screen.getByPlaceholderText('e.g. MAEU123456789'), {
            target: { value: 'MAEU123456789' },
        });

        const selects = screen.getAllByRole('combobox');

        fireEvent.change(selects[1], {
            target: { value: '1' },
        });
        fireEvent.click(screen.getByRole('button', { name: /attach boc processing/i }));
        fireEvent.click(screen.getByRole('button', { name: /save 1 file to archive/i }));

        await waitFor(() => {
            expect(trackingApiMock.createArchiveImport).toHaveBeenCalledTimes(1);
        });

        expect(trackingApiMock.createArchiveImport).toHaveBeenCalledWith(
            expect.objectContaining({
                bl_no: 'MAEU123456789',
                importer_id: 1,
                documents: [
                    expect.objectContaining({
                        stage: 'boc',
                        file: expect.any(File),
                    }),
                ],
            }),
        );
        expect(trackingApiMock.uploadDocument).not.toHaveBeenCalled();
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });
});
