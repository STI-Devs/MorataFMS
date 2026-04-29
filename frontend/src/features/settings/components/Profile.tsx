import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth';
import { authApi } from '../../auth/api/authApi';
import { Icon } from '../../../components/Icon';

type SectionKey = 'profile' | 'password';
type StrengthTone = 'red' | 'amber' | 'blue' | 'green' | 'muted';

interface PasswordVisibility {
    current: boolean;
    next: boolean;
    confirm: boolean;
}

const STRENGTH_BAR_TONE: Record<StrengthTone, string> = {
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    muted: 'bg-border',
};

const STRENGTH_TEXT_TONE: Record<StrengthTone, string> = {
    red: 'text-red-500',
    amber: 'text-amber-500',
    blue: 'text-blue-500',
    green: 'text-green-500',
    muted: 'text-text-muted',
};

function getPasswordStrength(password: string): { score: number; label: string; tone: StrengthTone } {
    if (!password) return { score: 0, label: 'Enter a password', tone: 'muted' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    score = Math.min(score, 4);

    const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
    const tones: StrengthTone[] = ['red', 'red', 'amber', 'blue', 'green'];
    return { score, label: labels[score], tone: tones[score] };
}

export const Profile = () => {
    const { user, setUser } = useAuth();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        jobTitle: user?.job_title || '',
        currentPassword: '',
        password: '',
        confirmPassword: '',
    });
    const [saving, setSaving] = useState<SectionKey | null>(null);
    const [success, setSuccess] = useState<SectionKey | null>(null);
    const [error, setError] = useState<{ section: SectionKey; message: string } | null>(null);
    const [showPasswords, setShowPasswords] = useState<PasswordVisibility>({ current: false, next: false, confirm: false });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                jobTitle: user.job_title || '',
            }));
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const togglePassword = (key: keyof PasswordVisibility) => {
        setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const extractError = (err: unknown, fallback: string): string => {
        const e = err as { response?: { data?: { message?: string; errors?: { name?: string[]; job_title?: string[]; current_password?: string[]; password?: string[] } } } };
        return (
            e?.response?.data?.errors?.current_password?.[0] ||
            e?.response?.data?.errors?.password?.[0] ||
            e?.response?.data?.errors?.name?.[0] ||
            e?.response?.data?.errors?.job_title?.[0] ||
            e?.response?.data?.message ||
            fallback
        );
    };

    const handleProfileSave = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        if (!formData.name.trim()) {
            setError({ section: 'profile', message: 'Name cannot be empty.' });
            return;
        }

        setSaving('profile');
        try {
            const updated = await authApi.updateProfile({
                name: formData.name.trim(),
                job_title: formData.jobTitle.trim() || null,
            });
            setUser(updated);
            setFormData(prev => ({ ...prev, name: updated.name || '', jobTitle: updated.job_title || '' }));
            setSuccess('profile');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError({ section: 'profile', message: extractError(err, 'Failed to update profile. Please try again.') });
        } finally {
            setSaving(null);
        }
    };

    const handlePasswordSave = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        if (!formData.currentPassword) {
            setError({ section: 'password', message: 'Please enter your current password.' });
            return;
        }
        if (!formData.password) {
            setError({ section: 'password', message: 'Please enter a new password.' });
            return;
        }
        if (formData.password.length < 8) {
            setError({ section: 'password', message: 'New password must be at least 8 characters.' });
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError({ section: 'password', message: 'New passwords do not match.' });
            return;
        }

        setSaving('password');
        try {
            const updated = await authApi.updateProfile({
                current_password: formData.currentPassword,
                password: formData.password,
                password_confirmation: formData.confirmPassword,
            });
            setUser(updated);
            setFormData(prev => ({ ...prev, currentPassword: '', password: '', confirmPassword: '' }));
            setShowPasswords({ current: false, next: false, confirm: false });
            setSuccess('password');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError({ section: 'password', message: extractError(err, 'Failed to update password. Please try again.') });
        } finally {
            setSaving(null);
        }
    };

    const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const roleLabel = user?.role_label || ((user?.role || 'user').charAt(0).toUpperCase() + (user?.role || 'user').slice(1));
    const jobTitleLabel = user?.job_title || 'No job title set';
    const strength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);
    const isProfileBusy = saving === 'profile';
    const isPasswordBusy = saving === 'password';
    const profileFieldInvalid = error?.section === 'profile';
    const passwordFieldInvalid = error?.section === 'password';

    return (
        <div className="min-h-full px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-3xl space-y-6">

                {/* Page header */}
                <header>
                    <h1 className="text-2xl font-bold tracking-tight text-text-primary">Profile</h1>
                    <p className="mt-1 text-sm text-text-secondary">Manage your account information and security settings.</p>
                </header>

                {/* Identity summary */}
                <section
                    aria-label="Account identity"
                    className="rounded-xl border border-border bg-surface p-5 shadow-sm"
                >
                    <div className="flex items-center gap-4">
                        <div
                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-base font-bold text-white shadow-sm"
                            aria-hidden="true"
                        >
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-base font-semibold text-text-primary">{user?.name || 'User'}</p>
                                <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-500">
                                    {roleLabel}
                                </span>
                            </div>
                            <p className="mt-0.5 truncate text-sm text-text-secondary">{user?.email || '—'}</p>
                            <p className="mt-0.5 truncate text-xs text-text-muted">{jobTitleLabel}</p>
                        </div>
                    </div>
                </section>

                {/* Profile Information */}
                <form
                    onSubmit={handleProfileSave}
                    className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
                    aria-labelledby="profile-info-heading"
                    noValidate
                >
                    <header className="border-b border-border px-5 py-4">
                        <div className="flex items-center gap-2">
                            <Icon name="user" className="h-4 w-4 text-text-muted" />
                            <h2 id="profile-info-heading" className="text-sm font-bold text-text-primary">Profile Information</h2>
                        </div>
                        <p className="mt-1 text-xs text-text-muted">
                            Update your display name and job title. Role and e-mail are managed by an administrator.
                        </p>
                    </header>

                    <div className="space-y-5 px-5 py-5">
                        <div>
                            <label htmlFor="profile-name" className="block text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                Name
                            </label>
                            <input
                                id="profile-name"
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                aria-invalid={profileFieldInvalid}
                                disabled={isProfileBusy}
                                autoComplete="name"
                                className="mt-1.5 w-full rounded-lg border border-border bg-surface-secondary/60 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                        </div>

                        <div>
                            <label htmlFor="profile-jobtitle" className="block text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                Job Title
                            </label>
                            <input
                                id="profile-jobtitle"
                                type="text"
                                name="jobTitle"
                                value={formData.jobTitle}
                                onChange={handleInputChange}
                                placeholder="e.g. Lawyer, Managing Partner"
                                disabled={isProfileBusy}
                                autoComplete="organization-title"
                                className="mt-1.5 w-full rounded-lg border border-border bg-surface-secondary/60 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                            <p className="mt-1 text-xs text-text-muted">
                                Optional. Shown next to your name in record headers.
                            </p>
                        </div>

                        <dl className="grid grid-cols-1 gap-4 rounded-lg border border-dashed border-border bg-surface-secondary/30 px-4 py-3 sm:grid-cols-2">
                            <div className="min-w-0">
                                <dt className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Role</dt>
                                <dd className="mt-0.5 truncate text-sm font-medium text-text-primary">{roleLabel}</dd>
                            </div>
                            <div className="min-w-0">
                                <dt className="text-[10px] font-bold uppercase tracking-wider text-text-muted">E-mail</dt>
                                <dd className="mt-0.5 truncate text-sm font-medium text-text-primary" title={user?.email || ''}>
                                    {user?.email || '—'}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <footer className="flex flex-col gap-3 border-t border-border bg-surface-secondary/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <SectionFeedback
                            success={success === 'profile' ? 'Profile updated successfully.' : null}
                            error={error?.section === 'profile' ? error.message : null}
                        />
                        <button
                            type="submit"
                            disabled={saving !== null}
                            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isProfileBusy ? 'Saving…' : 'Save Profile'}
                        </button>
                    </footer>
                </form>

                {/* Security */}
                <form
                    onSubmit={handlePasswordSave}
                    className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
                    aria-labelledby="security-heading"
                    noValidate
                >
                    <header className="border-b border-border px-5 py-4">
                        <div className="flex items-center gap-2">
                            <Icon name="lock" className="h-4 w-4 text-text-muted" />
                            <h2 id="security-heading" className="text-sm font-bold text-text-primary">Security</h2>
                        </div>
                        <p className="mt-1 text-xs text-text-muted">
                            Change your password. Other devices signed in to this account will be signed out after a successful change.
                        </p>
                    </header>

                    <div className="space-y-5 px-5 py-5">
                        <PasswordField
                            id="security-current"
                            name="currentPassword"
                            label="Current Password"
                            value={formData.currentPassword}
                            visible={showPasswords.current}
                            onToggleVisible={() => togglePassword('current')}
                            onChange={handleInputChange}
                            placeholder="Enter your current password"
                            autoComplete="current-password"
                            invalid={passwordFieldInvalid}
                            disabled={isPasswordBusy}
                        />

                        <div>
                            <PasswordField
                                id="security-new"
                                name="password"
                                label="New Password"
                                value={formData.password}
                                visible={showPasswords.next}
                                onToggleVisible={() => togglePassword('next')}
                                onChange={handleInputChange}
                                placeholder="At least 8 characters"
                                autoComplete="new-password"
                                invalid={passwordFieldInvalid}
                                disabled={isPasswordBusy}
                                ariaDescribedBy="security-new-strength security-new-helper"
                            />
                            <div id="security-new-strength" className="mt-2">
                                <div className="flex gap-1.5" aria-hidden="true">
                                    {[0, 1, 2, 3].map(i => (
                                        <span
                                            key={i}
                                            className={`h-1 flex-1 rounded-full transition-colors ${
                                                i < strength.score ? STRENGTH_BAR_TONE[strength.tone] : STRENGTH_BAR_TONE.muted
                                            }`}
                                        />
                                    ))}
                                </div>
                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                                    Strength:{' '}
                                    <span className={STRENGTH_TEXT_TONE[strength.tone]}>{strength.label}</span>
                                </p>
                            </div>
                            <p id="security-new-helper" className="mt-1 text-xs text-text-muted">
                                Use 8+ characters. A mix of upper and lower case, numbers, and symbols is strongest.
                            </p>
                        </div>

                        <PasswordField
                            id="security-confirm"
                            name="confirmPassword"
                            label="Confirm New Password"
                            value={formData.confirmPassword}
                            visible={showPasswords.confirm}
                            onToggleVisible={() => togglePassword('confirm')}
                            onChange={handleInputChange}
                            placeholder="Re-enter new password"
                            autoComplete="new-password"
                            invalid={passwordFieldInvalid}
                            disabled={isPasswordBusy}
                        />
                    </div>

                    <footer className="flex flex-col gap-3 border-t border-border bg-surface-secondary/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <SectionFeedback
                            success={success === 'password' ? 'Password updated successfully.' : null}
                            error={error?.section === 'password' ? error.message : null}
                        />
                        <button
                            type="submit"
                            disabled={saving !== null}
                            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isPasswordBusy ? 'Updating…' : 'Update Password'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

interface PasswordFieldProps {
    id: string;
    name: string;
    label: string;
    value: string;
    visible: boolean;
    onToggleVisible: () => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    autoComplete: string;
    ariaDescribedBy?: string;
    invalid?: boolean;
    disabled?: boolean;
}

function PasswordField({
    id,
    name,
    label,
    value,
    visible,
    onToggleVisible,
    onChange,
    placeholder,
    autoComplete,
    ariaDescribedBy,
    invalid,
    disabled,
}: PasswordFieldProps) {
    return (
        <div>
            <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {label}
            </label>
            <div className="relative mt-1.5">
                <input
                    id={id}
                    type={visible ? 'text' : 'password'}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    aria-describedby={ariaDescribedBy}
                    aria-invalid={invalid}
                    disabled={disabled}
                    className="w-full rounded-lg border border-border bg-surface-secondary/60 px-3 py-2 pr-10 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                    type="button"
                    onClick={onToggleVisible}
                    aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                    aria-pressed={visible}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-1.5 my-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-hover hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                    <Icon name={visible ? 'eye-off' : 'eye'} className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

interface SectionFeedbackProps {
    success: string | null;
    error: string | null;
}

function SectionFeedback({ success, error }: SectionFeedbackProps) {
    return (
        <div role="status" aria-live="polite" className="min-h-[1.25rem] text-xs">
            {success && (
                <span className="inline-flex items-center gap-1.5 text-green-500">
                    <Icon name="check-circle" className="h-3.5 w-3.5" />
                    {success}
                </span>
            )}
            {error && (
                <span className="inline-flex items-center gap-1.5 text-red-500">
                    <Icon name="alert-circle" className="h-3.5 w-3.5" />
                    {error}
                </span>
            )}
        </div>
    );
}
