import { useState } from 'react';
import type { ArchiveYear } from '../../types/document.types';
import { EXPORT_STAGES, IMPORT_STAGES } from '../../types/document.types';
import { exportArchiveCSV } from './utils/export.utils';

interface ExportReportDropdownProps {
    archiveData: ArchiveYear[];
    availableYears: number[];
}

export const ExportReportDropdown = ({ archiveData, availableYears }: ExportReportDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [year, setYear] = useState('all');
    const [type, setType] = useState('all');
    const [status, setStatus] = useState('all');

    // Live count of BLs that match the current selections
    const previewCount = (() => {
        const importKeys = IMPORT_STAGES.map(s => s.key) as string[];
        const exportKeys = EXPORT_STAGES.map(s => s.key) as string[];
        const blMap = new Map<string, Set<string>>();

        for (const yearData of archiveData) {
            if (year !== 'all' && String(yearData.year) !== year) continue;
            for (const doc of yearData.documents) {
                if (type !== 'all' && doc.type !== type) continue;
                const key = `${doc.bl_no}|${doc.type}|${yearData.year}`;
                if (!blMap.has(key)) blMap.set(key, new Set());
                blMap.get(key)!.add(doc.stage);
            }
        }

        if (status === 'all') return blMap.size;
        let count = 0;
        for (const [key, stages] of blMap) {
            const txType = key.split('|')[1] as 'import' | 'export';
            const required = txType === 'import' ? importKeys : exportKeys;
            const complete = required.every(k => stages.has(k));
            if (status === 'complete' && complete) count++;
            if (status === 'incomplete' && !complete) count++;
        }
        return count;
    })();

    const handleExport = () => {
        exportArchiveCSV(archiveData, { year, type, status });
        setIsOpen(false);
    };

    const scopeLabel = [
        year !== 'all' ? year : null,
        type !== 'all' ? (type === 'import' ? 'Imports' : 'Exports') : null,
        status !== 'all' ? (status.charAt(0).toUpperCase() + status.slice(1)) : null,
    ].filter(Boolean).join(' · ') || 'All Records';

    return (
        <div className="relative shrink-0">
            <button
                onClick={() => setIsOpen(o => !o)}
                className={`flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-bold border shadow-sm transition-all ${
                    isOpen
                        ? 'bg-gray-100 border-gray-300 text-gray-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                }`}>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Report
                <svg className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
            )}

            {/* Dropdown panel */}
            {isOpen && (
                <div className="absolute left-0 bottom-[calc(100%+6px)] z-30 w-72 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-600">Export Archive Report</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Choose what to include in your CSV export</p>
                    </div>

                    <div className="p-4 space-y-4">
                        {/* Year */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                                Year
                            </label>
                            <select value={year} onChange={e => setYear(e.target.value)}
                                className="w-full h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 cursor-pointer">
                                <option value="all">All Years</option>
                                {availableYears.map(y => (
                                    <option key={y} value={String(y)}>{y}</option>
                                ))}
                            </select>
                        </div>

                        {/* Type */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                                Transaction Type
                            </label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {([['all', 'All Types'], ['import', 'Import'], ['export', 'Export']] as const).map(([val, label]) => (
                                    <button key={val} onClick={() => setType(val)}
                                        className={`h-8 rounded-lg text-xs font-bold border transition-all ${
                                            type === val
                                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                                        }`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                                Document Status
                            </label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {([['all', 'All'], ['complete', 'Complete'], ['incomplete', 'Incomplete']] as const).map(([val, label]) => (
                                    <button key={val} onClick={() => setStatus(val)}
                                        className={`h-8 rounded-lg text-xs font-bold border transition-all ${
                                            status === val
                                                ? 'bg-orange-50 border-orange-300 text-orange-700'
                                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                                        }`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Live preview */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-gray-500 truncate">{scopeLabel}</p>
                            </div>
                            <span className={`text-xs font-black tabular-nums ${previewCount === 0 ? 'text-red-500' : 'text-gray-800'}`}>
                                {previewCount} BL{previewCount !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Export button */}
                        <button
                            onClick={handleExport}
                            disabled={previewCount === 0}
                            className={`w-full h-9 flex items-center justify-center gap-2 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                previewCount > 0 ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-400'
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download CSV · {previewCount} records
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
