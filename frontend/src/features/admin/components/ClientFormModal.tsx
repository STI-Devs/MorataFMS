import { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import type { Client, CreateClientData, UpdateClientData, ClientType, Country } from '../types/client.types';
import api from '../../../lib/axios';

interface ClientFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateClientData | UpdateClientData) => Promise<void>;
    client?: Client | null;
    mode: 'create' | 'edit';
}

const CLIENT_TYPES: ClientType[] = ['importer', 'exporter', 'both'];

export const ClientFormModal = ({ isOpen, onClose, onSubmit, client, mode }: ClientFormModalProps) => {
    const { theme } = useTheme();
    const [formData, setFormData] = useState({
        name: '',
        type: 'both' as ClientType,
        country_id: null as number | null,
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        address: '',
    });
    const [countries, setCountries] = useState<Country[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Load countries
        const loadCountries = async () => {
            try {
                const response = await api.get('/api/countries');
                // CountryController returns { data: [...] }, so we need response.data.data
                const list = response.data?.data ?? response.data ?? [];
                setCountries(Array.isArray(list) ? list : []);
            } catch (err) {
                console.error('Failed to load countries:', err);
            }
        };
        loadCountries();
    }, []);

    useEffect(() => {
        if (mode === 'edit' && client) {
            setFormData({
                name: client.name,
                type: client.type,
                country_id: client.country_id,
                contact_person: client.contact_person || '',
                contact_email: client.contact_email || '',
                contact_phone: client.contact_phone || '',
                address: client.address || '',
            });
        } else {
            setFormData({
                name: '',
                type: 'both',
                country_id: null,
                contact_person: '',
                contact_email: '',
                contact_phone: '',
                address: '',
            });
        }
        setError('');
    }, [mode, client, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await onSubmit(formData);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <div
                className={`w-full max-w-2xl rounded-[2rem] p-8 max-h-[90vh] overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                    {mode === 'create' ? 'Create New Client' : 'Edit Client'}
                </h2>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                Client Name *
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
                                Client Type *
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as ClientType })}
                                required
                                className={`w-full px-4 py-3 rounded-xl border transition-colors ${theme === 'dark'
                                    ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-500'
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-gray-400'
                                    } focus:outline-none capitalize`}
                            >
                                {CLIENT_TYPES.map((type) => (
                                    <option key={type} value={type} className="capitalize">
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                Country
                            </label>
                            <select
                                value={formData.country_id || ''}
                                onChange={(e) => setFormData({ ...formData, country_id: e.target.value ? Number(e.target.value) : null })}
                                className={`w-full px-4 py-3 rounded-xl border transition-colors ${theme === 'dark'
                                    ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-500'
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-gray-400'
                                    } focus:outline-none`}
                            >
                                <option value="">Select a country</option>
                                {countries.map((country) => (
                                    <option key={country.id} value={country.id}>
                                        {country.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                Contact Person
                            </label>
                            <input
                                type="text"
                                value={formData.contact_person}
                                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                                className={`w-full px-4 py-3 rounded-xl border transition-colors ${theme === 'dark'
                                    ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-500'
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-gray-400'
                                    } focus:outline-none`}
                            />
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                Contact Email
                            </label>
                            <input
                                type="email"
                                value={formData.contact_email}
                                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                className={`w-full px-4 py-3 rounded-xl border transition-colors ${theme === 'dark'
                                    ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-500'
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-gray-400'
                                    } focus:outline-none`}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                Contact Phone
                            </label>
                            <input
                                type="tel"
                                value={formData.contact_phone}
                                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                className={`w-full px-4 py-3 rounded-xl border transition-colors ${theme === 'dark'
                                    ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-500'
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-gray-400'
                                    } focus:outline-none`}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                Address
                            </label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                rows={3}
                                className={`w-full px-4 py-3 rounded-xl border transition-colors ${theme === 'dark'
                                    ? 'bg-gray-700 border-gray-600 text-white focus:border-gray-500'
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-gray-400'
                                    } focus:outline-none`}
                            />
                        </div>
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
                            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Client' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
