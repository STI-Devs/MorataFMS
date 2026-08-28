import { useNavigate } from 'react-router-dom';
import {
    Archive,
    ArrowRight,
    CheckCircle2,
    ChevronRight,
    Files,
    FileSignature,
    FileText,
    FolderKanban,
    UploadCloud,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { appRoutes } from '../../../../lib/appRoutes';
import {
    useNotarialGeneratedDocuments,
    useNotarialTemplates,
} from '../../hooks/useLegalWorkspace';
import { cn } from '@/lib/utils';

type ModuleCard = {
    label: string;
    description: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
};

const baseModuleCards: ModuleCard[] = [
    {
        label: 'Create Draft',
        description: 'Select a master, create a working copy, and open it in the editor.',
        path: appRoutes.paralegalGenerator,
        icon: FileSignature,
        iconBg: 'bg-blue-500/10',
        iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
        label: 'Generated Documents',
        description: 'Search and reopen editable Word outputs by party, document type, variant, or file name.',
        path: appRoutes.paralegalGeneratedDocuments,
        icon: Files,
        iconBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
        label: 'Legal Create Draft',
        description: 'Create a legal Word draft from the legal document master library.',
        path: appRoutes.paralegalLegalFiles,
        icon: FileText,
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
        label: 'Legal File Masters',
        description: 'Upload and manage legal DOCX masters for the drafting engine.',
        path: appRoutes.paralegalLegalFileMasters,
        icon: UploadCloud,
        iconBg: 'bg-indigo-500/10',
        iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
        label: 'Legal Generated Documents',
        description: 'Search and reopen legal Word outputs by party, master, or file name.',
        path: appRoutes.paralegalLegalFileRecords,
        icon: FolderKanban,
        iconBg: 'bg-rose-500/10',
        iconColor: 'text-rose-600 dark:text-rose-400',
    },
    {
        label: 'Legacy Records',
        description: 'Upload and review old notarial and legal folders from the dedicated legacy records workspace.',
        path: appRoutes.paralegalLegacyFolderUpload,
        icon: Archive,
        iconBg: 'bg-muted',
        iconColor: 'text-muted-foreground',
    },
];

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
        <div className="w-full space-y-6 pb-8">
            {/* Header */}
            <header className="flex flex-col gap-1 border-b border-border/80 pb-5">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Paralegal Workspace</h1>
                <p className="text-sm text-muted-foreground">
                    Manage notarial drafting, generated Word files, and the supporting archive work from one legal workspace.
                </p>
            </header>

            {/* Overview Section */}
            <section className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Overview</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="p-4 gap-2 shadow-xs bg-card">
                        <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Document Masters</CardTitle>
                            <FileText className="size-4 text-blue-500" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                                {templateCount}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Document masters saved in the system.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="p-4 gap-2 shadow-xs bg-card">
                        <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Ready Masters</CardTitle>
                            <CheckCircle2 className="size-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                                {readyTemplateCount}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Masters that already have their DOCX source file.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="p-4 gap-2 shadow-xs bg-card">
                        <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Generated Documents</CardTitle>
                            <Files className="size-4 text-amber-500" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                                {generatedDocumentCount}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Editable Word outputs created from master library.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="p-4 gap-2 shadow-xs bg-card">
                        <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                            <CardTitle className="text-xs font-medium text-muted-foreground">Generated Legal Files</CardTitle>
                            <FolderKanban className="size-4 text-indigo-500" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                                {legalGeneratedDocumentCount}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Editable legal outputs from legal master library.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Workflows Section */}
            <section className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Workflows</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {baseModuleCards.map((card) => {
                        const IconComponent = card.icon;
                        return (
                            <button
                                key={card.label}
                                id={`paralegal-module-${card.label.toLowerCase().replace(/\s+/g, '-')}`}
                                type="button"
                                onClick={() => navigate(card.path)}
                                className="group p-5 flex flex-col justify-between gap-4 border border-border/80 bg-card hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer rounded-xl text-left shadow-2xs"
                            >
                                <div className="flex items-start justify-between gap-3 w-full">
                                    <div className={cn("flex size-10 items-center justify-center rounded-lg shadow-2xs", card.iconBg)}>
                                        <IconComponent className={cn("size-5", card.iconColor)} />
                                    </div>
                                    <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                        {card.label}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                        {card.description}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 text-xs font-semibold text-primary pt-2 border-t border-border/40 w-full">
                                    Open page
                                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};
