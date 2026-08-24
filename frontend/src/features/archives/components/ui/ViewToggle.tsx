import { FileText, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ViewMode } from '../../utils/archive.utils';

export const ViewToggle = ({
    mode,
    onChange,
}: {
    mode: ViewMode;
    onChange: (m: ViewMode) => void;
}) => (
    <div className="inline-flex h-8 items-center justify-center rounded-lg bg-muted p-0.5 text-muted-foreground">
        {(['folder', 'document'] as ViewMode[]).map((m) => {
            const isSelected = mode === m;
            return (
                <button
                    key={m}
                    type="button"
                    onClick={() => onChange(m)}
                    className={cn(
                        'inline-flex h-[calc(100%-2px)] items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-all cursor-pointer select-none',
                        isSelected
                            ? 'bg-background text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    {m === 'folder' ? (
                        <Folder className="size-3.5" />
                    ) : (
                        <FileText className="size-3.5" />
                    )}
                    <span>{m === 'folder' ? 'Folder View' : 'Document View'}</span>
                </button>
            );
        })}
    </div>
);


