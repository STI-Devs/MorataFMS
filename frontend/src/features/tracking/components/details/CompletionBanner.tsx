type Props = {
    countdown: number;
    label: string;
    onOpenDocuments: () => void;
};

export const CompletionBanner = ({ countdown, label, onOpenDocuments }: Props) => (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
        <div className="flex items-center gap-4 bg-emerald-950 border border-emerald-500/40 rounded-2xl px-5 py-4 shadow-2xl shadow-emerald-900/40">
            <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-emerald-300">All stages complete!</p>
                <p className="text-xs text-emerald-400/70 mt-0.5">
                    Returning to {label} List in{' '}
                    <span className="font-bold text-emerald-300">{countdown}s</span>
                    …
                </p>
            </div>
            <button
                onClick={onOpenDocuments}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors"
            >
                Open Documents
            </button>
        </div>
    </div>
);
