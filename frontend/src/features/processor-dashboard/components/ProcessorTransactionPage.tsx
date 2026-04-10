import { useState } from 'react';
import { ImportList } from '../../tracking/components/ImportList';
import { ExportList } from '../../tracking/components/ExportList';

export const ProcessorTransactionPage = () => {
    const [view, setView] = useState<'import' | 'export'>('import');

    return (
        <div className="flex flex-col flex-1 h-full">
            {/* Simple toggle */}
            <div className="px-4 pt-4 border-b border-border flex gap-4">
                <button
                    onClick={() => setView('import')}
                    className={`pb-3 px-2 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
                        view === 'import'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                    Import Transactions
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">1</span>
                </button>
                <button
                    onClick={() => setView('export')}
                    className={`pb-3 px-2 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
                        view === 'export'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-text-secondary hover:text-text-primary'
                    }`}
                >
                    Export Transactions
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">3</span>
                </button>
            </div>

            <div className="-mx-4 pb-8 h-full">
                {view === 'import' ? <ImportList /> : <ExportList />}
            </div>
        </div>
    );
};
