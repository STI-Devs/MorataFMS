import { useEffect, useState } from 'react';
import { useAuth } from '../../auth';
import { authApi } from '../../auth/api/authApi';

export const Profile = () => {
    const { user, setUser } = useAuth();
    const [formData, setFormData] = useState({
        name:            user?.name || '',
        password:        '',
        confirmPassword: '',
    });
    const [saving,  setSaving]  = useState(false);
    const [success, setSuccess] = useState(false);
    const [error,   setError]   = useState<string | null>(null);

    useEffect(() => {
        if (user) setFormData(prev => ({ ...prev, name: user.name || '' }));
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setError(null);
        setSuccess(false);

        if (formData.password && formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (formData.password && formData.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        setSaving(true);
        try {
            const payload: { name?: string; password?: string; password_confirmation?: string } = {};
            if (formData.name.trim())  payload.name = formData.name.trim();
            if (formData.password) {
                payload.password              = formData.password;
                payload.password_confirmation = formData.confirmPassword;
            }

            const updated = await authApi.updateProfile(payload);
            setUser(updated);
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string; errors?: { name?: string[]; password?: string[] } } } };
            const msg =
                e?.response?.data?.message      ||
                e?.response?.data?.errors?.name?.[0]     ||
                e?.response?.data?.errors?.password?.[0] ||
                'Failed to update profile. Please try again.';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    const initials  = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const roleLabel = (user?.role || 'user').charAt(0).toUpperCase() + (user?.role || 'user').slice(1);

    return (
        <div className="min-h-full flex items-start justify-center py-8 px-4">
            <div className="w-full max-w-3xl">

                <h1 className="text-3xl font-bold text-text-primary mb-6">Profile</h1>

                <div className="bg-surface border border-border rounded-xl overflow-hidden">
                    <div className="flex flex-col md:flex-row">

                        {/* Left panel — avatar + user info */}
                        <div className="md:w-56 shrink-0 flex flex-col items-center gap-4 px-6 py-8 border-b md:border-b-0 md:border-r border-border bg-surface-secondary/40">

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

                            <div className="text-center">
                                <p className="text-sm font-bold text-text-primary">{user?.name || 'User'}</p>
                                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400">
                                    {roleLabel}
                                </span>
                            </div>

                            <div className="w-full border-t border-border pt-4 space-y-2 text-xs text-text-secondary">
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

                        {/* Right panel — form */}
                        <div className="flex-1 px-8 py-8 space-y-5">

                            {[
                                { label: 'Name',         name: 'name',    type: 'text',     value: formData.name,            editable: true,  placeholder: '' },
                                { label: 'Role',         name: 'role',    type: 'text',     value: roleLabel,                editable: false, placeholder: '' },
                                { label: 'E-mail',       name: 'email',   type: 'email',    value: user?.email || '',         editable: false, placeholder: '' },
                                { label: 'New Password', name: 'password', type: 'password', value: formData.password,        editable: true,  placeholder: 'Leave blank to keep current password' },
                                { label: 'Repeat Password', name: 'confirmPassword', type: 'password', value: formData.confirmPassword, editable: true, placeholder: 'Repeat new password' },
                            ].map(field => (
                                <div key={field.name}>
                                    <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                                        {field.label}:
                                    </label>
                                    <input
                                        type={field.type}
                                        name={field.name}
                                        value={field.value}
                                        disabled={!field.editable}
                                        onChange={field.editable ? handleInputChange : undefined}
                                        placeholder={field.placeholder}
                                        title={!field.editable ? `${field.label} cannot be changed` : undefined}
                                        className={`w-full px-4 py-2.5 text-sm border border-border rounded-lg transition-all ${
                                            field.editable
                                                ? 'bg-surface-secondary/60 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60'
                                                : 'bg-surface-secondary text-text-muted cursor-not-allowed'
                                        }`}
                                    />
                                </div>
                            ))}

                            {/* Feedback + save */}
                            <div className="pt-2 flex flex-col gap-2">
                                {error && (
                                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
                                )}
                                {success && (
                                    <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">Profile updated successfully!</p>
                                )}
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-8 py-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {saving ? 'Saving…' : 'Update Information'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
