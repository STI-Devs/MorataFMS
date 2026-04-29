import React from 'react';
import { LEGACY_YEAR_OPTIONS, type BatchMeta } from '../../../utils/legacyUpload.utils';
import { RequiredLabel, SectionTitle } from './legacyUploadPrimitives';

interface Props {
    meta: BatchMeta;
    onChange: React.Dispatch<React.SetStateAction<BatchMeta>>;
}

export const MetadataPanel = ({ meta, onChange }: Props) => (
    <div className="rounded-2xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
            <SectionTitle>Batch Details</SectionTitle>
        </div>

        <div className="space-y-4 px-5 py-5">
            <label className="block">
                <span className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-text-muted">
                    <RequiredLabel>Batch Name</RequiredLabel>
                </span>
                <input
                    aria-label="Batch Name"
                    value={meta.batchName}
                    onChange={(event) => onChange((current) => ({ ...current, batchName: event.target.value }))}
                    className="w-full rounded-xl border border-border-strong bg-input-bg px-4 py-3 text-sm text-text-primary outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
            </label>

            <div className="space-y-3">
                <label className="inline-flex items-center gap-3 text-sm text-text-primary">
                    <input
                        type="checkbox"
                        aria-label="This batch spans multiple years"
                        checked={meta.useYearRange}
                        onChange={(event) => onChange((current) => ({
                            ...current,
                            useYearRange: event.target.checked,
                            yearTo: event.target.checked ? (current.yearTo || current.yearFrom) : current.yearFrom,
                        }))}
                        className="h-4 w-4 rounded border-border-strong text-blue-600 focus:ring-blue-500"
                    />
                    <span>
                        <span className="font-bold text-text-primary">Spans multiple years</span>
                        <span className="ml-2 text-text-muted">Use only when this root folder covers more than one filing year.</span>
                    </span>
                </label>

                <div className={`grid gap-4 ${meta.useYearRange ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}>
                    <label className="block">
                        <span className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-text-muted">
                            <RequiredLabel>{meta.useYearRange ? 'From Year' : 'Year'}</RequiredLabel>
                        </span>
                        <select
                            aria-label={meta.useYearRange ? 'From Year' : 'Year'}
                            value={meta.yearFrom}
                            onChange={(event) => {
                                const nextYearFrom = event.target.value;

                                onChange((current) => ({
                                    ...current,
                                    yearFrom: nextYearFrom,
                                    yearTo: current.useYearRange && current.yearTo && nextYearFrom && Number(current.yearTo) < Number(nextYearFrom)
                                        ? nextYearFrom
                                        : current.useYearRange
                                            ? current.yearTo
                                            : nextYearFrom,
                                }));
                            }}
                            className="w-full rounded-xl border border-border-strong bg-input-bg px-4 py-3 text-sm text-text-primary outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                        >
                            <option value="">{meta.useYearRange ? 'Select start year' : 'Select year'}</option>
                            {LEGACY_YEAR_OPTIONS.map((yearOption) => (
                                <option key={yearOption} value={yearOption}>
                                    {yearOption}
                                </option>
                            ))}
                        </select>
                    </label>

                    {meta.useYearRange && (
                        <label className="block">
                            <span className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-text-muted">
                                <RequiredLabel>To Year</RequiredLabel>
                            </span>
                            <select
                                aria-label="To Year"
                                value={meta.yearTo}
                                onChange={(event) => onChange((current) => ({ ...current, yearTo: event.target.value }))}
                                className="w-full rounded-xl border border-border-strong bg-input-bg px-4 py-3 text-sm text-text-primary outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                            >
                                <option value="">Select end year</option>
                                {LEGACY_YEAR_OPTIONS.filter((yearOption) => !meta.yearFrom || Number(yearOption) >= Number(meta.yearFrom)).map((yearOption) => (
                                    <option key={yearOption} value={yearOption}>
                                        {yearOption}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                    <span className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-text-muted">
                        <RequiredLabel>Department</RequiredLabel>
                    </span>
                    <select
                        aria-label="Department"
                        value={meta.department}
                        onChange={(event) => onChange((current) => ({ ...current, department: event.target.value }))}
                        className="w-full rounded-xl border border-border-strong bg-input-bg px-4 py-3 text-sm text-text-primary outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                    >
                        <option value="">Select department</option>
                        <option value="Brokerage">Brokerage</option>
                        <option value="Legal">Legal</option>
                    </select>
                </label>
            </div>

            <label className="block">
                <span className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-text-muted">
                    Notes
                </span>
                <textarea
                    aria-label="Notes"
                    rows={4}
                    value={meta.notes}
                    onChange={(event) => onChange((current) => ({ ...current, notes: event.target.value }))}
                    className="w-full rounded-xl border border-border-strong bg-input-bg px-4 py-3 text-sm text-text-primary outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
            </label>
        </div>
    </div>
);
