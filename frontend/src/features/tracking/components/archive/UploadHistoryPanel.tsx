import type { ArchiveDocument, TransactionType } from '../../types/document.types';
import { EXPORT_STAGES, IMPORT_STAGES } from '../../types/document.types';
import { toTitleCase } from './utils/archive.utils';

interface UploadHistoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    folderName: string;
    docs: ArchiveDocument[];
    type: TransactionType;
}

const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit',
    });

export const UploadHistoryPanel = ({ isOpen, onClose, folderName, docs, type }: UploadHistoryPanelProps) => {
    const stages = type === 'import' ? IMPORT_STAGES : EXPORT_STAGES;

    // Group docs by BL number
    const blMap = new Map<string, ArchiveDocument[]>();
    for (const doc of docs) {
        const bl = doc.bl_no || '(No BL)';
        if (!blMap.has(bl)) blMap.set(bl, []);
        blMap.get(bl)!.push(doc);
    }
    const blEntries = [...blMap.entries()].sort(([a], [b]) => a.localeCompare(b));

    // Overall stats
    const totalBLs = blEntries.length;
    const completeBLs = blEntries.filter(([, blDocs]) => {
        const uploaded = new Set(blDocs.map(d => d.stage));
        return stages.every(s => uploaded.has(s.key));
    }).length;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Slide-over panel */}
            <div className={`fixed right-0 top-0 h-full w-full max-w-md z-50 bg-white shadow-2xl border-l border-gray-200 flex flex-col transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/80 shrink-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Upload History</p>
                            </div>
                            <h2 className="text-base font-black text-gray-800 truncate">{folderName}</h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {totalBLs} BL record{totalBLs !== 1 ? 's' : ''} · {docs.length} total files
                            </p>
                        </div>
                        <button onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all shrink-0 mt-0.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Summary badges */}
                    <div className="flex items-center gap-2 mt-3">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {completeBLs} Complete
                        </span>
                        {totalBLs - completeBLs > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                {totalBLs - completeBLs} Incomplete
                            </span>
                        )}
                        <span className="text-[11px] text-gray-400 ml-auto">{stages.length} stages required</span>
                    </div>
                </div>

                {/* BL list */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                    {blEntries.length === 0 ? (
                        <div className="py-16 text-center text-xs text-gray-400">No documents in this folder yet.</div>
                    ) : blEntries.map(([blNo, blDocs]) => {
                        const uploaded = new Map<string, ArchiveDocument[]>();
                        for (const doc of blDocs) {
                            if (!uploaded.has(doc.stage)) uploaded.set(doc.stage, []);
                            uploaded.get(doc.stage)!.push(doc);
                        }
                        const doneCount = stages.filter(s => uploaded.has(s.key)).length;
                        const isComplete = doneCount === stages.length;
                        const client = blDocs[0]?.client;

                        return (
                            <details key={blNo} className="group">
                                {/* BL summary row — click to expand */}
                                <summary className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors list-none select-none">
                                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm font-bold text-gray-800 truncate">{blNo}</span>
                                            {client && (
                                                <span className="text-[11px] text-gray-400 truncate hidden sm:block">· {toTitleCase(client)}</span>
                                            )}
                                        </div>
                                        {/* Mini stage dots */}
                                        <div className="flex items-center gap-1 mt-1">
                                            {stages.map(s => (
                                                <div key={s.key}
                                                    title={s.label}
                                                    className={`w-4 h-1.5 rounded-full ${uploaded.has(s.key) ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                                            ))}
                                            <span className="text-[10px] text-gray-400 ml-1">{doneCount}/{stages.length}</span>
                                        </div>
                                    </div>
                                    <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${isComplete ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                        <span className={`w-1 h-1 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                        {isComplete ? 'Complete' : 'Incomplete'}
                                    </span>
                                </summary>

                                {/* Stage rows inside the BL */}
                                <div className="bg-gray-50/60 border-t border-gray-100">
                                    {stages.map(stage => {
                                        const stageDocs = uploaded.get(stage.key) ?? [];
                                        const hasFile = stageDocs.length > 0;
                                        return (
                                            <div key={stage.key} className="border-b border-gray-100 last:border-b-0">
                                                {/* Stage label */}
                                                <div className="flex items-center gap-2 px-8 py-2">
                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasFile ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{stage.label}</span>
                                                    {!hasFile && (
                                                        <span className="ml-auto text-[10px] text-red-400 font-semibold italic">Not uploaded</span>
                                                    )}
                                                </div>
                                                {/* Files */}
                                                {stageDocs.map(doc => (
                                                    <div key={doc.id} className="flex items-center gap-3 px-8 pb-2.5">
                                                        <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-gray-700 font-medium truncate" title={doc.filename}>{doc.filename}</p>
                                                            <p className="text-[10px] text-gray-400">
                                                                {doc.uploader?.name ?? 'Unknown'}{doc.uploaded_at ? ` · ${formatDateTime(doc.uploaded_at)}` : ''}
                                                            </p>
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 shrink-0 tabular-nums">{doc.formatted_size}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            </details>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50/60 shrink-0">
                    <p className="text-[10px] text-gray-400">Upload history for {folderName}</p>
                </div>
            </div>
        </>
    );
};
