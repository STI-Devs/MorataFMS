import React, { useRef, useState } from 'react';

type UploadState = 'idle' | 'selected' | 'uploading' | 'success' | 'error' | 'partial_success';

interface FolderSummary {
    rootName: string;
    subfolderCount: number;
    fileCount: number;
    totalSize: number; // bytes
}

// Basic mock history for the vault table
const MOCK_HISTORY = [
    { id: 1, batchName: 'Q1 2023 Vessel Logs', rootFolder: 'VESSEL_APL_Q1_2023', user: 'Admin User', date: '2023-11-12', files: 1240, size: 2147483648, status: 'Completed' },
    { id: 2, batchName: 'Client X Archive (2018-2022)', rootFolder: 'ClientX_Historical', user: 'Admin User', date: '2023-09-05', files: 8402, size: 15032385536, status: 'Completed' },
];

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
};

export const LegacyFolderUploadPage = () => {
    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [isDragging, setIsDragging] = useState(false);
    const [summary, setSummary] = useState<FolderSummary | null>(null);
    const [progress, setProgress] = useState(0);

    const [metadata, setMetadata] = useState({
        batchName: '',
        year: new Date().getFullYear().toString(),
        notes: '',
        preserveHierarchy: true,
        legacyReference: true,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const mockFolderSelection = () => {
        setSummary({
            rootName: 'Hapag_Lloyd_Vessel_Dec_2022',
            subfolderCount: 14,
            fileCount: 342,
            totalSize: 485123904, // ~485 MB
        });
        setMetadata(prev => ({ ...prev, batchName: 'Hapag Lloyd 2022 Archive' }));
        setUploadState('selected');
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        // In a real app, we'd process e.dataTransfer.items using webkitGetAsEntry
        mockFolderSelection();
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            mockFolderSelection();
        }
    };

    const startUpload = () => {
        setUploadState('uploading');
        setProgress(0);
        // Mock upload progress
        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    setUploadState('success');
                    return 100;
                }
                return p + Math.floor(Math.random() * 10) + 5;
            });
        }, 400);
    };

    const resetUpload = () => {
        setSummary(null);
        setUploadState('idle');
        setProgress(0);
        setMetadata({
            batchName: '',
            year: new Date().getFullYear().toString(),
            notes: '',
            preserveHierarchy: true,
            legacyReference: true,
        });
    };

    return (
        <div className="w-full flex-1 space-y-8 pb-10">


            <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                
                {/* TOP ROW: Metadata Panel */}
                <div className={`p-8 border-b border-gray-200 dark:border-white/10 transition-all ${
                    uploadState === 'uploading' ? 'opacity-50 pointer-events-none' : ''
                }`}>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Batch Metadata
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4 md:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Batch Name (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={metadata.batchName}
                                        onChange={e => setMetadata({...metadata, batchName: e.target.value})}
                                        placeholder="e.g. Hapag Lloyd 2022 Archive" 
                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-black text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        disabled={uploadState !== 'idle' && uploadState !== 'selected'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Archive Year</label>
                                    <select 
                                        value={metadata.year}
                                        onChange={e => setMetadata({...metadata, year: e.target.value})}
                                        className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-black text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        disabled={uploadState !== 'idle' && uploadState !== 'selected'}
                                    >
                                        <option>2024</option>
                                        <option>2023</option>
                                        <option>2022</option>
                                        <option>2021</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Notes</label>
                                <textarea 
                                    value={metadata.notes}
                                    onChange={e => setMetadata({...metadata, notes: e.target.value})}
                                    rows={2} 
                                    placeholder="Brief description of this upload..."
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-black text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                                    disabled={uploadState !== 'idle' && uploadState !== 'selected'}
                                ></textarea>
                            </div>
                        </div>

                        <div className="space-y-3 pt-6 md:pt-0 md:pl-6 md:border-l border-gray-100 dark:border-gray-800 flex flex-col justify-center">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center justify-center">
                                    <input type="checkbox" checked={metadata.preserveHierarchy} readOnly className="sr-only" />
                                    <div className={`w-5 h-5 rounded border ${metadata.preserveHierarchy ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-gray-300 dark:border-gray-600'} transition-colors flex items-center justify-center`}>
                                        {metadata.preserveHierarchy && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Preserve original folder structure</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center justify-center">
                                    <input type="checkbox" checked={metadata.legacyReference} readOnly className="sr-only" />
                                    <div className={`w-5 h-5 rounded border ${metadata.legacyReference ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-gray-300 dark:border-gray-600'} transition-colors flex items-center justify-center`}>
                                        {metadata.legacyReference && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Mark as legacy reference only</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* BOTTOM ROW: Main Upload / State Area */}
                <div className="p-8">
                    {uploadState === 'idle' && (
                        <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`w-full border-2 border-dashed rounded-xl p-16 transition-all flex flex-col items-center justify-center text-center 
                                ${isDragging 
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' 
                                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-white/5 hover:border-gray-400 dark:hover:border-gray-600'
                                }`}
                        >
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileInput}
                                // @ts-expect-error webkitdirectory is non-standard but widely supported for folder selection
                                webkitdirectory="" 
                                directory=""
                                className="hidden"
                            />
                            
                            <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                                <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11v6m-3-3h6" />
                                </svg>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Drag a root folder here
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
                                Drop a complete vessel or batch folder. Nested subfolders and files are fully supported and will be preserved.
                            </p>

                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Select Folder from Computer
                            </button>
                        </div>
                    )}

                    {uploadState === 'selected' && summary && (
                        <div className="w-full">
                            <div className="flex items-start justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
                                        <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{summary.rootName}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ready for upload</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={resetUpload} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors border border-transparent">
                                        Replace Folder
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6 p-6 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 mb-8">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Subfolders</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{summary.subfolderCount}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Total Files</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{summary.fileCount}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Total Size</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{formatBytes(summary.totalSize)}</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-white/10 pt-6">
                                <button onClick={resetUpload} className="px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors border border-gray-200 dark:border-white/10 shadow-sm">
                                    Cancel
                                </button>
                                <button onClick={startUpload} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    Begin Batch Upload
                                </button>
                            </div>
                        </div>
                    )}

                    {uploadState === 'uploading' && summary && (
                        <div className="w-full">
                            <div className="mb-8">
                                <div className="flex justify-between items-end mb-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Uploading Folder</h3>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{summary.rootName}</p>
                                    </div>
                                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden border border-gray-200 dark:border-gray-700">
                                    <div className="bg-blue-600 h-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Files Processed</span>
                                    <span className="text-sm font-black text-gray-900 dark:text-white tabular-nums">{Math.floor((progress / 100) * summary.fileCount)} / {summary.fileCount}</span>
                                </div>
                                <div className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Status</span>
                                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                        Uploading...
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {uploadState === 'success' && summary && (
                        <div className="w-full">
                            <div className="flex flex-col items-center text-center mb-8 bg-green-50/50 dark:bg-green-900/10 rounded-xl p-10 border border-green-100 dark:border-green-800">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white pb-2">Upload Completed</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                                    The legacy folder <strong>{summary.rootName}</strong> was successfully preserved into the records vault.
                                </p>
                            </div>

                            <div className="flex justify-center gap-3">
                                <button onClick={resetUpload} className="px-5 py-2.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white text-sm font-bold rounded-lg shadow-sm transition-colors border border-transparent">
                                    Upload Another Folder
                                </button>
                                <button className="px-5 py-2.5 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-lg shadow-sm transition-colors">
                                    View in Records
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Legacy Upload History Table */}
            <div className="mt-12">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Legacy Uploads</h3>
                <div className="bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                                <tr>
                                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Batch Name / Root Folder</th>
                                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Contents</th>
                                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Uploaded By</th>
                                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                {MOCK_HISTORY.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900 dark:text-white">{row.batchName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">{row.rootFolder}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-gray-700 dark:text-gray-300">{row.files} files</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatBytes(row.size)}</p>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{row.user}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{row.date}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
};
