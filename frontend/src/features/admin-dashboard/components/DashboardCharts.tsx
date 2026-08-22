import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis } from 'recharts';
import { Badge } from '../../../components/ui/badge';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../../../components/ui/card';
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '../../../components/ui/chart';
import { Progress } from '../../../components/ui/progress';
import type { AdminDashboardAnalytics } from '../types/adminDashboard.types';

const volumeChartConfig = {
    imports: { label: 'Imports', color: 'var(--chart-1)' },
    exports: { label: 'Exports', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const statusChartConfig = {
    pending: { label: 'Pending', color: 'var(--warning)' },
    in_progress: { label: 'In Progress', color: 'var(--info)' },
    completed: { label: 'Completed', color: 'var(--success)' },
    cancelled: { label: 'Cancelled', color: 'var(--danger)' },
} satisfies ChartConfig;

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const DashboardCharts = ({ analytics }: { analytics: AdminDashboardAnalytics }) => {
    const volumeData = analytics.monthly_volume.months.map((m) => ({
        month: monthNames[m.month - 1] ?? `M${m.month}`,
        imports: m.imports,
        exports: m.exports,
    }));

    const flow = analytics.transaction_flow;
    const importsPercentage = flow.total ? Math.round((flow.imports / flow.total) * 100) : 0;
    const exportsPercentage = flow.total ? Math.round((flow.exports / flow.total) * 100) : 0;

    const liveStatusTotal = analytics.status_breakdown.reduce((acc, curr) => acc + curr.value, 0);
    const statusPieData = analytics.status_breakdown.map((s) => ({
        status: s.key,
        value: s.value,
        fill: `var(--color-${s.key})`,
    }));

    return (
        <section className="grid gap-4 lg:grid-cols-3">
            {/* Monthly Volume */}
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Volume</CardTitle>
                    <CardDescription>Imports vs exports, year to date</CardDescription>
                    <CardAction>
                        <Badge variant="outline">{analytics.monthly_volume.total} total</Badge>
                    </CardAction>
                </CardHeader>
                <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                    <ChartContainer config={volumeChartConfig} className="h-[250px] w-full">
                        <BarChart data={volumeData} accessibilityLayer>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                            <Bar dataKey="imports" fill="var(--color-imports)" radius={[2, 2, 0, 0]} stackId="a" />
                            <Bar dataKey="exports" fill="var(--color-exports)" radius={[2, 2, 0, 0]} stackId="a" />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            {/* Live Status Mix */}
            <Card>
                <CardHeader>
                    <CardTitle>Live Status Mix</CardTitle>
                    <CardDescription>Active pipeline by transaction status</CardDescription>
                    <CardAction>
                        <Badge variant="outline">{liveStatusTotal} live</Badge>
                    </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <ChartContainer config={statusChartConfig} className="mx-auto aspect-square w-full max-w-[260px]">
                        <PieChart>
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Pie data={statusPieData} dataKey="value" nameKey="status" innerRadius={60} strokeWidth={5} />
                        </PieChart>
                    </ChartContainer>
                    <div className="grid w-full grid-cols-2 gap-2">
                        {analytics.status_breakdown.map((s) => (
                            <div
                                key={s.key}
                                className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/40 p-2"
                            >
                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span className="size-2 rounded-full" style={{ backgroundColor: `var(--color-${s.key})` }} />
                                    {s.label}
                                </span>
                                <span className="text-xs font-semibold tabular-nums text-foreground">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Transaction Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle>Transaction Distribution</CardTitle>
                    <CardDescription>Share of year-to-date volume</CardDescription>
                    <CardAction>
                        <Badge variant="outline">Flow</Badge>
                    </CardAction>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="mb-1.5 flex justify-between text-xs font-medium">
                            <span className="text-muted-foreground">Imports</span>
                            <span className="font-semibold text-foreground">
                                {flow.imports} ({importsPercentage}%)
                            </span>
                        </div>
                        <Progress value={importsPercentage} />
                    </div>
                    <div>
                        <div className="mb-1.5 flex justify-between text-xs font-medium">
                            <span className="text-muted-foreground">Exports</span>
                            <span className="font-semibold text-foreground">
                                {flow.exports} ({exportsPercentage}%)
                            </span>
                        </div>
                        <Progress value={exportsPercentage} className="[&>div]:bg-success" />
                    </div>
                    <div className="border-t border-border/50 pt-3">
                        <div className="mb-1.5 flex justify-between text-xs font-medium">
                            <span className="text-muted-foreground">Completion Rate</span>
                            <span className="font-semibold text-foreground">
                                {flow.completion_rate}% · {flow.completed} completed
                            </span>
                        </div>
                        <Progress value={flow.completion_rate} className="[&>div]:bg-success" />
                    </div>
                </CardContent>
            </Card>
        </section>
    );
};
