import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArchiveLegacyUploadPage } from './ArchiveLegacyUploadPage';

const trackingApiMock = vi.hoisted(() => ({
    getClients: vi.fn(),
    getCountries: vi.fn(),
    createClient: vi.fn(),
    createArchiveImport: vi.fn(),
    createArchiveExport: vi.fn(),
    createArchiveImportWithDocuments: vi.fn(),
    createArchiveExportWithDocuments: vi.fn(),
}));

vi.mock('../../tracking/api/trackingApi', () => ({
    trackingApi: trackingApiMock,
}));

vi.mock('../../documents/components/StageUploadRow', () => ({
    StageUploadRow: ({
        label,
        allowNotApplicable,
        onChange,
    }: {
        label: string;
        allowNotApplicable?: boolean;
        onChange: (next: { files: File[]; notApplicable?: boolean }) => void;
    }) => (
        <div>
            <button
                type="button"
                onClick={() => onChange({
                    files: [
                        new File(['archive-a'], `${label}-1.pdf`, { type: 'application/pdf' }),
                        new File(['archive-b'], `${label}-2.pdf`, { type: 'application/pdf' }),
                    ],
                    notApplicable: false,
                })}
            >
                Attach {label}
            </button>
            <button
                type="button"
                onClick={() => onChange({
                    files: Array.from({ length: 11 }, (_, index) => new File(
                        [`archive-${index}`],
                        `${label}-${index + 1}.pdf`,
                        { type: 'application/pdf' },
                    )),
                    notApplicable: false,
                })}
            >
                Attach too many {label}
            </button>
            {allowNotApplicable ? (
                <button
                    type="button"
                    onClick={() => onChange({
                        files: [],
                        notApplicable: true,
                    })}
                >
                    Mark {label} N/A
                </button>
            ) : null}
        </div>
    ),
}));

describe('ArchiveLegacyUploadPage', () => {
    beforeEach(() => {
        trackingApiMock.getClients.mockReset();
        trackingApiMock.getCountries.mockReset();
        trackingApiMock.createClient.mockReset();
        trackingApiMock.createArchiveImport.mockReset();
        trackingApiMock.createArchiveExport.mockReset();
        trackingApiMock.createArchiveImportWithDocuments.mockReset();
        trackingApiMock.createArchiveExportWithDocuments.mockReset();

        trackingApiMock.getClients.mockResolvedValue([
            { id: 1, name: 'AKTIV MULTI TRADING CORP', type: 'importer' },
        ]);
        trackingApiMock.getCountries.mockResolvedValue([]);
        trackingApiMock.createArchiveImportWithDocuments.mockResolvedValue({ id: 123 });
    });

    it('creates the archive, shows a success modal, and opens the uploaded record after confirmation', async () => {
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
        fireEvent.click(screen.getByRole('button', { name: /save 2 files to archive/i }));

        await waitFor(() => {
            expect(trackingApiMock.createArchiveImportWithDocuments).toHaveBeenCalledTimes(1);
        });

        expect(trackingApiMock.createArchiveImportWithDocuments).toHaveBeenCalledWith(
            expect.objectContaining({
                bl_no: 'MAEU123456789',
                importer_id: 1,
                documents: [
                    expect.objectContaining({
                        stage: 'boc',
                        file: expect.any(File),
                    }),
                    expect.objectContaining({
                        stage: 'boc',
                        file: expect.any(File),
                    }),
                ],
            }),
        );
        expect(await screen.findByText('Archive Upload Complete')).toBeInTheDocument();
        expect(screen.getByText('2 files were saved to import archive record MAEU123456789.')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /open uploaded record/i }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith({
                type: 'import',
                transactionId: 123,
                blNo: 'MAEU123456789',
                year: 2024,
                month: 1,
                uploadedCount: 2,
            });
        });
    });

    it('allows archive submissions above 10 total files when no stage exceeds the limit', async () => {
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
        fireEvent.click(screen.getByRole('button', { name: /attach ppa processing/i }));
        fireEvent.click(screen.getByRole('button', { name: /attach do request/i }));
        fireEvent.click(screen.getByRole('button', { name: /attach port charges/i }));
        fireEvent.click(screen.getByRole('button', { name: /attach releasing/i }));
        fireEvent.click(screen.getByRole('button', { name: /attach billing/i }));
        fireEvent.click(screen.getByRole('button', { name: /save 12 files to archive/i }));

        await waitFor(() => {
            expect(trackingApiMock.createArchiveImportWithDocuments).toHaveBeenCalledTimes(1);
        });
        expect(await screen.findByText('Archive Upload Complete')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /open uploaded record/i }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledTimes(1);
        });
    });

    it('prevents archive submissions when a single stage exceeds 10 files', async () => {
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

        fireEvent.click(screen.getByRole('button', { name: /attach too many boc processing/i }));

        expect(screen.getByRole('button', { name: /save 11 files to archive/i })).toBeDisabled();
        expect(trackingApiMock.createArchiveImportWithDocuments).not.toHaveBeenCalled();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('passes optional stages marked as N/A to the archive payload', async () => {
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

        fireEvent.click(screen.getByRole('button', { name: /mark bonds n\/a/i }));
        fireEvent.click(screen.getByRole('button', { name: /attach boc processing/i }));
        fireEvent.click(screen.getByRole('button', { name: /save 2 files to archive/i }));

        await waitFor(() => {
            expect(trackingApiMock.createArchiveImportWithDocuments).toHaveBeenCalledTimes(1);
        });

        expect(trackingApiMock.createArchiveImportWithDocuments).toHaveBeenCalledWith(
            expect.objectContaining({
                not_applicable_stages: ['bonds'],
            }),
        );
        expect(await screen.findByText('Archive Upload Complete')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /open uploaded record/i }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledTimes(1);
        });
    });
});
