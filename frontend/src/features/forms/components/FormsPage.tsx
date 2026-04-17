import { useState } from 'react';
import { CurrentDateTime } from '../../../components/CurrentDateTime';

type Tab = 'files' | 'templates';

export const FormsPage = () => {
    const [activeTab, setActiveTab] = useState<Tab>('files');

    return (
        <div className="w-full p-8 pb-12 space-y-7">
            {/* Page header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-text-primary">Files & Documents</h1>
                    <p className="text-base text-text-muted mt-1">F.M. Morata — Files and Documents</p>
                </div>
                <CurrentDateTime
                    className="text-right shrink-0"
                    timeClassName="text-2xl font-bold tabular-nums text-text-primary"
                    dateClassName="text-sm text-text-muted"
                />
            </div>

            <div className="w-full min-h-[400px] rounded-xl border border-border bg-surface shadow-sm flex flex-col">
                {/* Header Actions */}
                <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Switcher */}
                    <div className="inline-flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-lg">
                        <button
                            onClick={() => setActiveTab('files')}
                            className={`px-6 py-2 text-sm font-semibold rounded-md transition-all ${
                                activeTab === 'files'
                                    ? 'bg-white text-black shadow-sm dark:bg-white/10 dark:text-white'
                                    : 'text-text-muted hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                        >
                            Files
                        </button>
                        <button
                            onClick={() => setActiveTab('templates')}
                            className={`px-6 py-2 text-sm font-semibold rounded-md transition-all ${
                                activeTab === 'templates'
                                    ? 'bg-white text-black shadow-sm dark:bg-white/10 dark:text-white'
                                    : 'text-text-muted hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                        >
                            Templates
                        </button>
                    </div>

                    {/* Upload Action */}
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload File
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col">
                    {/* Conditional Filter Bar for Files Tab */}
                    {activeTab === 'files' && (
                        <div className="px-6 py-4 border-b border-border bg-black/[0.02] dark:bg-white/[0.02] flex items-center gap-3">
                            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            <select
                                className="bg-surface border border-border text-text-primary text-sm rounded-lg focus:ring-primary focus:border-primary block w-full max-w-md px-3 py-2 outline-none shadow-sm cursor-pointer appearance-none"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                            >
                                <option value="">All Document Types</option>
                                <option value="affidavits">Affidavits/Oaths</option>
                                <option value="poa">Power of Attorney</option>
                                <option value="real_estate">Real Estate Documents (Deeds, Mortgages, etc.)</option>
                                <option value="business">Business Documents (Contracts, Formation docs)</option>
                                <option value="other">Other (Please specify)</option>
                            </select>
                        </div>
                    )}

                    <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                        {activeTab === 'files' ? (
                            <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                
                                <h3 className="text-xl font-bold text-text-primary mb-3">Files Placeholder</h3>
                                <p className="text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
                                    Folders that were uploaded containing 1-50 pages each. Note that folders are called books and inside books are the pages of each PDF.
                                </p>
                            </div>
                        ) : (
                            <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                
                                <h3 className="text-xl font-bold text-text-primary mb-3">Templates Placeholder</h3>
                                <p className="text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
                                    Access and manage the approved legal templates here.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
