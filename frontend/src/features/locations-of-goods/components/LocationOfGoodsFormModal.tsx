import { useEffect, useState } from 'react';
import { getApiError } from '../../../lib/apiErrors';
import type {
    CreateLocationOfGoodsData,
    LocationOfGoods,
    UpdateLocationOfGoodsData,
} from '../types/locationOfGoods.types';

interface LocationOfGoodsFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateLocationOfGoodsData | UpdateLocationOfGoodsData) => Promise<void>;
    locationOfGoods?: LocationOfGoods | null;
    mode: 'create' | 'edit';
}

const inputCls = 'w-full px-4 py-3 rounded-xl border border-border bg-input-bg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition-colors';
const labelCls = 'block text-sm font-medium mb-2 text-text-secondary';

export const LocationOfGoodsFormModal = ({
    isOpen,
    onClose,
    onSubmit,
    locationOfGoods,
    mode,
}: LocationOfGoodsFormModalProps) => {
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setName(mode === 'edit' && locationOfGoods ? locationOfGoods.name : '');
        setError('');
    }, [isOpen, locationOfGoods, mode]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await onSubmit({ name: name.trim() });
            onClose();
        } catch (err: unknown) {
            console.error('Save location of goods failed:', err);
            setError(getApiError(err, 'save location of goods'));
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
                    {mode === 'create' ? 'Add Location of Goods' : 'Edit Location of Goods'}
                </h2>

                {error && (
                    <div className="mb-4 p-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(255,69,58,0.1)', color: '#ff453a' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="location-of-goods-name" className={labelCls}>Location Name *</label>
                        <input
                            id="location-of-goods-name"
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            required
                            placeholder="e.g. MICP Container Yard"
                            className={inputCls}
                        />
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
                            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Add Location' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
