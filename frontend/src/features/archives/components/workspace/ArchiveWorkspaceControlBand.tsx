import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    FileText,
    FolderArchive,
    HardDrive,
    Percent,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';

type ArchiveMetric = {
    label: string;
    value: string;
    tone: string;
};

type Props = {
    controlTitle?: string;
    healthLabel?: string;
    healthTone?: 'good' | 'danger';
    metrics: ArchiveMetric[];
    isLoading: boolean;
};

function getMetricIcon(label: string, value: string, tone: string) {
    const l = label.toLowerCase();
    if (l.includes('completion')) {
        return value === '100%' ? (
            <CheckCircle2 className="size-4 text-emerald-500" />
        ) : (
            <Percent className={`size-4 ${tone.includes('red') ? 'text-rose-500' : 'text-amber-500'}`} />
        );
    }
    if (l.includes('storage')) return <HardDrive className="size-4 text-muted-foreground/70" />;
    if (l.includes('incomplete')) {
        const isZero = value === '0' || value === '0%';
        return <AlertTriangle className={`size-4 ${isZero ? 'text-muted-foreground/70' : 'text-rose-500'}`} />;
    }
    if (l.includes('files uploaded') || l.includes('file')) return <FileText className="size-4 text-sky-500" />;
    if (l.includes('month') || l.includes('added')) return <Calendar className="size-4 text-amber-500" />;
    return <FolderArchive className="size-4 text-muted-foreground/70" />;
}

function getMetricSubtitle(label: string, value: string): string {
    const l = label.toLowerCase();
    if (l.includes('completion')) return 'Overall archive completeness';
    if (l.includes('storage')) return 'Total preserved file storage';
    if (l.includes('incomplete')) {
        return value === '0' ? 'All records complete' : 'BLs requiring document uploads';
    }
    if (l.includes('bl records')) return 'Preserved BL records';
    if (l.includes('file')) return 'Total uploaded documents';
    if (l.includes('month') || l.includes('added')) return 'Recent additions this month';
    return 'Archive record tracking';
}

export const ArchiveWorkspaceControlBand = ({
    metrics,
    isLoading,
}: Props) => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
            const icon = getMetricIcon(metric.label, metric.value, metric.tone);
            const subtitle = getMetricSubtitle(metric.label, metric.value);
            const isDanger = metric.tone.includes('red');
            const isSuccess = metric.tone.includes('emerald') || metric.tone.includes('green');

            return (
                <Card key={metric.label} className="p-4 gap-2 shadow-xs bg-card">
                    <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                        <CardTitle className="text-xs font-medium text-muted-foreground">{metric.label}</CardTitle>
                        {icon}
                    </CardHeader>
                    <CardContent className="p-0">
                        <div
                            className={`text-2xl font-bold tracking-tight tabular-nums ${
                                isDanger
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : isSuccess
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-foreground'
                            }`}
                        >
                            {isLoading ? '—' : metric.value}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
                    </CardContent>
                </Card>
            );
        })}
    </div>
);

