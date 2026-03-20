import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '../../tracking/types';

export const LegalDocumentsPage = () => {
    const { dateTime } = useOutletContext<LayoutContext>();

    return (
        <div className="w-full p-8 pb-12 space-y-7">
            {/* Page header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-text-primary">Documents</h1>
                    <p className="text-base text-text-muted mt-1">F.M. Morata — Legal Documents</p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-2xl font-bold tabular-nums text-text-primary">{dateTime.time}</p>
                    <p className="text-sm text-text-muted">{dateTime.date}</p>
                </div>
            </div>

            {/* Content area */}
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                </div>
                <h2 className="text-base font-semibold text-text-primary mb-1">Legal Documents</h2>
                <p className="text-sm text-text-muted max-w-xs">
                    This screen is waiting for the finalized legal-module API and should stay free of mock data until that contract is ready.
                </p>
            </div>
        </div>
    );
};
