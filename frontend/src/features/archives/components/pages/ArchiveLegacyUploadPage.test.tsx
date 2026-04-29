import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArchiveLegacyUploadPage } from './ArchiveLegacyUploadPage';

const { mockUseAuth, trackingApiMock } = vi.hoisted(() => ({
    mockUseAuth: vi.fn(),
    trackingApiMock: {
        getClients: vi.fn(),
        getCountries: vi.fn(),
        getLocationsOfGoods: vi.fn(),
        createClient: vi.fn(),
        createArchiveImport: vi.fn(),
        createArchiveExport: vi.fn(),
        createArchiveImportWithDocuments: vi.fn(),
        createArchiveExportWithDocuments: vi.fn(),
    },
}));

vi.mock('../../../tracking/api/trackingApi', () => ({
    trackingApi: trackingApiMock,
}));

vi.mock('../../../auth', () => ({
    useAuth: () => mockUseAuth(),
}));

vi.mock('../../../documents/components/StageUploadRow', () => ({
    StageUploadRow: ({
        label,
        allowNotApplicable,
        supportingText,
        onChange,
    }: {
        label: string;
        allowNotApplicable?: boolean;
        supportingText?: string;
        onChange: (next: { files: File[]; notApplicable?: boolean }) => void;
    }) => (
        <div>
            {supportingText ? <p>{supportingText}</p> : null}
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
        mockUseAuth.mockReset();
        trackingApiMock.getClients.mockReset();
        trackingApiMock.getCountries.mockReset();
        trackingApiMock.getLocationsOfGoods.mockReset();
        trackingApiMock.createClient.mockReset();
        trackingApiMock.createArchiveImport.mockReset();
        trackingApiMock.createArchiveExport.mockReset();
        trackingApiMock.createArchiveImportWithDocuments.mockReset();
        trackingApiMock.createArchiveExportWithDocuments.mockReset();

        trackingApiMock.getClients.mockResolvedValue([
            { id: 1, name: 'AKTIV MULTI TRADING CORP', type: 'importer' },
        ]);
        trackingApiMock.getCountries.mockResolvedValue([]);
        trackingApiMock.getLocationsOfGoods.mockResolvedValue([
            { id: 7, name: 'South Harbor Warehouse' },
        ]);
        trackingApiMock.createArchiveImportWithDocuments.mockResolvedValue({ id: 123 });
        mockUseAuth.mockReturnValue({
            user: { role: 'encoder' },
        });
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
        fireEvent.change(screen.getByPlaceholderText('e.g. MV Golden Tide'), {
            target: { value: 'MV Legacy Aurora' },
        });

        const selects = screen.getAllByRole('combobox');

        fireEvent.change(selects[2], {
            target: { value: '1' },
        });
        fireEvent.change(selects[0], {
            target: { value: '7' },
        });
        fireEvent.click(screen.getByRole('button', { name: /mark bonds n\/a/i }));
        fireEvent.click(screen.getByRole('button', { name: /attach boc document processing/i }));
        fireEvent.click(screen.getByRole('button', { name: /save 2 files to archive/i }));

        await waitFor(() => {
            expect(trackingApiMock.createArchiveImportWithDocuments).toHaveBeenCalledTimes(1);
        });

        expect(trackingApiMock.createArchiveImportWithDocuments).toHaveBeenCalledWith(
            expect.objectContaining({
                bl_no: 'MAEU123456789',
                vessel_name: 'MV Legacy Aurora',
                importer_id: 1,
                location_of_goods_id: 7,
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

        fireEvent.change(selects[2], {
            target: { value: '1' },
        });

        fireEvent.click(screen.getByRole('button', { name: /attach boc document processing/i }));
        fireEvent.click(screen.getByRole('button', { name: /mark bonds n\/a/i }));
        fireEvent.click(screen.getByRole('button', { name: /attach payment for ppa charges/i }));
        fireEvent.click(screen.getByRole('button', { name: /attach delivery order request/i }));
        fireEvent.click(screen.getByRole('button', { name: /attach payment for port charges/i }));
        fireEvent.click(screen.getByRole('button', { name: /attach releasing of documents/i }));
        fireEvent.click(screen.getByRole('button', { name: /attach billing and liquidation/i }));
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

        fireEvent.change(selects[2], {
            target: { value: '1' },
        });

        fireEvent.click(screen.getByRole('button', { name: /attach too many boc document processing/i }));

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

        fireEvent.change(selects[2], {
            target: { value: '1' },
        });

        fireEvent.click(screen.getByRole('button', { name: /mark bonds n\/a/i }));
        fireEvent.click(screen.getByRole('button', { name: /attach boc document processing/i }));
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

    it('hides encoder-side N/A controls for processor-owned archive stages', async () => {
        render(
            <ArchiveLegacyUploadPage
                defaultYear={2024}
                onBack={vi.fn()}
                onSubmit={vi.fn()}
            />,
        );

        await waitFor(() => {
            expect(trackingApiMock.getClients).toHaveBeenCalledWith('importer');
        });

        expect(screen.getByRole('button', { name: /mark bonds n\/a/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /mark payment for ppa charges n\/a/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /mark payment for port charges n\/a/i })).not.toBeInTheDocument();
    });

    it('requires encoder-owned optional archive stages to be resolved before save', async () => {
        render(
            <ArchiveLegacyUploadPage
                defaultYear={2024}
                onBack={vi.fn()}
                onSubmit={vi.fn()}
            />,
        );

        await waitFor(() => {
            expect(trackingApiMock.getClients).toHaveBeenCalledWith('importer');
        });

        fireEvent.change(screen.getByPlaceholderText('e.g. MAEU123456789'), {
            target: { value: 'MAEU123456789' },
        });

        const selects = screen.getAllByRole('combobox');

        fireEvent.change(selects[2], {
            target: { value: '1' },
        });
        fireEvent.click(screen.getByRole('button', { name: /attach boc document processing/i }));

        expect(screen.getByText('Before You Save')).toBeInTheDocument();
        expect(screen.getByText('Upload files for BONDS or mark it as N/A before saving the archive.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save 2 files to archive/i })).toBeDisabled();
    });

    it('shows workflow guidance and unmet requirements while the archive draft is incomplete', async () => {
        render(
            <ArchiveLegacyUploadPage
                defaultYear={2024}
                onBack={vi.fn()}
                onSubmit={vi.fn()}
            />,
        );

        await waitFor(() => {
            expect(trackingApiMock.getClients).toHaveBeenCalledWith('importer');
        });

        expect(screen.getAllByText('If unavailable now, this can be completed later by processor.')).toHaveLength(2);
        expect(screen.getByText('If unavailable now, this can be completed later by accounting.')).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText('e.g. MAEU123456789'), {
            target: { value: 'MAEU123456789' },
        });
        fireEvent.click(screen.getByRole('button', { name: /attach releasing of documents/i }));

        expect(screen.getByText('Before You Save')).toBeInTheDocument();
        expect(screen.getByText('Select an importer from the list.')).toBeInTheDocument();
        expect(screen.queryByText('Attach at least one file to save the archive record.')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save 2 files to archive/i })).toBeDisabled();
    });

    it('shows the CIL archive stage description on export records', async () => {
        render(
            <ArchiveLegacyUploadPage
                defaultYear={2024}
                onBack={vi.fn()}
                onSubmit={vi.fn()}
            />,
        );

        await waitFor(() => {
            expect(trackingApiMock.getClients).toHaveBeenCalledWith('importer');
        });

        fireEvent.click(screen.getByRole('button', { name: /export outgoing goods to destination/i }));

        await waitFor(() => {
            expect(trackingApiMock.getClients).toHaveBeenCalledWith('exporter');
        });

        expect(screen.getByText('Certificate of Inspection and Loading for export release. If unavailable now, this can be completed later by processor.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /attach billing and liquidation/i })).toBeInTheDocument();
    });

    it('shows contact-admin guidance instead of manual client entry for import and export', async () => {
        render(
            <ArchiveLegacyUploadPage
                defaultYear={2024}
                onBack={vi.fn()}
                onSubmit={vi.fn()}
            />,
        );

        await waitFor(() => {
            expect(trackingApiMock.getClients).toHaveBeenCalledWith('importer');
        });

        expect(screen.getByText('Not in list? Contact Admin')).toBeInTheDocument();
        expect(screen.queryByRole('checkbox', { name: /not in list/i })).not.toBeInTheDocument();
        expect(screen.queryByText(/\(optional\)/i)).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /export outgoing goods to destination/i }));

        await waitFor(() => {
            expect(trackingApiMock.getClients).toHaveBeenCalledWith('exporter');
        });

        expect(screen.getByText('Not in list? Contact Admin')).toBeInTheDocument();
        expect(screen.queryByRole('checkbox', { name: /not in list/i })).not.toBeInTheDocument();
        expect(screen.queryByText(/\(optional\)/i)).not.toBeInTheDocument();
    });
});
