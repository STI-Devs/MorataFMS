import { AlertCircle, ArrowDownRight, ArrowUpRight, Calendar, Clock, FileText, Package } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import {
    Card,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '../../../components/ui/card';
import type { AdminDashboardKpis } from '../types/adminDashboard.types';

type KpiCardDef = {
    label: string;
    value: string;
    helper: string;
    icon: typeof Package;
    accentClass: string;
};

export const DashboardKpiCards = ({ kpis }: { kpis: AdminDashboardKpis }) => {
    const cards: KpiCardDef[] = [
        { label: 'Active Imports', value: String(kpis.active_imports), helper: 'Open import workload', icon: ArrowDownRight, accentClass: 'text-primary' },
        { label: 'Active Exports', value: String(kpis.active_exports), helper: 'Open export workload', icon: ArrowUpRight, accentClass: 'text-success' },
        { label: 'ETA/ETD This Week', value: String(kpis.upcoming_eta_etd), helper: 'Arrivals/departures within 7 days', icon: Calendar, accentClass: 'text-info' },
        { label: 'Open Remarks', value: String(kpis.open_remarks), helper: 'Unresolved operational blockers', icon: AlertCircle, accentClass: 'text-warning' },
        { label: 'Needs Update', value: String(kpis.delayed_shipments), helper: 'No activity logged for 48+ hours', icon: Clock, accentClass: 'text-violet' },
        { label: 'Document Gaps', value: String(kpis.missing_final_docs), helper: 'Finalized files still incomplete', icon: FileText, accentClass: 'text-danger' },
    ];

    return (
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => {
                const IconComponent = card.icon;
                return (
                    <Card key={card.label} className="@container/card">
                        <CardHeader>
                            <CardDescription>{card.label}</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {card.value}
                            </CardTitle>
                            <CardAction>
                                <Badge variant="outline" className="gap-1">
                                    <IconComponent className={`size-3.5 ${card.accentClass}`} />
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <p className="text-muted-foreground">{card.helper}</p>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
};
