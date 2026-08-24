import { useEffect, useState } from 'react';
import { AlertCircle, Globe, X } from 'lucide-react';
import { getApiError } from '../../../lib/apiErrors';
import type { Country, CountryType, CreateCountryData, UpdateCountryData } from '../types/country.types';

interface CountryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateCountryData | UpdateCountryData) => Promise<void>;
    country?: Country | null;
    mode: 'create' | 'edit';
}

const COUNTRY_TYPES: { value: CountryType; label: string }[] = [
    { value: 'both', label: 'Both (Import & Export)' },
    { value: 'import_origin', label: 'Import Origin' },
    { value: 'export_destination', label: 'Export Destination' },
];

const inputCls =
    'w-full px-3 py-2 rounded-lg border border-border/80 bg-background text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors';
const labelCls = 'block text-xs font-medium mb-1 text-foreground';

export const CountryFormModal = ({ isOpen, onClose, onSubmit, country, mode }: CountryFormModalProps) => {
    const [formData, setFormData] = useState<{
        name: string;
        code: string;
        type: CountryType;
    }>({
        name: '',
        code: '',
        type: 'both',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (mode === 'edit' && country) {
            setFormData({
                name: country.name,
                code: country.code ?? '',
                type: country.type,
            });
        } else {
            setFormData({
                name: '',
                code: '',
                type: 'both',
            });
        }

        setError('');
    }, [country, isOpen, mode]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await onSubmit({
                name: formData.name.trim(),
                code: formData.code.trim() || null,
                type: formData.type,
            });
            onClose();
        } catch (err: unknown) {
            console.error('Save country failed:', err);
            setError(getApiError(err, 'save country'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-backdrop-in"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-xl p-6 bg-card border border-border shadow-xl animate-modal-in"
                onClick={(event) => event.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border/80">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            <Globe className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">
                                {mode === 'create' ? 'Add Country' : 'Edit Country'}
                            </h2>
                            <p className="text-[11px] text-muted-foreground">
                                {mode === 'create'
                                    ? 'Register a trade partner country for transaction records'
                                    : 'Update country name, ISO code, or flow usage'}
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

                {/* Error Banner */}
                {error ? (
                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                ) : null}

                <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                    <div>
                        <label htmlFor="country-name" className={labelCls}>
                            Country Name *
                        </label>
                        <input
                            id="country-name"
                            type="text"
                            value={formData.name}
                            onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                            placeholder="e.g. Philippines"
                            required
                            className={inputCls}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="country-code" className={labelCls}>
                                Country Code
                            </label>
                            <input
                                id="country-code"
                                type="text"
                                value={formData.code}
                                onChange={(event) =>
                                    setFormData({ ...formData, code: event.target.value.toUpperCase() })
                                }
                                maxLength={3}
                                placeholder="e.g. PH"
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label htmlFor="country-type" className={labelCls}>
                                Country Usage *
                            </label>
                            <select
                                id="country-type"
                                value={formData.type}
                                onChange={(event) =>
                                    setFormData({ ...formData, type: event.target.value as CountryType })
                                }
                                required
                                className={inputCls}
                            >
                                {COUNTRY_TYPES.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Add Country' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
