import type {
    DocumentTransactionCounts,
    DocumentTransactionListRow,
    TransactionType,
} from '../../types/document.types';

export type TypeFilter = 'all' | TransactionType;

export interface DocumentRow {
    id: number;
    ref: string;
    blNo: string;
    client: string;
    type: TransactionType;
    date: string;
    dateLabel: string;
    port: string;
    vessel: string;
    status: string;
    docCount: number;
}

export interface DocumentStat {
    label: string;
    value: number;
    sub: string;
    color: string;
    icon: string;
}

export const TYPE_CONFIG: Record<TransactionType, { label: string; color: string; bg: string }> = {
    import: { label: 'Import', color: '#0a84ff', bg: 'rgba(10,132,255,0.12)' },
    export: { label: 'Export', color: '#30d158', bg: 'rgba(48,209,88,0.12)' },
};

export const FILTER_LABELS: Record<TypeFilter, string> = {
    all: 'All Types',
    import: 'Import',
    export: 'Export',
};

export const TABLE_GRID = '110px 140px 1.4fr 1fr 110px 110px';

export const toTitleCase = (value: string) => {
    if (!value || value === '—') {
        return value;
    }

    return value.toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
};

export const formatDate = (value: string) => {
    if (!value || value === '—') {
        return value;
    }

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

export const mapDocumentRows = (rows: DocumentTransactionListRow[]): DocumentRow[] =>
    rows.map((row) => ({
        id: row.id,
        ref: row.ref,
        blNo: row.bl_no || '—',
        client: row.client || '—',
        type: row.type,
        date: row.date,
        dateLabel: row.date_label,
        port: row.port || '—',
        vessel: row.vessel || '—',
        status: row.status,
        docCount: row.documents_count,
    }));

export const buildDocumentStats = (
    counts: DocumentTransactionCounts | undefined,
    rows: DocumentRow[],
): DocumentStat[] => {
    const totalDocs = rows.reduce((sum, row) => sum + row.docCount, 0);
    const missingDocs = rows.filter((row) => row.docCount === 0).length;

    return [
        {
            label: 'Completed Transactions',
            value: counts?.completed ?? 0,
            sub: `${counts?.completed ?? 0} shipments cleared`,
            color: '#0a84ff',
            icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
        },
        {
            label: 'Import Cleared',
            value: counts?.imports ?? 0,
            sub: 'Inbound shipments',
            color: '#0a84ff',
            icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
        },
        {
            label: 'Export Shipped',
            value: counts?.exports ?? 0,
            sub: 'Outbound shipments',
            color: '#30d158',
            icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
        },
        {
            label: 'Total Files',
            value: totalDocs,
            sub:
                missingDocs > 0
                    ? `${missingDocs} visible shipments missing docs`
                    : 'Visible shipments have files',
            color: missingDocs > 0 ? '#ff9f0a' : '#30d158',
            icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        },
    ];
};
