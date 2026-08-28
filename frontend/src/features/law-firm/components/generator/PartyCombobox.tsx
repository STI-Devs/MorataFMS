import { useRef, useState } from 'react';
import { Building2 } from 'lucide-react';
import { Input } from '../../../../components/ui/input';
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
        <div ref={containerRef} className="relative space-y-1.5">
            <label htmlFor="generator-party-name" className="text-xs font-medium text-foreground">
                Party / Principal <span className="text-destructive">*</span>
            </label>
            <div className="relative">
                <Input
                    id="generator-party-name"
                    type="text"
                    autoComplete="off"
                    value={search}
                    onChange={(e) => { onSearchChange(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    placeholder="Search or type the client / principal name..."
                    className="h-9 text-xs bg-background"
                />
            </div>
            {selectedParty && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Linked party
                    </span>
                    <p className="text-xs text-muted-foreground">
                        {selectedParty.principal_address ?? 'No address on file'}
                    </p>
                </div>
            )}
            {open && suggestions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border/80 bg-popover p-1 shadow-md">
                    {suggestions.map((party) => (
                        <button
                            key={party.id}
                            type="button"
                            onMouseDown={() => handleSelect(party)}
                            className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/80 focus:bg-muted/80 focus:outline-none cursor-pointer"
                        >
                            <Building2 className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="min-w-0">
                                <span className="block text-xs font-semibold text-foreground">{party.name}</span>
                                {party.principal_address && (
                                    <span className="block truncate text-[11px] text-muted-foreground">{party.principal_address}</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
