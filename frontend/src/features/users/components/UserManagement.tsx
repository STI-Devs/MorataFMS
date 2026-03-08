import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '../../tracking/types';
import { useActivateUser, useCreateUser, useDeactivateUser, useUpdateUser, useUsers } from '../hooks/useUsers';
import type { CreateUserData, UpdateUserData, User } from '../types/user.types';
import { UserFormModal } from './UserFormModal';

const roleConfig: Record<string, { label: string; color: string; icon: string }> = {
    admin: {
        label: 'Admin',
        color: '#bf5af2',
        icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    },
    manager: {
        label: 'Manager',
        color: '#0a84ff',
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    },
    supervisor: {
        label: 'Supervisor',
        color: '#30d158',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    },
    broker: {
        label: 'Broker',
        color: '#ff9f0a',
        icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    },
    encoder: {
        label: 'Encoder',
        color: '#64d2ff',
        icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    },
};

function RoleBadge({ role }: { role: string }) {
    const cfg = roleConfig[role] ?? { label: role, color: '#8e8e93', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' };
    return (
        <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ color: cfg.color, backgroundColor: `${cfg.color}18` }}
        >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
            </svg>
            {cfg.label}
        </span>
    );
}

export const UserManagement = () => {
    const { dateTime } = useOutletContext<LayoutContext>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: users = [], isLoading, isError } = useUsers();
    const createUser = useCreateUser();
    const updateUser = useUpdateUser();
    const deactivateUser = useDeactivateUser();
    const activateUser = useActivateUser();

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

    const handleDeactivate = async (userId: number) => {
        if (window.confirm('Are you sure you want to deactivate this user?')) {
            await deactivateUser.mutateAsync(userId);
        }
    };

    const handleActivate = async (userId: number) => {
        await activateUser.mutateAsync(userId);
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
                <div className="text-right hidden sm:block">
                    <p className="text-xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-xs text-text-muted">{dateTime.date}</p>
                </div>
            </div>

            {/* Stat Cards */}
            {(() => {
                const total = users.length;
                const active = users.filter(u => u.is_active).length;
                const inactive = total - active;
                const admins = users.filter(u => u.role === 'admin' || u.role === 'manager').length;
                const fieldStaff = users.filter(u => u.role === 'broker' || u.role === 'encoder').length;

                const cards = [
                    {
                        label: 'Total Users',
                        value: total,
                        sub: `${admins} admin/manager · ${fieldStaff} field`,
                        dot: null as string | null,
                    },
                    {
                        label: 'Active',
                        value: active,
                        sub: total > 0 ? `${Math.round((active / total) * 100)}% of total` : '—',
                        dot: '#22c55e' as string | null,
                    },
                    {
                        label: 'Inactive',
                        value: inactive,
                        sub: inactive === 0 ? 'All users active' : `${inactive} deactivated`,
                        dot: inactive > 0 ? '#ef4444' as string | null : null,
                    },
                    {
                        label: 'Supervisors+',
                        value: users.filter(u => ['admin', 'manager', 'supervisor'].includes(u.role)).length,
                        sub: 'admin · manager · supervisor',
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
                            className="w-full pl-9 pr-3 h-9 rounded-md border border-border-strong bg-input-bg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-xs font-bold transition-all shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700 text-white"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Create User
                    </button>
                </div>

                {isLoading ? (
                    <div className="p-16 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#0a84ff' }} />
                    </div>
                ) : isError ? (
                    <div className="p-16 text-center">
                        <p className="text-sm text-red-500 font-medium">Failed to load users. Please try again.</p>
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
                                    {['Name', 'Email', 'Role', 'Status', 'Actions'].map((h, i) => (
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
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                                    style={{ backgroundColor: roleConfig[user.role]?.color ?? '#8e8e93' }}>
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-semibold text-text-primary">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-text-secondary text-center">{user.email}</td>
                                        <td className="px-5 py-3.5 text-center"><RoleBadge role={user.role} /></td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                                                style={user.is_active
                                                    ? { color: '#30d158', backgroundColor: 'rgba(48,209,88,0.12)' }
                                                    : { color: '#ff453a', backgroundColor: 'rgba(255,69,58,0.12)' }
                                                }
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: user.is_active ? '#30d158' : '#ff453a' }} />
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-white/10"
                                                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#e5e5ea' }}
                                                >
                                                    Edit
                                                </button>

                                                {user.is_active ? (
                                                    <button
                                                        onClick={() => handleDeactivate(user.id)}
                                                        disabled={deactivateUser.isPending}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 hover:opacity-80"
                                                        style={{ backgroundColor: 'rgba(255,69,58,0.12)', color: '#ff453a' }}
                                                    >
                                                        Deactivate
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleActivate(user.id)}
                                                        disabled={activateUser.isPending}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 hover:opacity-80"
                                                        style={{ backgroundColor: 'rgba(48,209,88,0.12)', color: '#30d158' }}
                                                    >
                                                        Activate
                                                    </button>
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
        </div>
    );
};
