import { useRef, useState } from 'react';
import type { LegalParty } from '../../types/legalRecords.types';

type Props = {
    search: string;
    onSearchChange: (value: string) => void;
    suggestions: LegalParty[];
    selectedParty: LegalParty | null;
    onSelect: (party: LegalParty) => void;
};

export const PartyCombobox = ({ search, onSearchChange, suggestions, selectedParty, onSelect }: Props) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleSelect = (party: LegalParty) => {
        onSelect(party);
        setOpen(false);
    };

    return (
        <div ref={containerRef} className="relative space-y-2">
            <span className="text-[13px] font-medium text-neutral-700">
                Party / Principal <span className="text-red-500">*</span>
            </span>
            <div className="relative">
                <input
                    id="generator-party-name"
                    type="text"
                    autoComplete="off"
                    value={search}
                    onChange={(e) => { onSearchChange(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    placeholder="Search or type the client / principal name..."
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-3 text-[14px] font-medium text-neutral-900 placeholder:font-normal placeholder:text-neutral-400 transition-colors hover:bg-neutral-50 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
            </div>
            {selectedParty && (
                <div className="flex flex-wrap items-center gap-2 pt-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Linked party
                    </span>
                    <p className="text-[12px] text-neutral-500">
                        {selectedParty.principal_address ?? 'No address on file'}
                    </p>
                </div>
            )}
            {open && suggestions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                    {suggestions.map((party) => (
                        <button
                            key={party.id}
                            type="button"
                            onMouseDown={() => handleSelect(party)}
                            className="flex w-full flex-col gap-0.5 rounded-xl px-3.5 py-2.5 text-left transition-colors hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none"
                        >
                            <span className="text-[13px] font-semibold text-neutral-900">{party.name}</span>
                            {party.principal_address && (
                                <span className="text-[12px] text-neutral-500">{party.principal_address}</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
