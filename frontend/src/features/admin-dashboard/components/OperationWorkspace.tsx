import { useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    Archive,
    Clock,
    FileCheck2,
    FileText,
    Flag,
    Truck,
    UserCheck,
    Users,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { Badge } from '../../../components/ui/badge';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../../components/ui/card';
import { EmptyState } from '../../../components/EmptyState';
import { appRoutes } from '../../../lib/appRoutes';
import type {
    AdminDashboardCriticalItem,
    AdminDashboardDestination,
    AdminDashboardFeedItem,
    AdminDashboardWorkloadItem,
} from '../types/adminDashboard.types';

const quickActions = [
    { label: 'Document Review', path: appRoutes.adminDocumentReview, icon: FileCheck2 },
    { label: 'Transaction Oversight', path: appRoutes.transactions, icon: Archive },
    { label: 'Live Tracking', path: appRoutes.liveTracking, icon: Clock },
    { label: 'Reports & Analytics', path: appRoutes.reports, icon: Flag },
    { label: 'User Management', path: appRoutes.users, icon: Users },
    { label: 'Client Management', path: appRoutes.clients, icon: Truck },
];

const statusLabels: Record<AdminDashboardCriticalItem['status'], string> = {
    stuck: 'Needs Update',
    missing: 'Missing',
    review: 'Review',
};

const statusBadgeVariants: Record<AdminDashboardCriticalItem['status'], 'destructive' | 'warning' | 'info'> = {
    stuck: 'destructive',
    missing: 'warning',
    review: 'info',
};

const dashboardDestinationPaths: Record<AdminDashboardDestination, string> = {
    transactions: appRoutes.transactions,
    admin_document_review: appRoutes.adminDocumentReview,
};

const actionLeadIn = (action: string): string => {
    if (action === 'Document Alert') return 'raised';
    if (action === 'Encoder Reassigned' || action === 'Status Override') return 'performed';
    return 'recorded';
};

export const OperationWorkspace = ({
    criticalOperations,
    workloads,
    actionFeed,
}: {
    criticalOperations: AdminDashboardCriticalItem[];
    workloads: AdminDashboardWorkloadItem[];
    actionFeed: AdminDashboardFeedItem[];
}) => {
    const navigate = useNavigate();

    return (
        <div className="grid items-start gap-4 xl:grid-cols-12">
            {/* Left column: Modules + Operation Queue */}
            <div className="space-y-4 xl:col-span-8">
                {/* Modules */}
                <Card>
                    <CardHeader>
                        <CardTitle>Modules</CardTitle>
                        <CardDescription>Quick shortcuts to core customs brokerage workflows</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                            {quickActions.map((action) => {
                                const ActionIcon = action.icon;
                                return (
                                    <button
                                        key={action.label}
                                        type="button"
                                        onClick={() => navigate(action.path)}
                                        className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 text-left transition-all hover:border-border hover:bg-accent/50 hover:shadow-xs"
                                    >
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-muted-foreground transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                                            <ActionIcon className="size-4" />
                                        </div>
                                        <span className="text-xs font-semibold text-foreground">{action.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Operation Queue */}
                <Card>
                    <CardHeader>
                        <CardTitle>Operation Queue</CardTitle>
                        <CardDescription>Urgent exceptions, blocked stages, and pending admin reviews</CardDescription>
                        {criticalOperations.length > 0 && (
                            <CardAction>
                                <Badge variant="secondary">{criticalOperations.length} items</Badge>
                            </CardAction>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        {criticalOperations.length === 0 ? (
                            <EmptyState label="critical issues" message="All clear — no critical issues." />
                        ) : (
                            <div className="divide-y divide-border/60">
                                {criticalOperations.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => navigate(dashboardDestinationPaths[item.destination])}
                                        className="group flex w-full flex-col gap-2 p-4 text-left transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="flex items-start gap-3 sm:items-center">
                                            <div className="mt-0.5 shrink-0 sm:mt-0">
                                                {item.status === 'stuck' ? (
                                                    <AlertCircle className="size-4 text-danger" />
                                                ) : item.status === 'missing' ? (
                                                    <FileText className="size-4 text-warning" />
                                                ) : (
                                                    <Clock className="size-4 text-primary" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-foreground">{item.ref}</span>
                                                    <Badge variant={statusBadgeVariants[item.status]} className="px-1.5 py-0 text-[10px] uppercase">
                                                        {statusLabels[item.status]}
                                                    </Badge>
                                                </div>
                                                <p className="mt-0.5 text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                                                    {item.title}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="pl-7 sm:pl-0">
                                            <span className="font-mono text-[11px] text-muted-foreground">{item.age}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Right column: Encoder Workload + Audit Log */}
            <div className="space-y-4 xl:col-span-4">
                {/* Encoder Workload */}
                <Card>
                    <CardHeader>
                        <CardTitle>Encoder Workload</CardTitle>
                        <CardDescription>Staff assignment and throughput monitoring</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {workloads.length === 0 ? (
                            <EmptyState label="encoder workloads" message="No encoder workloads yet." />
                        ) : (
                            <div className="divide-y divide-border/60">
                                {workloads.map((person) => (
                                    <div
                                        key={person.id}
                                        className="flex items-center justify-between gap-3 p-3 transition-colors hover:bg-muted/40"
                                    >
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <Avatar className="size-8 shrink-0">
                                                <AvatarFallback className="text-xs font-bold">
                                                    {person.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-semibold text-foreground">{person.name}</p>
                                                <p className="truncate text-[11px] text-muted-foreground">{person.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-right">
                                            {person.overdue > 0 && (
                                                <Badge variant="destructive" className="px-1.5 py-0 text-[10px]">
                                                    {person.overdue} late
                                                </Badge>
                                            )}
                                            <span className="text-xs font-semibold tabular-nums text-foreground">{person.active}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Audit Log */}
                <Card>
                    <CardHeader>
                        <CardTitle>Audit Log</CardTitle>
                        <CardDescription>Recent administrative modifications</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {actionFeed.length === 0 ? (
                            <EmptyState label="admin activity" message="No admin activity recorded yet." />
                        ) : (
                            <div className="divide-y divide-border/60">
                                {actionFeed.map((item) => (
                                    <div key={item.id} className="flex gap-3 p-3.5 transition-colors hover:bg-muted/40">
                                        <div className="mt-0.5 shrink-0 text-muted-foreground">
                                            {item.action === 'Document Alert' ? (
                                                <FileText className="size-3.5 text-warning" />
                                            ) : (
                                                <UserCheck className="size-3.5 text-primary" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs leading-snug text-muted-foreground">
                                                <span className="font-semibold text-foreground">{item.actor}</span>{' '}
                                                {actionLeadIn(item.action)}{' '}
                                                <span className="font-semibold text-foreground">{item.target}</span>
                                            </p>
                                            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{item.detail}</p>
                                            <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">{item.age}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
