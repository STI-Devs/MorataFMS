import { useState } from 'react';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { CurrentDateTime } from '../../../components/CurrentDateTime';
import { useConfirmationModal } from '../../../hooks/useConfirmationModal';
import { useAuth } from '../../auth/hooks/useAuth';
import { isAdmin } from '../../auth/utils/access';
import { useActivateUser, useCreateUser, useDeactivateUser, useDeleteUser, useUpdateUser, useUsers } from '../hooks/useUsers';
import type { CreateUserData, UpdateUserData, User } from '../types/user.types';
import { UserFormModal } from './UserFormModal';

const roleConfig: Record<string, { label: string; color: string; icon: string }> = {
    admin: {
        label: 'Admin',
        color: 'var(--violet)',
        icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    },
    paralegal: {
        label: 'Paralegal',
        color: 'var(--warning)',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    },
    encoder: {
        label: 'Encoder',
        color: 'var(--sky)',
        icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    },
    processor: {
        label: 'Processor',
        color: 'var(--primary)',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    },
    accounting: {
        label: 'Accountant',
        color: 'var(--success)',
        icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    },
};

function RoleBadge({ role }: { role: string }) {
    const cfg = roleConfig[role] ?? { label: role, color: 'var(--muted-foreground)', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' };
    return (
        <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ color: cfg.color, backgroundColor: `color-mix(in srgb, ${cfg.color} 10%, transparent)` }}
        >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
            </svg>
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

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-5 p-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">User Management</h1>
                    <p className="text-xs text-text-muted mt-0.5">Create, edit, and manage user accounts</p>
                </div>
                <CurrentDateTime
                    className="text-right hidden sm:block"
                    timeClassName="text-xl font-bold tabular-nums text-text-primary"
                    dateClassName="text-xs text-text-muted"
                />
            </div>

            {/* Stat Cards */}
            {(() => {
                const total = users.length;
                const active = users.filter(u => u.is_active).length;
                const inactive = total - active;
                const admins = users.filter(u => isAdmin(u)).length;
                const staff = users.filter(u => !isAdmin(u)).length;

                const cards = [
                    {
                        label: 'Total Users',
                        value: total,
                        sub: `${admins} admin · ${staff} staff`,
                        dot: null as string | null,
                    },
                    {
                        label: 'Active',
                        value: active,
                        sub: total > 0 ? `${Math.round((active / total) * 100)}% of total` : '—',
                        dot: 'var(--success)' as string | null,
                    },
                    {
                        label: 'Inactive',
                        value: inactive,
                        sub: inactive === 0 ? 'All users active' : `${inactive} deactivated`,
                        dot: inactive > 0 ? 'var(--danger)' as string | null : null,
                    },
                    {
                        label: 'Admins',
                        value: admins,
                        sub: 'full system access',
                        dot: null as string | null,
                    },
                ];

                return (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {cards.map(card => (
                            <div
                                key={card.label}
                                className="bg-surface border border-border rounded-lg px-4 py-3.5"
                            >
                                <p className="text-[11px] font-medium text-text-muted uppercase tracking-widest mb-2">
                                    {card.label}
                                </p>
                                <div className="flex items-center gap-2">
                                    {card.dot && (
                                        <span
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: card.dot }}
                                        />
                                    )}
                                    <p className="text-[2rem] font-semibold tabular-nums text-text-primary leading-none">
                                        {card.value}
                                    </p>
                                </div>
                                <p className="text-xs text-text-muted mt-2">{card.sub}</p>
                            </div>
                        ))}
                    </div>
                );
            })()}

            {/* Table */}
            <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="p-3 border-b border-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-surface-subtle">
                    <div className="relative flex-1 max-w-sm">
                        <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 h-9 rounded-md border border-border-strong bg-input-bg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-xs font-bold transition-all shadow-sm bg-primary text-primary-foreground"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Create User
                    </button>
                </div>

                {isLoading ? (
                    <div className="p-16 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: 'var(--primary)' }} />
                    </div>
                ) : isError ? (
                    <div className="p-16 text-center">
                        <p className="text-sm text-destructive font-medium">Failed to load users. Please try again.</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-16 text-center">
                        <svg className="w-10 h-10 mx-auto mb-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <p className="text-sm text-text-muted">
                            {searchTerm ? 'No users match your search' : 'No users found'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    {['Name', 'Email', 'Job Title', 'Role', 'Status', 'Actions'].map((h, i) => (
                                        <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider ${i === 0 ? 'text-left' : 'text-center'
                                            } text-text-muted`}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map((user, idx) => (
                                    <tr
                                        key={user.id}
                                        className={`border-b border-border/50 transition-colors hover:bg-hover ${idx % 2 !== 0 ? 'bg-surface-secondary/40' : ''}`}
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0"
                                                    style={{ backgroundColor: roleConfig[user.role]?.color ?? 'var(--muted-foreground)' }}>
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-text-primary">{user.name}</span>
                                                    {currentUser?.id === user.id && (
                                                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-foreground/10 text-muted-foreground">
                                                            you
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-text-secondary text-center">
                                            <div className="space-y-1">
                                                <div>{user.email}</div>
                                                <div className="text-[11px] uppercase tracking-widest text-text-muted">
                                                    {user.departments.join(' / ')}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-center text-sm text-text-secondary">
                                            {user.job_title || '—'}
                                        </td>
                                        <td className="px-5 py-3.5 text-center"><RoleBadge role={user.role} /></td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${user.is_active ? 'text-success bg-success/12' : 'text-danger bg-danger/12'}`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full inline-block ${user.is_active ? 'bg-success' : 'bg-danger'}`} />
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {currentUser?.id === user.id ? (
                                                    <span className="text-sm text-text-muted">—</span>
                                                ) : (
                                                    <>
                                                        <button
                                                            title="Edit User"
                                                            onClick={() => handleEdit(user)}
                                                            className="p-1.5 rounded-lg transition-colors bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>

                                                        {user.is_active ? (
                                                            <button
                                                                title="Deactivate User"
                                                                onClick={() => handleDeactivate(user)}
                                                                disabled={deactivateUser.isPending}
                                                                className="p-1.5 rounded-lg transition-colors disabled:opacity-50 hover:opacity-80 bg-danger/12 text-danger"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                                </svg>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                title="Activate User"
                                                                onClick={() => handleActivate(user.id)}
                                                                disabled={activateUser.isPending}
                                                                className="p-1.5 rounded-lg transition-colors disabled:opacity-50 hover:opacity-80 bg-success/12 text-success"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            </button>
                                                        )}

                                                        <button
                                                            title="Delete User"
                                                            onClick={() => handleDelete(user)}
                                                            disabled={deleteUser.isPending}
                                                            className="p-1.5 rounded-lg transition-colors disabled:opacity-50 hover:opacity-80 bg-danger/18 text-danger"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 001-1V5a1 1 0 011-1h4a1 1 0 011 1v1a1 1 0 001 1m-7 0h7" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="px-5 py-3 text-xs text-text-muted border-t border-border">
                            Showing {filteredUsers.length} of {users.length} users
                        </div>
                    </div>
                )}
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
