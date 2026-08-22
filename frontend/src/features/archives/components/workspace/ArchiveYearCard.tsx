import type { ArchiveYear, TransactionType } from '../../../documents/types/document.types';
import { getArchiveBlCompletion } from '../../utils/archive.utils';

// Must match the ColHeader template in ArchivesPage: '20px 1fr 100px 60px 100px 20px'
export const YEAR_GRID = '20px 1fr 100px 60px 100px 20px';

interface Props {
    archive: ArchiveYear;
    onClick: () => void;
}

const computeCompleteness = (archive: ArchiveYear): number => {
    const blGroups = new Map<string, { type: TransactionType; docs: ArchiveYear['documents'] }>();

    for (const doc of archive.documents) {
        const key = `${doc.bl_no}|${doc.type}`;
        if (!blGroups.has(key)) blGroups.set(key, { type: doc.type, docs: [] });
        blGroups.get(key)!.docs.push(doc);
    }

    if (blGroups.size === 0) return 0;

    let completeCount = 0;
    for (const { type, docs } of blGroups.values()) {
        if (getArchiveBlCompletion(docs, type).isComplete) completeCount++;
    }

    return Math.round((completeCount / blGroups.size) * 100);
};

const getLastUpdated = (archive: ArchiveYear): string => {
    if (archive.documents.length === 0) return '—';
    const latest = archive.documents.reduce((a, b) =>
        (a.uploaded_at ?? '') > (b.uploaded_at ?? '') ? a : b
    );
    if (!latest.uploaded_at) return '—';
    return new Date(latest.uploaded_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
};

type StatusLabel = 'Healthy' | 'In Progress' | 'Missing Documents';
const getStatus = (pct: number, total: number): StatusLabel => {
    if (total === 0) return 'Missing Documents';
    if (pct >= 90) return 'Healthy';
    if (pct >= 50) return 'In Progress';
    return 'Missing Documents';
};

const STATUS_STYLES: Record<StatusLabel, { dot: string; bg: string; text: string }> = {
    Healthy: { dot: 'bg-success', bg: 'bg-success/10 border-success/20', text: 'text-success' },
    'In Progress': { dot: 'bg-warning', bg: 'bg-warning/10 border-warning/20', text: 'text-warning' },
    'Missing Documents': { dot: 'bg-danger', bg: 'bg-danger/10 border-danger/20', text: 'text-danger' },
};

const RadialMini = ({ pct }: { pct: number }) => {
    const r = 10;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    const color = pct >= 90 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';
    return (
        <svg className="w-8 h-8 shrink-0 -rotate-90" viewBox="0 0 24 24">
            <circle cx={12} cy={12} r={r} stroke="var(--border)" strokeWidth={2.5} fill="none" />
            <circle cx={12} cy={12} r={r} stroke={color} strokeWidth={2.5} fill="none"
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
    );
};

export const ArchiveYearCard = ({ archive, onClick }: Props) => {
    const blCount = archive.imports + archive.exports;
    const pct = computeCompleteness(archive);
    const lastUpd = getLastUpdated(archive);
    const statusKey = getStatus(pct, blCount);
    const s = STATUS_STYLES[statusKey];

    const pills: { label: string; count: number; color: string; bg: string }[] = [
        { label: 'Import', count: archive.imports, color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 10%, transparent)' },
        { label: 'Export', count: archive.exports, color: 'var(--info)', bg: 'color-mix(in srgb, var(--info) 10%, transparent)' },
    ].filter(p => p.count > 0);

    return (
        <div
            onClick={onClick}
            role="button"
            className="group grid items-center gap-4 px-5 py-4 border-b border-border hover:bg-muted transition-colors cursor-pointer"
            style={{ gridTemplateColumns: YEAR_GRID }}
        >
            <svg className="w-5 h-5 shrink-0 text-warning group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>

            <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-black text-foreground tabular-nums">FY {archive.year}</span>
                    {pills.map(p => (
                        <span key={p.label}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full leading-none"
                            style={{ color: p.color, backgroundColor: p.bg }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                            {p.count} {p.label}
                        </span>
                    ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                    {archive.documents.length} {archive.documents.length === 1 ? 'file' : 'files'} &middot; Last updated {lastUpd}
                </p>
            </div>

            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold border px-2 py-0.5 rounded-full w-fit ${s.bg} ${s.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                {statusKey}
            </span>

            <span className="text-xs text-muted-foreground tabular-nums">
                {blCount} BL{blCount !== 1 ? 's' : ''}
            </span>

            <div className="flex items-center gap-1.5">
                <RadialMini pct={pct} />
                <span className="text-xs font-bold text-muted-foreground tabular-nums">{pct}%</span>
            </div>

            <svg className="w-4 h-4 text-muted-foreground/70 shrink-0 group-hover:translate-x-0.5 group-hover:text-muted-foreground transition-all justify-self-end" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </div>
    );
};
