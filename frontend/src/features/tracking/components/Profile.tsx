import { useEffect, useState } from 'react';
import { useAuth } from '../../auth';

export const Profile = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        password: '',
        confirmPassword: '',
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
            }));
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        // TODO: wire up API call
        console.log('Saving profile:', formData);
    };

    const initials = (user?.name || 'U')
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const roleLabel = (user?.role || 'user').charAt(0).toUpperCase() + (user?.role || 'user').slice(1);

    return (
        <div className="min-h-full flex items-start justify-center py-8 px-4">
            <div className="w-full max-w-3xl">

                {/* Page title */}
                <h1 className="text-3xl font-bold text-text-primary mb-6">Profile</h1>

                {/* Main card */}
                <div className="bg-surface border border-border/60 rounded-lg overflow-hidden">
                    <div className="flex flex-col md:flex-row">

                        {/* ── Left panel ────────────────────────────── */}
                        <div className="md:w-56 shrink-0 flex flex-col items-center gap-4 px-6 py-8 border-b md:border-b-0 md:border-r border-border/40 bg-surface-secondary/40">

                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg select-none">
                                    {initials}
                                </div>
                                <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-surface border border-border rounded-full flex items-center justify-center hover:bg-hover transition-colors shadow-sm">
                                    <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                            </div>

                            <button className="text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors">
                                Upload Picture
                            </button>

                            {/* User name + role badge */}
                            <div className="text-center">
                                <p className="text-sm font-bold text-text-primary">{user?.name || 'User'}</p>
                                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400">
                                    {roleLabel}
                                </span>
                            </div>

                            <div className="w-full border-t border-border/40 pt-4 space-y-2 text-xs text-text-secondary">
                                <div className="flex items-center gap-2">
                                    <svg className="w-3.5 h-3.5 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="truncate">{user?.email || '—'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-3.5 h-3.5 text-text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    <span className="capitalize">{user?.role || '—'}</span>
                                </div>
                            </div>
                        </div>

                        {/* ── Right panel ───────────────────────────── */}
                        <div className="flex-1 px-8 py-8 space-y-5">

                            {/* Name */}
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Name:</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-surface-secondary/60 text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
                                />
                            </div>

                            {/* Role (read-only) */}
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Role:</label>
                                <input
                                    type="text"
                                    value={roleLabel}
                                    disabled
                                    className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-surface-secondary text-text-muted cursor-not-allowed"
                                    title="Role cannot be changed"
                                />
                            </div>

                            {/* Email (read-only) */}
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">E-mail:</label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-surface-secondary text-text-muted cursor-not-allowed"
                                    title="Email cannot be changed"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">New Password:</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Leave blank to keep current password"
                                    className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-surface-secondary/60 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
                                />
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">Repeat Password:</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder="Repeat new password"
                                    className="w-full px-4 py-2.5 text-sm border border-border rounded-lg bg-surface-secondary/60 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
                                />
                            </div>

                            {/* Save button */}
                            <div className="pt-2 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    className="px-8 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                                >
                                    Update Information
                                </button>
                            </div>

                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
