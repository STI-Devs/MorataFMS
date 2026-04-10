import { useState } from 'react';
import { ImportList } from '../../tracking/components/ImportList';
import { ExportList } from '../../tracking/components/ExportList';

export const AccountingImpExpPage = () => {
    const [view, setView] = useState<'import' | 'export'>('import');

    return (
        <div className="flex flex-col flex-1 h-full">
            {/* Simple toggle */}
            <div className="px-4 pt-4 border-b border-border flex gap-4">
                <button
                    onClick={() => setView('import')}
                    className={`pb-3 px-2 font-bold text-sm border-b-2 transition-colors ${
                        view === 'import'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                    Import Transactions
                </button>
                <button
                    onClick={() => setView('export')}
                    className={`pb-3 px-2 font-bold text-sm border-b-2 transition-colors ${
                        view === 'export'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                    Export Transactions
                </button>
            </div>

            <div className="-mx-4 pb-8 h-full">
                {view === 'import' ? <ImportList /> : <ExportList />}
            </div>
        </div>
    );
};
