import { useEffect, useState } from 'react';
import { AlertCircle, UserPlus, X } from 'lucide-react';
import { getApiError } from '../../../lib/apiErrors';
import type { CreateUserData, UpdateUserData, User, UserRole } from '../types/user.types';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateUserData | UpdateUserData) => Promise<void>;
    user?: User | null;
    mode: 'create' | 'edit';
}

const ROLES: { value: UserRole; label: string }[] = [
    { value: 'encoder', label: 'Encoder' },
    { value: 'processor', label: 'Processor' },
    { value: 'accounting', label: 'Accountant' },
    { value: 'paralegal', label: 'Paralegal' },
    { value: 'admin', label: 'Admin' },
];

const inputCls =
    'w-full rounded-lg border border-border bg-background py-2 px-3 text-xs font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground transition-colors hover:bg-muted/30 focus:border-blue-500/50 focus:bg-background focus:outline-none focus:ring-1 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs';
const labelCls = 'block text-xs font-semibold text-foreground mb-1.5';

export const UserFormModal = ({ isOpen, onClose, onSubmit, user, mode }: UserFormModalProps) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        job_title: '',
        password: '',
        password_confirmation: '',
        role: 'encoder' as UserRole,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (mode === 'edit' && user) {
            setFormData({
                name: user.name,
                email: user.email,
                job_title: user.job_title || '',
                password: '',
                password_confirmation: '',
                role: user.role,
            });
        } else {
            setFormData({
                name: '',
                email: '',
                job_title: '',
                password: '',
                password_confirmation: '',
                role: 'encoder',
            });
        }
        setError('');
    }, [mode, user, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            if (mode === 'create') {
                if (formData.password !== formData.password_confirmation) {
                    setError('Password confirmation does not match.');
                    setIsSubmitting(false);

                    return;
                }

                await onSubmit({
                    ...formData,
                    job_title: formData.job_title.trim() || undefined,
                } as CreateUserData);
            } else {
                const updateData: UpdateUserData = {
                    name: formData.name,
                    email: formData.email,
                    job_title: formData.job_title.trim() || null,
                    role: formData.role,
                };
                await onSubmit(updateData);
            }
            onClose();
        } catch (err: unknown) {
            console.error('Save user failed:', err);
            setError(getApiError(err, 'save user'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-backdrop-in" onClick={onClose}>
            <div
                className="w-full max-w-md rounded-xl p-6 bg-card border border-border shadow-xl animate-modal-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pb-4 border-b border-border/80">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            <UserPlus className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">
                                {mode === 'create' ? 'Create New User' : 'Edit User Profile'}
                            </h2>
                            <p className="text-[11px] text-muted-foreground">
                                {mode === 'create' ? 'Add a new member to the operations team' : 'Update account metadata and role access'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {error ? (
                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                ) : null}

                <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                    <div>
                        <label htmlFor="user-name" className={labelCls}>Name</label>
                        <input
                            id="user-name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Maria Santos"
                            required
                            className={inputCls}
                            disabled={mode === 'edit'}
                        />
                    </div>

                    <div>
                        <label htmlFor="user-email" className={labelCls}>Email</label>
                        <input
                            id="user-email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="e.g. maria.santos@morata.com"
                            required
                            className={inputCls}
                            disabled={mode === 'edit'}
                        />
                    </div>

                    <div>
                        <label htmlFor="user-job-title" className={labelCls}>Position</label>
                        <input
                            id="user-job-title"
                            type="text"
                            value={formData.job_title}
                            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                            placeholder="e.g. Lawyer, Office Admin, Senior Broker"
                            className={inputCls}
                        />
                    </div>

                    {mode === 'create' ? (
                        <>
                            <div>
                                <label htmlFor="user-password" className={labelCls}>Password</label>
                                <input
                                    id="user-password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    minLength={8}
                                    placeholder="Minimum 8 characters"
                                    className={inputCls}
                                />
                            </div>

                            <div>
                                <label htmlFor="user-password-confirmation" className={labelCls}>Confirm Password</label>
                                <input
                                    id="user-password-confirmation"
                                    type="password"
                                    value={formData.password_confirmation}
                                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                    required
                                    minLength={8}
                                    placeholder="Re-enter password"
                                    className={inputCls}
                                />
                            </div>
                        </>
                    ) : null}

                    <div>
                        <label htmlFor="user-role" className={labelCls}>Role</label>
                        <select
                            id="user-role"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                            required
                            className={`${inputCls} capitalize`}
                        >
                            {ROLES.map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/80">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center justify-center rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                        >
                            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create User' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
