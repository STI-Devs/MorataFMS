import { useEffect, useState } from 'react';
import { getApiError } from '../../../lib/apiErrors';
import api from '../../../lib/axios';
import type { Client, ClientType, Country, CreateClientData, UpdateClientData } from '../types/client.types';

interface ClientFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateClientData | UpdateClientData) => Promise<void>;
    client?: Client | null;
    mode: 'create' | 'edit';
}

const CLIENT_TYPES: ClientType[] = ['importer', 'exporter', 'both'];

const inputCls = 'w-full px-4 py-3 rounded-xl border border-border bg-input-bg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition-colors';
const labelCls = 'block text-sm font-medium mb-2 text-text-secondary';

export const ClientFormModal = ({ isOpen, onClose, onSubmit, client, mode }: ClientFormModalProps) => {
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
        const loadCountries = async () => {
            try {
                const response = await api.get('/api/countries');
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
            setFormData({ name: '', type: 'both', country_id: null, contact_person: '', contact_email: '', contact_phone: '', address: '' });
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
        } catch (err: unknown) {
            console.error('Save client failed:', err);
            setError(getApiError(err, 'save client'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-backdrop-in" onClick={onClose}>
            <div
                className="w-full max-w-2xl rounded-2xl p-8 max-h-[90vh] overflow-y-auto bg-surface border border-border shadow-xl animate-modal-in"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold mb-6 text-text-primary">
                    {mode === 'create' ? 'Create New Client' : 'Edit Client'}
                </h2>

                {error && (
                    <div className="mb-4 p-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(255,69,58,0.1)', color: '#ff453a' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className={labelCls}>Client Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Client Type *</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as ClientType })}
                                required
                                className={`${inputCls} capitalize`}
                            >
                                {CLIENT_TYPES.map((type) => (
                                    <option key={type} value={type} className="capitalize">{type}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelCls}>Country</label>
                            <select
                                value={formData.country_id || ''}
                                onChange={(e) => setFormData({ ...formData, country_id: e.target.value ? Number(e.target.value) : null })}
                                className={inputCls}
                            >
                                <option value="">Select a country</option>
                                {countries.map((country) => (
                                    <option key={country.id} value={country.id}>{country.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className={labelCls}>Contact Person</label>
                            <input
                                type="text"
                                value={formData.contact_person}
                                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Contact Email</label>
                            <input
                                type="email"
                                value={formData.contact_email}
                                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                className={inputCls}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelCls}>Contact Phone</label>
                            <input
                                type="tel"
                                value={formData.contact_phone}
                                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                className={inputCls}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelCls}>Address</label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                rows={3}
                                className={inputCls}
                            />
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
                            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Client' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
