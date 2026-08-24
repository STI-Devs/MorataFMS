import { useEffect, useState } from 'react';
import { AlertCircle, MapPin, X } from 'lucide-react';
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

const inputCls =
    'w-full px-3 py-2 rounded-lg border border-border/80 bg-background text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors';
const labelCls = 'block text-xs font-medium mb-1 text-foreground';

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
                            <MapPin className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">
                                {mode === 'create' ? 'Add Location of Goods' : 'Edit Location of Goods'}
                            </h2>
                            <p className="text-[11px] text-muted-foreground">
                                {mode === 'create'
                                    ? 'Register a port, warehouse, or yard for import declarations'
                                    : 'Update the name of this customs discharge facility'}
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
                        <label htmlFor="location-of-goods-name" className={labelCls}>
                            Location Name *
                        </label>
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
                            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Add Location' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
