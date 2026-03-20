export const PageFallback = () => (
    <div className="flex-1 flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-sm font-semibold text-text-muted">
            <div className="w-5 h-5 rounded-full border-2 border-text-muted/30 border-t-text-muted animate-spin" />
            Loading...
        </div>
    </div>
);
