import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '../../tracking/types';

// TODO: Forms module — implement document templates and form generation.
// This feature is planned for a future release.

export const FormsPage = () => {
    const { dateTime } = useOutletContext<LayoutContext>();

    return (
        <div className="space-y-5 p-4">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-1 text-text-primary">Forms</h1>
                    <p className="text-sm text-text-secondary">Document templates and form generation</p>
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="text-center">
                    <p className="text-base font-semibold text-text-primary">Forms Module</p>
                    <p className="text-sm text-text-muted mt-1">This feature is under development.</p>
                </div>
            </div>
        </div>
    );
};
