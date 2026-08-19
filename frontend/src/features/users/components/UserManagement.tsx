import { useState } from 'react';
import {
    Pencil,
    Search,
    Trash2,
    UserCheck,
    UserPlus,
    UserX,
    X,
} from 'lucide-react';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../components/ui/table';
import { useConfirmationModal } from '../../../hooks/useConfirmationModal';
import { useAuth } from '../../auth/hooks/useAuth';
import { useActivateUser, useCreateUser, useDeactivateUser, useDeleteUser, useUpdateUser, useUsers } from '../hooks/useUsers';
import type { CreateUserData, UpdateUserData, User } from '../types/user.types';
import { UserFormModal } from './UserFormModal';
import { UserManagementKpiCards } from './UserManagementKpiCards';

const roleConfig: Record<
    string,
    { label: string; className: string; avatarBg: string }
> = {
    admin: {
        label: 'Admin',
        className: 'border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400',
        avatarBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    },
    paralegal: {
        label: 'Paralegal',
        className: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        avatarBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    },
    encoder: {
        label: 'Encoder',
        className: 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-400',
        avatarBg: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30',
    },
    processor: {
        label: 'Processor',
        className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        avatarBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    },
    accounting: {
        label: 'Accountant',
        className: 'border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-400',
        avatarBg: 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/30',
    },
};

function RoleBadge({ role }: { role: string }) {
    const cfg = roleConfig[role] ?? {
        label: role,
        className: 'border-border bg-muted/50 text-muted-foreground',
        avatarBg: 'bg-muted text-muted-foreground border-border',
    };

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.className}`}>
            {cfg.label}
        </span>
    );
}

export const UserManagement = () => {
    const { user: currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    const { data: users = [], isLoading, isError } = useUsers();
    const createUser = useCreateUser();
    const updateUser = useUpdateUser();
    const deactivateUser = useDeactivateUser();
    const activateUser = useActivateUser();
    const deleteUser = useDeleteUser();
    const { openModal, modalProps } = useConfirmationModal();

    const handleCreateUser = async (data: CreateUserData | UpdateUserData) => {
        await createUser.mutateAsync(data as CreateUserData);
        setIsModalOpen(false);
    };

    const handleUpdateUser = async (data: CreateUserData | UpdateUserData) => {
        if (selectedUser) {
            await updateUser.mutateAsync({ id: selectedUser.id, data: data as UpdateUserData });
            setIsModalOpen(false);
        }
    };

    const handleDeactivate = (user: User) => {
        openModal({
            title: 'Deactivate user?',
            message: `Are you sure you want to deactivate ${user.name}?`,
            confirmText: 'Deactivate',
            confirmButtonClass: 'bg-destructive hover:bg-destructive/90',
            onConfirm: async () => {
                await deactivateUser.mutateAsync(user.id);
            },
        });
    };

    const handleActivate = async (userId: number) => {
        await activateUser.mutateAsync(userId);
    };

    const handleDelete = (user: User) => {
        openModal({
            title: 'Delete user?',
            message: `Are you sure you want to delete ${user.name}?`,
            confirmText: 'Delete user',
            confirmButtonClass: 'bg-destructive hover:bg-destructive/90',
            onConfirm: async () => {
                await deleteUser.mutateAsync(user.id);
            },
        });
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedUser(null);
        setModalMode('create');
        setIsModalOpen(true);
    };

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.job_title && user.job_title.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    const isFiltered = searchTerm.trim() !== '' || roleFilter !== 'all';

    const roleCounts = {
        all: users.length,
        admin: users.filter((u) => u.role === 'admin').length,
        encoder: users.filter((u) => u.role === 'encoder').length,
        processor: users.filter((u) => u.role === 'processor').length,
        accounting: users.filter((u) => u.role === 'accounting').length,
        paralegal: users.filter((u) => u.role === 'paralegal').length,
    };

    return (
        <div className="w-full space-y-4 pb-6">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">User Management</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage team accounts, assign department roles, and configure system permissions.
                    </p>
                </div>
            </div>

            {/* KPI Metric Cards */}
            <UserManagementKpiCards users={users} isLoading={isLoading} />

            {/* Main Content Area */}
            <div className="flex flex-col gap-3">
                {/* Search & Tabs Toolbar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                        <div className="relative w-full sm:w-[220px] lg:w-[280px]">
                            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search users…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-8 pl-8 text-xs"
                            />
                        </div>

                        <Tabs
                            value={roleFilter}
                            onValueChange={(val) => setRoleFilter(val)}
                        >
                            <TabsList className="h-8 p-0.5">
                                <TabsTrigger value="all" className="h-7 text-xs px-2.5">
                                    All ({roleCounts.all})
                                </TabsTrigger>
                                <TabsTrigger value="admin" className="h-7 text-xs px-2.5">
                                    Admin ({roleCounts.admin})
                                </TabsTrigger>
                                <TabsTrigger value="encoder" className="h-7 text-xs px-2.5">
                                    Encoder ({roleCounts.encoder})
                                </TabsTrigger>
                                <TabsTrigger value="processor" className="h-7 text-xs px-2.5">
                                    Processor ({roleCounts.processor})
                                </TabsTrigger>
                                <TabsTrigger value="accounting" className="h-7 text-xs px-2.5">
                                    Accountant ({roleCounts.accounting})
                                </TabsTrigger>
                                <TabsTrigger value="paralegal" className="h-7 text-xs px-2.5">
                                    Paralegal ({roleCounts.paralegal})
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {isFiltered ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchTerm('');
                                    setRoleFilter('all');
                                }}
                                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                                Reset
                                <X className="ml-1 size-3.5" />
                            </Button>
                        ) : null}
                    </div>

                    <Button
                        size="sm"
                        onClick={handleCreate}
                        className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
                    >
                        <UserPlus className="size-3.5" />
                        Create User
                    </Button>
                </div>

                {/* Table Card */}
                <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
                    {isLoading ? (
                        <div className="flex min-h-[280px] flex-col items-center justify-center p-12">
                            <div className="h-7 w-7 rounded-full border-2 border-border border-t-blue-500 animate-spin" />
                            <p className="mt-3 text-xs font-medium text-muted-foreground">Loading users...</p>
                        </div>
                    ) : isError ? (
                        <div className="p-12 text-center">
                            <p className="text-sm font-medium text-rose-500">Failed to load users.</p>
                            <p className="mt-1 text-xs text-muted-foreground">Please check your connection and try again.</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="flex min-h-[280px] flex-col items-center justify-center p-8 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted/30 text-muted-foreground shadow-2xs">
                                <UserX className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">No users found</h3>
                            <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
                                {isFiltered
                                    ? 'No accounts match the current filter criteria.'
                                    : 'Create your first team user account using the button above.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-b border-border/80">
                                        <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground w-[28%] min-w-[220px]">
                                            User / Name
                                        </TableHead>
                                        <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground w-[22%] min-w-[180px]">
                                            Email
                                        </TableHead>
                                        <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground w-[16%] min-w-[130px] hidden sm:table-cell">
                                            Position
                                        </TableHead>
                                        <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground w-[14%] min-w-[120px]">
                                            Role
                                        </TableHead>
                                        <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground w-[10%] min-w-[100px]">
                                            Status
                                        </TableHead>
                                        <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground w-[10%] min-w-[110px] text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => {
                                        const cfg = roleConfig[user.role] ?? roleConfig.encoder;

                                        return (
                                            <TableRow key={user.id} className="hover:bg-muted/50 border-b border-border/60 transition-colors">
                                                {/* Name & Avatar & Departments */}
                                                <TableCell className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold shrink-0 ${cfg.avatarBg}`}
                                                        >
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-semibold text-xs text-foreground truncate block" title={user.name}>
                                                                    {user.name}
                                                                </span>
                                                                {currentUser?.id === user.id ? (
                                                                    <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.2 text-[9px] font-bold text-blue-600 dark:text-blue-400">
                                                                        you
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                            {user.departments && user.departments.length > 0 ? (
                                                                <div className="flex items-center gap-1 mt-0.5">
                                                                    {user.departments.map((dept) => (
                                                                        <span
                                                                            key={dept}
                                                                            className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground"
                                                                        >
                                                                            {dept}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Email */}
                                                <TableCell className="py-3 px-4 text-xs font-mono text-muted-foreground">
                                                    <span className="truncate block" title={user.email}>
                                                        {user.email}
                                                    </span>
                                                </TableCell>

                                                {/* Job Title */}
                                                <TableCell className="py-3 px-4 text-xs font-medium text-foreground hidden sm:table-cell">
                                                    {user.job_title || '—'}
                                                </TableCell>

                                                {/* Role */}
                                                <TableCell className="py-3 px-4">
                                                    <RoleBadge role={user.role} />
                                                </TableCell>

                                                {/* Status */}
                                                <TableCell className="py-3 px-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                                                            user.is_active
                                                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                                                : 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                        />
                                                        {user.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {currentUser?.id === user.id ? (
                                                            <span className="text-xs text-muted-foreground px-2">—</span>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    title="Edit User"
                                                                    onClick={() => handleEdit(user)}
                                                                    className="rounded-md border border-border bg-card p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer shadow-2xs"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </button>

                                                                {user.is_active ? (
                                                                    <button
                                                                        type="button"
                                                                        title="Deactivate User"
                                                                        onClick={() => handleDeactivate(user)}
                                                                        disabled={deactivateUser.isPending}
                                                                        className="rounded-md border border-amber-500/20 bg-amber-500/10 p-1.5 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                                                                    >
                                                                        <UserX className="h-3.5 w-3.5" />
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        title="Activate User"
                                                                        onClick={() => handleActivate(user.id)}
                                                                        disabled={activateUser.isPending}
                                                                        className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                                                                    >
                                                                        <UserCheck className="h-3.5 w-3.5" />
                                                                    </button>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    title="Delete User"
                                                                    onClick={() => handleDelete(user)}
                                                                    disabled={deleteUser.isPending}
                                                                    className="rounded-md border border-rose-500/20 bg-rose-500/10 p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>

                            <div className="border-t border-border bg-muted/20 px-4 py-3 text-xs font-medium text-muted-foreground flex items-center justify-between">
                                <span>
                                    Showing {filteredUsers.length} of {users.length} registered users
                                </span>
                                {isFiltered ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setRoleFilter('all');
                                        }}
                                        className="text-blue-500 hover:underline font-semibold cursor-pointer"
                                    >
                                        Clear filters
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <UserFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={modalMode === 'create' ? handleCreateUser : handleUpdateUser}
                user={selectedUser}
                mode={modalMode}
            />

            <ConfirmationModal {...modalProps} />
        </div>
    );
};
