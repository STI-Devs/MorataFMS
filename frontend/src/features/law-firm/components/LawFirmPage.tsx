import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '../../tracking/types';

// TODO: Law Firm module — implement legal document and case management.
// This feature is planned for a future release.

export const LawFirmPage = () => {
    const { dateTime } = useOutletContext<LayoutContext>();

    return (
        <div className="space-y-5 p-4">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-1 text-text-primary">Law Firm</h1>
                    <p className="text-sm text-text-secondary">Legal document and case management</p>
                </div>
                <div className="text-right hidden sm:block shrink-0">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-secondary">{dateTime.date}</p>
                </div>
            </div>

            {/* Placeholder */}
            <div className="bg-surface rounded-xl border border-border flex flex-col items-center justify-center py-24 gap-4">
                <svg className="w-12 h-12 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
                    <line x1="7" y1="21" x2="17" y2="21" strokeWidth={1.5} strokeLinecap="round" />
                    <line x1="12" y1="3" x2="12" y2="21" strokeWidth={1.5} strokeLinecap="round" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M3 7h2c2 0 2-2 4-2s2 2 4 2h2" />
                </svg>
                <div className="text-center">
                    <p className="text-base font-semibold text-text-primary">Law Firm Module</p>
                    <p className="text-sm text-text-muted mt-1">This feature is under development.</p>
                </div>
            </div>
        </div>
    );
};
