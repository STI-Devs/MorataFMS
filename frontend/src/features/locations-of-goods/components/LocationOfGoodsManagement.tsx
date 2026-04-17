import { useState } from 'react';
import { CurrentDateTime } from '../../../components/CurrentDateTime';
import {
    useCreateLocationOfGoods,
    useLocationsOfGoodsAdmin,
    useToggleLocationOfGoods,
    useUpdateLocationOfGoods,
} from '../hooks/useLocationsOfGoodsAdmin';
import type {
    CreateLocationOfGoodsData,
    LocationOfGoods,
    UpdateLocationOfGoodsData,
} from '../types/locationOfGoods.types';
import { LocationOfGoodsFormModal } from './LocationOfGoodsFormModal';

export const LocationOfGoodsManagement = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedLocation, setSelectedLocation] = useState<LocationOfGoods | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: locationsOfGoods = [], isLoading, isError } = useLocationsOfGoodsAdmin();
    const createLocationOfGoods = useCreateLocationOfGoods();
    const updateLocationOfGoods = useUpdateLocationOfGoods();
    const toggleLocationOfGoods = useToggleLocationOfGoods();

    const handleCreateLocation = async (data: CreateLocationOfGoodsData | UpdateLocationOfGoodsData) => {
        await createLocationOfGoods.mutateAsync(data as CreateLocationOfGoodsData);
        setIsFormModalOpen(false);
    };

    const handleUpdateLocation = async (data: CreateLocationOfGoodsData | UpdateLocationOfGoodsData) => {
        if (!selectedLocation) {
            return;
        }

        await updateLocationOfGoods.mutateAsync({
            id: selectedLocation.id,
            data: data as UpdateLocationOfGoodsData,
        });
        setIsFormModalOpen(false);
    };

    const handleToggleActive = async (locationId: number) => {
        await toggleLocationOfGoods.mutateAsync(locationId);
    };

    const handleEdit = (location: LocationOfGoods) => {
        setSelectedLocation(location);
        setModalMode('edit');
        setIsFormModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedLocation(null);
        setModalMode('create');
        setIsFormModalOpen(true);
    };

    const search = searchTerm.toLowerCase();
    const filteredLocations = locationsOfGoods.filter((location) =>
        location.name.toLowerCase().includes(search),
    );

    const total = locationsOfGoods.length;
    const active = locationsOfGoods.filter((location) => location.is_active).length;
    const inactive = total - active;

    const cards = [
        {
            label: 'Total Locations',
            value: total,
            sub: 'ports, warehouses, and examination sites',
            dot: null as string | null,
        },
        {
            label: 'Active',
            value: active,
            sub: total > 0 ? `${Math.round((active / total) * 100)}% usable in import forms` : '—',
            dot: '#22c55e' as string | null,
        },
        {
            label: 'Inactive',
            value: inactive,
            sub: inactive === 0 ? 'No archived entries' : `${inactive} hidden from encoder dropdowns`,
            dot: inactive > 0 ? '#ef4444' as string | null : null,
        },
    ];

    return (
        <div className="space-y-5 p-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary tracking-tight">Location of Goods</h1>
                    <p className="text-xs text-text-muted mt-0.5">Manage the physical ports, warehouses, and yards used in import declarations</p>
                </div>
                <CurrentDateTime
                    className="text-right hidden sm:block"
                    timeClassName="text-xl font-bold tabular-nums text-text-primary"
                    dateClassName="text-xs text-text-muted"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {cards.map((card) => (
                    <div key={card.label} className="bg-surface border border-border rounded-lg px-4 py-3.5">
                        <p className="text-[11px] font-medium text-text-muted uppercase tracking-widest mb-2">
                            {card.label}
                        </p>
                        <div className="flex items-center gap-2">
                            {card.dot && (
                                <span
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: card.dot }}
                                />
                            )}
                            <p className="text-[2rem] font-semibold tabular-nums text-text-primary leading-none">
                                {card.value}
                            </p>
                        </div>
                        <p className="text-xs text-text-muted mt-2">{card.sub}</p>
                    </div>
                ))}
            </div>

            <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="p-3 border-b border-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-surface-subtle">
                    <div className="relative flex-1 max-w-sm">
                        <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search locations..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            className="w-full pl-9 pr-3 h-9 rounded-md border border-border-strong bg-input-bg text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-xs font-bold transition-all shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700 text-white"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Location
                    </button>
                </div>

                {isLoading ? (
                    <div className="p-16 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: '#0a84ff' }} />
                    </div>
                ) : isError ? (
                    <div className="p-16 text-center">
                        <p className="text-sm text-red-500 font-medium">Failed to load locations of goods. Please try again.</p>
                    </div>
                ) : filteredLocations.length === 0 ? (
                    <div className="p-16 text-center">
                        <svg className="w-10 h-10 mx-auto mb-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <p className="text-sm text-text-muted">
                            {searchTerm ? 'No locations match your search' : 'No locations found'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    {['Location', 'Status', 'Actions'].map((heading, index) => (
                                        <th key={heading} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider ${index === 0 ? 'text-left' : 'text-center'} text-text-muted`}>
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLocations.map((location, index) => (
                                    <tr
                                        key={location.id}
                                        className={`border-b border-border/50 transition-colors hover:bg-hover ${index % 2 !== 0 ? 'bg-surface-secondary/40' : ''}`}
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 bg-gradient-to-br from-blue-600 to-indigo-700">
                                                    {location.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="text-sm font-semibold text-text-primary">{location.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                                                style={location.is_active
                                                    ? { color: '#30d158', backgroundColor: 'rgba(48,209,88,0.12)' }
                                                    : { color: '#ff453a', backgroundColor: 'rgba(255,69,58,0.12)' }}
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: location.is_active ? '#30d158' : '#ff453a' }} />
                                                {location.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    title="Edit Location"
                                                    onClick={() => handleEdit(location)}
                                                    className="p-1.5 rounded-lg transition-colors bg-surface-elevated border border-border text-text-secondary hover:text-text-primary hover:border-border-strong"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    title={location.is_active ? 'Deactivate Location' : 'Activate Location'}
                                                    onClick={() => handleToggleActive(location.id)}
                                                    disabled={toggleLocationOfGoods.isPending}
                                                    className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
                                                    style={location.is_active
                                                        ? { backgroundColor: 'rgba(255,69,58,0.12)', color: '#ff453a' }
                                                        : { backgroundColor: 'rgba(48,209,88,0.12)', color: '#30d158' }}
                                                >
                                                    {location.is_active ? (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="px-5 py-3 text-xs text-text-muted border-t border-border">
                            Showing {filteredLocations.length} of {locationsOfGoods.length} locations
                        </div>
                    </div>
                )}
            </div>

            <LocationOfGoodsFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={modalMode === 'create' ? handleCreateLocation : handleUpdateLocation}
                locationOfGoods={selectedLocation}
                mode={modalMode}
            />
        </div>
    );
};
