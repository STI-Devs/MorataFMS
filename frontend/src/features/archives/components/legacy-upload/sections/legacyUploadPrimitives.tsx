import React from 'react';

export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-xs font-black uppercase tracking-widest text-text-muted">{children}</h3>
);

export const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-1">
        <span>{children}</span>
        <span className="text-red-500">*</span>
    </span>
);
