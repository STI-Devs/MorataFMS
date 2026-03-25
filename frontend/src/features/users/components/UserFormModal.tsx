import { useEffect, useState } from 'react';
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
    { value: 'paralegal', label: 'Paralegal' },
    { value: 'admin', label: 'Admin' },
];

const inputCls = 'w-full px-4 py-3 rounded-xl border border-border bg-input-bg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const labelCls = 'block text-sm font-medium mb-2 text-text-secondary';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-backdrop-in" onClick={onClose}>
            <div
                className="w-full max-w-md rounded-2xl p-8 bg-surface border border-border shadow-xl animate-modal-in"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold mb-6 text-text-primary">
                    {mode === 'create' ? 'Create New User' : 'Edit User'}
                </h2>

                {error && (
                    <div className="mb-4 p-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(255,69,58,0.1)', color: '#ff453a' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="user-name" className={labelCls}>Name</label>
                        <input
                            id="user-name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                            required
                            className={inputCls}
                            disabled={mode === 'edit'}
                        />
                    </div>

                    <div>
                        <label htmlFor="user-job-title" className={labelCls}>Job Title</label>
                        <input
                            id="user-job-title"
                            type="text"
                            value={formData.job_title}
                            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                            placeholder="e.g. Lawyer, Office Admin"
                            className={inputCls}
                        />
                    </div>

                    {mode === 'create' && (
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
                                    className={inputCls}
                                />
                            </div>
                        </>
                    )}

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

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 rounded-xl font-bold border border-border text-text-secondary hover:text-text-primary hover:border-border-strong transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 rounded-xl font-bold bg-gradient-to-br from-blue-600 to-indigo-700 text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create User' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

