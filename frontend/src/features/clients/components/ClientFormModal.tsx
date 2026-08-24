import { useEffect, useState } from 'react';
import { AlertCircle, Building2, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
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

const CLIENT_TYPES: { value: ClientType; label: string }[] = [
    { value: 'importer', label: 'Importer' },
    { value: 'exporter', label: 'Exporter' },
    { value: 'both', label: 'Both (Importer & Exporter)' },
];

const inputCls =
    'w-full rounded-lg border border-border bg-background py-2 px-3 text-xs font-medium text-foreground placeholder:font-normal placeholder:text-muted-foreground transition-colors hover:bg-muted/30 focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs';
const labelCls = 'block text-xs font-semibold text-foreground mb-1.5';

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
                const list = response?.data?.data ?? response?.data ?? [];
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-backdrop-in" onClick={onClose}>
            <div
                className="w-full max-w-lg rounded-xl p-6 bg-card border border-border shadow-xl animate-modal-in max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between pb-4 border-b border-border/80">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">
                                {mode === 'create' ? 'Create Brokerage Client' : 'Edit Brokerage Client'}
                            </h2>
                            <p className="text-[11px] text-muted-foreground">
                                {mode === 'create' ? 'Add a new client organization to brokerage records' : 'Update client profile, contact, and jurisdiction'}
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
                        <label htmlFor="client-name" className={labelCls}>Brokerage Client Name *</label>
                        <input
                            id="client-name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Acme Corporation"
                            required
                            className={inputCls}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="client-type" className={labelCls}>Client Type *</label>
                            <select
                                id="client-type"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as ClientType })}
                                required
                                className={inputCls}
                            >
                                {CLIENT_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="client-country" className={labelCls}>Country</label>
                            <select
                                id="client-country"
                                value={formData.country_id || ''}
                                onChange={(e) => setFormData({ ...formData, country_id: e.target.value ? Number(e.target.value) : null })}
                                className={inputCls}
                            >
                                <option value="">Select country...</option>
                                {countries.map((country) => (
                                    <option key={country.id} value={country.id}>{country.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="client-contact-person" className={labelCls}>Contact Person</label>
                            <input
                                id="client-contact-person"
                                type="text"
                                value={formData.contact_person}
                                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                                placeholder="e.g. John Doe"
                                className={inputCls}
                            />
                        </div>

                        <div>
                            <label htmlFor="client-contact-phone" className={labelCls}>Contact Phone</label>
                            <input
                                id="client-contact-phone"
                                type="tel"
                                value={formData.contact_phone}
                                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                placeholder="e.g. +63 912 345 6789"
                                className={inputCls}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="client-contact-email" className={labelCls}>Contact Email</label>
                        <input
                            id="client-contact-email"
                            type="email"
                            value={formData.contact_email}
                            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                            placeholder="e.g. contact@client.com"
                            className={inputCls}
                        />
                    </div>

                    <div>
                        <label htmlFor="client-address" className={labelCls}>Address</label>
                        <textarea
                            id="client-address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Complete office or warehouse address..."
                            rows={2}
                            className={inputCls}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="h-8 text-xs cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isSubmitting}
                            className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer"
                        >
                            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Client' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
