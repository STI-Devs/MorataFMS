import type { ArchiveYear, TransactionType } from '../../documents/types/document.types';
import { getRequiredArchiveStages } from '../../documents/types/document.types';

// Must match the ColHeader template in ArchivesPage: '20px 1fr 100px 60px 100px 20px'
export const YEAR_GRID = '20px 1fr 100px 60px 100px 20px';

interface Props {
    archive: ArchiveYear;
    onClick: () => void;
}

const computeCompleteness = (archive: ArchiveYear): number => {
    // Group docs by (bl_no, type) and check if all required stages are present
    const blGroups = new Map<string, { type: TransactionType; stages: Set<string> }>();

    for (const doc of archive.documents) {
        const key = `${doc.bl_no}|${doc.type}`;
        if (!blGroups.has(key)) blGroups.set(key, { type: doc.type, stages: new Set() });
        blGroups.get(key)!.stages.add(doc.stage);
    }

    if (blGroups.size === 0) return 0;

    let completeCount = 0;
    for (const { type, stages } of blGroups.values()) {
        const required = getRequiredArchiveStages(type);
        const allPresent = required.every(s => stages.has(s.key));
        if (allPresent) completeCount++;
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
    'Healthy':           { dot: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200',  text: 'text-emerald-700' },
    'In Progress':       { dot: 'bg-amber-400',   bg: 'bg-amber-50 border-amber-200',      text: 'text-amber-700'   },
    'Missing Documents': { dot: 'bg-red-500',      bg: 'bg-red-50 border-red-200',          text: 'text-red-700'     },
};

const RadialMini = ({ pct }: { pct: number }) => {
    const r = 10;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    const color = pct >= 90 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
    return (
        <svg className="w-8 h-8 shrink-0 -rotate-90" viewBox="0 0 24 24">
            <circle cx={12} cy={12} r={r} stroke="#e5e7eb" strokeWidth={2.5} fill="none" />
            <circle cx={12} cy={12} r={r} stroke={color} strokeWidth={2.5} fill="none"
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
    );
};

export const ArchiveYearCard = ({ archive, onClick }: Props) => {
    const blCount    = archive.imports + archive.exports;
    const pct        = computeCompleteness(archive);
    const lastUpd    = getLastUpdated(archive);
    const statusKey  = getStatus(pct, blCount);
    const s          = STATUS_STYLES[statusKey];

    const pills: { label: string; count: number; color: string; bg: string }[] = [
        { label: 'Import', count: archive.imports, color: '#16a34a', bg: 'rgba(22,163,74,0.1)'  },
        { label: 'Export', count: archive.exports, color: '#2563eb', bg: 'rgba(37,99,235,0.1)'  },
    ].filter(p => p.count > 0);

    return (
        <div
            onClick={onClick}
            role="button"
            className="group grid items-center gap-4 px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
            style={{ gridTemplateColumns: YEAR_GRID }}
        >
            {/* Folder icon */}
            <svg className="w-5 h-5 shrink-0 text-amber-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>

            {/* Year + pills — 1fr cell */}
            <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-black text-gray-800 tabular-nums">FY {archive.year}</span>
                    {pills.map(p => (
                        <span key={p.label}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full leading-none"
                            style={{ color: p.color, backgroundColor: p.bg }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                            {p.count} {p.label}
                        </span>
                    ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                    {archive.documents.length} {archive.documents.length === 1 ? 'file' : 'files'} &middot; Last updated {lastUpd}
                </p>
            </div>

            {/* Status — 100px cell */}
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold border px-2 py-0.5 rounded-full w-fit ${s.bg} ${s.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                {statusKey}
            </span>

            {/* BL count — 60px cell */}
            <span className="text-xs text-gray-500 tabular-nums">
                {blCount} BL{blCount !== 1 ? 's' : ''}
            </span>

            {/* Completeness — 100px cell */}
            <div className="flex items-center gap-1.5">
                <RadialMini pct={pct} />
                <span className="text-xs font-bold text-gray-600 tabular-nums">{pct}%</span>
            </div>

            {/* Chevron — 20px cell */}
            <svg className="w-4 h-4 text-gray-300 shrink-0 group-hover:translate-x-0.5 group-hover:text-gray-400 transition-all justify-self-end" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </div>
    );
};
