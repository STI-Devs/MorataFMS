import { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import type { User, CreateUserData, UpdateUserData, UserRole } from '../types/user.types';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateUserData | UpdateUserData) => Promise<void>;
    user?: User | null;
    mode: 'create' | 'edit';
}

const ROLES: UserRole[] = ['encoder', 'broker', 'supervisor', 'manager', 'admin'];

export const UserFormModal = ({ isOpen, onClose, onSubmit, user, mode }: UserFormModalProps) => {
    const { theme } = useTheme();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'encoder' as UserRole,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (mode === 'edit' && user) {
            setFormData({
                name: user.name,
                email: user.email,
                password: '',
                role: user.role,
            });
        } else {
            setFormData({
                name: '',
                email: '',
                password: '',
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
                await onSubmit(formData as CreateUserData);
            } else {
                const updateData: UpdateUserData = {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                };
                await onSubmit(updateData);
            }
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div
                className={`w-full max-w-md rounded-[2rem] p-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                    {mode === 'create' ? 'Create New User' : 'Edit User'}
                </h2>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className={`w-full px-4 py-3 rounded-xl border transition-colors ${theme === 'dark'
                                    ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-500'
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-gray-400'
                                } focus:outline-none`}
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className={`w-full px-4 py-3 rounded-xl border transition-colors ${theme === 'dark'
                                    ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-500'
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-gray-400'
                                } focus:outline-none`}
                        />
                    </div>

                    {mode === 'create' && (
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                minLength={8}
                                className={`w-full px-4 py-3 rounded-xl border transition-colors ${theme === 'dark'
                                        ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-500'
                                        : 'bg-white border-gray-300 text-gray-900 focus:border-gray-400'
                                    } focus:outline-none`}
                            />
                        </div>
                    )}

                    <div>
                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            Role
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                            required
                            className={`w-full px-4 py-3 rounded-xl border transition-colors ${theme === 'dark'
                                    ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-500'
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-gray-400'
                                } focus:outline-none capitalize`}
                        >
                            {ROLES.map((role) => (
                                <option key={role} value={role} className="capitalize">
                                    {role}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className={`flex-1 px-6 py-3 rounded-xl font-bold border transition-colors ${theme === 'dark'
                                    ? 'border-gray-600 text-white hover:bg-gray-700'
                                    : 'border-gray-200 text-gray-900 hover:bg-gray-50'
                                } disabled:opacity-50`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create User' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
