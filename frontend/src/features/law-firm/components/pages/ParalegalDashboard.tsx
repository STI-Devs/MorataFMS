import { useNavigate } from 'react-router-dom';
import { CurrentDateTime } from '../../../../components/CurrentDateTime';
import { appRoutes } from '../../../../lib/appRoutes';
import {
    useNotarialGeneratedDocuments,
    useNotarialTemplates,
} from '../../hooks/useLegalWorkspace';

type ModuleCard = {
    label: string;
    description: string;
    path: string;
    accent: string;
    icon: string;
};

const baseModuleCards: ModuleCard[] = [
    {
        label: 'Create Draft',
        description: 'Select a master, create a working copy, and open it in the editor.',
        path: appRoutes.paralegalGenerator,
        accent: 'var(--primary)',
        icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2',
    },
    {
        label: 'Generated Documents',
        description: 'Search and reopen editable Word outputs by party, document type, variant, or file name.',
        path: appRoutes.paralegalGeneratedDocuments,
        accent: 'var(--success)',
        icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
    },
    {
        label: 'Legal Create Draft',
        description: 'Create a legal Word draft from the legal document master library.',
        path: appRoutes.paralegalLegalFiles,
        accent: 'var(--warning)',
        icon: 'M5 4h10l4 4v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zm9 1.5V9h3.5',
    },
    {
        label: 'Legal File Masters',
        description: 'Upload and manage legal DOCX masters for the drafting engine.',
        path: appRoutes.paralegalLegalFileMasters,
        accent: 'var(--violet)',
        icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0-12l-4 4m4-4l4 4',
    },
    {
        label: 'Legal Generated Documents',
        description: 'Search and reopen legal Word outputs by party, master, or file name.',
        path: appRoutes.paralegalLegalFileRecords,
        accent: 'var(--danger)',
        icon: 'M4 6a2 2 0 012-2h8l6 6v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm4 7h8m-8 4h8',
    },
    {
        label: 'Legacy Records',
        description: 'Upload and review old notarial and legal folders from the dedicated legacy records workspace.',
        path: appRoutes.paralegalLegacyFolderUpload,
        accent: 'var(--muted-foreground)',
        icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
    },
];

const OverviewCard = ({ label, value, description }: { label: string; value: string; description: string }) => (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">{value}</p>
        <p className="mt-1.5 text-sm text-text-muted">{description}</p>
    </div>
);

export const ParalegalDashboard = () => {
    const navigate = useNavigate();

    const templatesQuery = useNotarialTemplates({ page: 1, per_page: 1 });
    const readyTemplatesQuery = useNotarialTemplates({ template_status: 'ready', page: 1, per_page: 1 });
    const generatedDocumentsQuery = useNotarialGeneratedDocuments({ page: 1, per_page: 1 });
    const legalGeneratedDocumentsQuery = useNotarialGeneratedDocuments({ module: 'legal', page: 1, per_page: 1 });

    const templateCount = templatesQuery.data?.meta.total ?? 0;
    const readyTemplateCount = readyTemplatesQuery.data?.meta.total ?? 0;
    const generatedDocumentCount = generatedDocumentsQuery.data?.meta.total ?? 0;
    const legalGeneratedDocumentCount = legalGeneratedDocumentsQuery.data?.meta.total ?? 0;

    return (
        <div className="space-y-8 px-6 py-6">
            <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="mt-2 text-4xl font-bold tracking-tight text-text-primary">Paralegal Workspace</h1>
                    <p className="mt-3 max-w-2xl text-sm text-text-secondary">
                        Manage notarial drafting, generated Word files, and the supporting archive work from one legal workspace.
                    </p>
                </div>
                <CurrentDateTime
                    className="text-left sm:text-right"
                    timeClassName="text-2xl font-mono font-bold tracking-tight text-text-primary"
                    dateClassName="mt-1 text-xs font-mono uppercase tracking-[0.25em] text-text-secondary"
                />
            </header>

            <section>
                <div className="mb-4 flex items-center gap-3">
                    <div className="h-5 w-1 rounded-full bg-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-text-secondary">Overview</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <OverviewCard
                        label="Document Masters"
                        value={String(templateCount)}
                        description="Document masters saved in the system."
                    />
                    <OverviewCard
                        label="Ready Masters"
                        value={String(readyTemplateCount)}
                        description="Masters that already have their DOCX source file."
                    />
                    <OverviewCard
                        label="Generated Documents"
                        value={String(generatedDocumentCount)}
                        description="Editable Word outputs already created from the master library."
                    />
                    <OverviewCard
                        label="Generated Legal Files"
                        value={String(legalGeneratedDocumentCount)}
                        description="Editable legal Word outputs already created from the legal master library."
                    />
                </div>
            </section>

            <section>
                <div className="mb-4 flex items-center gap-3">
                    <div className="h-5 w-1 rounded-full bg-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-text-secondary">Workflows</h2>
                </div>
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {baseModuleCards.map((card) => (
                        <button
                            key={card.label}
                            id={`paralegal-module-${card.label.toLowerCase().replace(/\s+/g, '-')}`}
                            type="button"
                            onClick={() => navigate(card.path)}
                            className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-xl border border-border bg-surface p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-border-strong hover:bg-hover hover:shadow-md"
                        >
                            <div
                                className="absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                                style={{ backgroundColor: card.accent }}
                            />
                            <div
                                className="flex h-12 w-12 items-center justify-center rounded-xl"
                                style={{ backgroundColor: `color-mix(in srgb, ${card.accent} 10%, transparent)` }}
                            >
                                <svg
                                    className="h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    style={{ color: card.accent }}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d={card.icon} />
                                </svg>
                            </div>
                            <div>
                                <p className="text-base font-bold text-text-primary">{card.label}</p>
                                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{card.description}</p>
                            </div>
                            <div className="mt-auto flex items-center gap-1.5 text-xs font-semibold" style={{ color: card.accent }}>
                                Open page
                                <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
};
