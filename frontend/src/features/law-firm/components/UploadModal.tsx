import { useRef, useState } from 'react';

interface Props {
    bookName: string;
    onClose: () => void;
}

export const UploadModal = ({ bookName, onClose }: Props) => {
    const [dragging, setDragging] = useState(false);
    const [selected, setSelected] = useState<File | null>(null);
    const [fileName, setFileName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (f: File) => {
        if (f.type === 'application/pdf') {
            setSelected(f);
            setFileName(f.name.replace(/\.pdf$/i, ''));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}>
            <div className="relative w-full max-w-md mx-4 bg-surface rounded-2xl border border-border shadow-2xl p-6 space-y-5"
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Upload PDF</h2>
                        <p className="text-xs text-text-muted mt-0.5">{bookName}</p>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-hover transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* File name input */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest">File Name</label>
                    <input
                        type="text"
                        value={fileName}
                        onChange={e => setFileName(e.target.value)}
                        placeholder="Enter a name for this file…"
                        className="w-full h-10 px-3 rounded-lg border border-border-strong bg-input-bg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition-all" />
                </div>

                {/* Drop zone */}
                <div
                    className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 px-6 cursor-pointer transition-all ${dragging ? 'border-blue-500 bg-blue-500/8' : selected ? 'border-emerald-500 bg-emerald-500/5' : 'border-border hover:border-blue-400 hover:bg-blue-500/5'}`}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}>

                    <input ref={inputRef} type="file" accept=".pdf" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

                    {selected ? (
                        <>
                            <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-emerald-400">{selected.name}</p>
                                <p className="text-xs text-text-muted mt-1">{(selected.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button className="text-xs text-text-muted underline"
                                onClick={e => { e.stopPropagation(); setSelected(null); }}>
                                Remove
                            </button>
                        </>
                    ) : (
                        <>
                            <svg className="w-10 h-10 text-text-muted opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <div className="text-center">
                                <p className="text-sm font-medium text-text-primary">
                                    {dragging ? 'Drop your PDF here' : 'Drag & drop a PDF'}
                                </p>
                                <p className="text-xs text-text-muted mt-1">or click to browse files</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-1">
                    <button onClick={onClose}
                        className="flex-1 h-10 rounded-lg border border-border text-sm font-semibold text-text-secondary hover:bg-hover transition-colors">
                        Cancel
                    </button>
                    <button
                        disabled={!selected || !fileName.trim()}
                        className={`flex-1 h-10 rounded-lg text-sm font-bold text-white transition-all ${selected && fileName.trim() ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 shadow-sm' : 'bg-border cursor-not-allowed opacity-50'}`}>
                        Upload
                    </button>
                </div>
            </div>
        </div>
    );
};
