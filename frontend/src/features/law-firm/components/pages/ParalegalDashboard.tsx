import { useNavigate } from 'react-router-dom';
import { CurrentDateTime } from '../../../../components/CurrentDateTime';
import { appRoutes } from '../../../../lib/appRoutes';
import { useAuth } from '../../../auth';
import {
    useLegalArchive,
    useLegalBooks,
    useNotarialTemplateRecords,
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
        label: 'Template Generator',
        description: 'Choose the notarial template, fill the needed fields, and generate the Word document.',
        path: appRoutes.paralegalNotarial,
        accent: '#0a84ff',
        icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2',
    },
    {
        label: 'Generated Records',
        description: 'Review the generated Word outputs by template, party, book, and notarial act.',
        path: appRoutes.paralegalRecords,
        accent: '#30d158',
        icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
    },
    {
        label: 'Book Archive',
        description: 'Register physical books and keep the scanned pages and archive files under each book.',
        path: appRoutes.paralegalBooks,
        accent: '#5e5ce6',
        icon: 'M4 6h16M4 10h16M6 14h12a2 2 0 012 2v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3a2 2 0 012-2z',
    },
    {
        label: 'Legal File Encode',
        description: 'Save non-notarial legal files like certificates, demand letters, and position papers.',
        path: appRoutes.paralegalLegalFiles,
        accent: '#ff9f0a',
        icon: 'M5 4h10l4 4v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zm9 1.5V9h3.5',
    },
    {
        label: 'Legal File Records',
        description: 'Search archive-only legal file records by title, related name, category, and upload status.',
        path: appRoutes.paralegalLegalFileRecords,
        accent: '#ff453a',
        icon: 'M4 6a2 2 0 012-2h8l6 6v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm4 7h8m-8 4h8',
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
    const { user } = useAuth();
    const canManageBooks = Boolean(user?.permissions.manage_notarial_books);

    const booksQuery = useLegalBooks({ per_page: 100 });
    const templatesQuery = useNotarialTemplates({ page: 1, per_page: 1 });
    const readyTemplatesQuery = useNotarialTemplates({ template_status: 'ready', page: 1, per_page: 1 });
    const generatedRecordsQuery = useNotarialTemplateRecords({ page: 1, per_page: 1 });
    const legalArchiveQuery = useLegalArchive({ page: 1, per_page: 1 });

    const books = booksQuery.data?.data ?? [];
    const activeBook = books.find((book) => book.status === 'active') ?? null;
    const templateCount = templatesQuery.data?.meta.total ?? 0;
    const readyTemplateCount = readyTemplatesQuery.data?.meta.total ?? 0;
    const generatedRecordCount = generatedRecordsQuery.data?.meta.total ?? 0;
    const legalArchiveCount = legalArchiveQuery.data?.meta.total ?? 0;
    const moduleCards = canManageBooks ? baseModuleCards : baseModuleCards.filter((card) => card.label !== 'Book Archive');

    return (
        <div className="space-y-8 px-6 py-6">
            <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="mt-2 text-4xl font-bold tracking-tight text-text-primary">Paralegal Dashboard</h1>
                    <p className="mt-3 max-w-2xl text-sm text-text-secondary">
                        Generate notarial documents from templates, keep the output history searchable, and maintain the physical book archive in a separate workspace.
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
                    <div className="h-5 w-1 rounded-full bg-blue-500" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-text-secondary">Overview</h2>
                </div>
                <div className="grid gap-4 lg:grid-cols-5">
                    <OverviewCard
                        label="Current Book"
                        value={activeBook ? `Book ${activeBook.book_number}` : 'None'}
                        description={activeBook ? `${activeBook.year} is marked active in the archive.` : 'No physical book marked active.'}
                    />
                    <OverviewCard
                        label="Templates"
                        value={String(templateCount)}
                        description="Master notarial templates saved in the system."
                    />
                    <OverviewCard
                        label="Ready Templates"
                        value={String(readyTemplateCount)}
                        description="Templates that already have their DOCX master file."
                    />
                    <OverviewCard
                        label="Generated Records"
                        value={String(generatedRecordCount)}
                        description="Word outputs already generated from the template library."
                    />
                    <OverviewCard
                        label="Legal File Records"
                        value={String(legalArchiveCount)}
                        description="Archive-only legal file records stored outside the notarial flow."
                    />
                </div>
            </section>

            <section>
                <div className="mb-4 flex items-center gap-3">
                    <div className="h-5 w-1 rounded-full bg-blue-500" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-text-secondary">Workflows</h2>
                </div>
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                    {moduleCards.map((card) => (
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
                                style={{ backgroundColor: `${card.accent}18` }}
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
