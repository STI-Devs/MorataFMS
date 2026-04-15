import { useEffect, useState } from 'react';
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
    { value: 'both', label: 'Both' },
    { value: 'import_origin', label: 'Import Origin' },
    { value: 'export_destination', label: 'Export Destination' },
];

const inputCls = 'w-full px-4 py-3 rounded-xl border border-border bg-input-bg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition-colors';
const labelCls = 'block text-sm font-medium mb-2 text-text-secondary';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-backdrop-in" onClick={onClose}>
            <div
                className="w-full max-w-xl rounded-2xl p-8 bg-surface border border-border shadow-xl animate-modal-in"
                onClick={(event) => event.stopPropagation()}
            >
                <h2 className="text-2xl font-bold mb-6 text-text-primary">
                    {mode === 'create' ? 'Add Country' : 'Edit Country'}
                </h2>

                {error && (
                    <div className="mb-4 p-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(255,69,58,0.1)', color: '#ff453a' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label htmlFor="country-name" className={labelCls}>Country Name *</label>
                            <input
                                id="country-name"
                                type="text"
                                value={formData.name}
                                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                                required
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label htmlFor="country-code" className={labelCls}>Country Code</label>
                            <input
                                id="country-code"
                                type="text"
                                value={formData.code}
                                onChange={(event) => setFormData({ ...formData, code: event.target.value.toUpperCase() })}
                                maxLength={3}
                                placeholder="e.g. PH"
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label htmlFor="country-type" className={labelCls}>Country Usage *</label>
                            <select
                                id="country-type"
                                value={formData.type}
                                onChange={(event) => setFormData({ ...formData, type: event.target.value as CountryType })}
                                required
                                className={inputCls}
                            >
                                {COUNTRY_TYPES.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
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
                            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Add Country' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
