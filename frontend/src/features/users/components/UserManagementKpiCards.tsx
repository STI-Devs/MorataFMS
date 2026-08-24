import { ShieldCheck, UserCheck, Users, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import type { User } from '../types/user.types';
import { isAdmin } from '../../auth/utils/access';

interface UserManagementKpiCardsProps {
    users: User[];
    isLoading: boolean;
}

export const UserManagementKpiCards = ({ users, isLoading }: UserManagementKpiCardsProps) => {
    const total = users.length;
    const active = users.filter((u) => u.is_active).length;
    const inactive = total - active;
    const admins = users.filter((u) => isAdmin(u)).length;
    const staff = users.filter((u) => !isAdmin(u)).length;
    const activePct = total > 0 ? Math.round((active / total) * 100) : 0;

    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="user-management-kpi-strip">
            {/* Total Users */}
            <Card className="p-4 gap-2 shadow-xs bg-card">
                <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Total Users</CardTitle>
                    <Users className="size-4 text-muted-foreground/70" />
                </CardHeader>
                <CardContent className="p-0">
                    <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                        {isLoading ? '—' : total.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {total > 0 ? `${admins} admin · ${staff} staff` : 'All registered team members'}
                    </p>
                </CardContent>
            </Card>

            {/* Active Accounts */}
            <Card className="p-4 gap-2 shadow-xs bg-card">
                <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Active Accounts</CardTitle>
                    <UserCheck className="size-4 text-emerald-500" />
                </CardHeader>
                <CardContent className="p-0">
                    <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                        {isLoading ? '—' : active.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {total > 0 ? `${activePct}% of total users` : 'Active status'}
                    </p>
                </CardContent>
            </Card>

            {/* Inactive Accounts */}
            <Card className="p-4 gap-2 shadow-xs bg-card">
                <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Inactive</CardTitle>
                    <UserX className={`size-4 ${inactive > 0 ? 'text-rose-500' : 'text-muted-foreground/70'}`} />
                </CardHeader>
                <CardContent className="p-0">
                    <div
                        className={`text-2xl font-bold tracking-tight tabular-nums ${
                            inactive > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
                        }`}
                    >
                        {isLoading ? '—' : inactive.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {inactive === 0 ? 'All accounts active' : `${inactive} deactivated accounts`}
                    </p>
                </CardContent>
            </Card>

            {/* System Admins */}
            <Card className="p-4 gap-2 shadow-xs bg-card">
                <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0">
                    <CardTitle className="text-xs font-medium text-muted-foreground">System Admins</CardTitle>
                    <ShieldCheck className="size-4 text-blue-500" />
                </CardHeader>
                <CardContent className="p-0">
                    <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                        {isLoading ? '—' : admins.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Full administrative access</p>
                </CardContent>
            </Card>
        </div>
    );
};
