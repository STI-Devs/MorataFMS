import { generatePath, useNavigate } from 'react-router-dom';
import { Icon } from '../../../../components/Icon';
import { Pagination } from '../../../../components/Pagination';
import { appRoutes } from '../../../../lib/appRoutes';
import type { DocumentTransactionListResponse } from '../../types/document.types';
import {
    formatDate,
    TABLE_GRID,
    toTitleCase,
    TYPE_CONFIG,
    type DocumentRow,
} from './documentsList.utils';
import { TableSkeleton } from './DocumentsShared';

const EmptyState = ({ isFullyEmpty }: { isFullyEmpty: boolean }) => (
    <div className="flex flex-col items-center gap-3 py-16 text-text-muted">
        <Icon name="file-text" className="h-10 w-10 opacity-30" />
        <p className="text-sm font-semibold">
            {isFullyEmpty ? 'No completed transactions yet' : 'No transactions match your filter'}
        </p>
        {isFullyEmpty ? (
            <p className="max-w-xs text-center text-xs">
                Completed import and export transactions will appear here once all stages are done.
            </p>
        ) : null}
    </div>
);

export const DocumentsTable = ({
    rows,
    response,
    isLoading,
    onPageChange,
    onPerPageChange,
}: {
    rows: DocumentRow[];
    response: DocumentTransactionListResponse | undefined;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
}) => {
    const navigate = useNavigate();
    const meta = response?.meta;

    return (
        <>
            <div
                className="grid gap-4 border-b border-border bg-surface-secondary px-6 py-3"
                style={{ gridTemplateColumns: TABLE_GRID }}
            >
                {['Type', 'BL No.', 'Client', 'Date', 'Status', 'Docs'].map((header, index) => (
                    <span
                        key={header}
                        className={`text-xs font-bold uppercase tracking-wider text-text-secondary ${
                            index >= 4 ? 'text-center' : ''
                        }`}
                    >
                        {header}
                    </span>
                ))}
            </div>

            {isLoading ? (
                <TableSkeleton />
            ) : (
                <>
                    <div>
                        {rows.length === 0 ? (
                            <EmptyState isFullyEmpty={(response?.meta?.total ?? 0) === 0} />
                        ) : (
                            rows.map((row, index) => {
                                const typeConfig = TYPE_CONFIG[row.type];
                                const isMissingDocs = row.docCount === 0;
                                const normalizedStatus = row.status.toLowerCase();

                                return (
                                    <div
                                        key={row.id}
                                        onClick={() =>
                                            navigate(
                                                generatePath(appRoutes.documentDetail, {
                                                    ref: row.ref,
                                                }),
                                            )
                                        }
                                        className={`relative grid cursor-pointer items-center gap-4 border-b border-border/50 px-6 py-3 transition-all duration-150 hover:bg-hover ${
                                            index % 2 !== 0 ? 'bg-surface-secondary/40' : ''
                                        }`}
                                        style={{ gridTemplateColumns: TABLE_GRID }}
                                    >
                                        <span
                                            className="inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-bold"
                                            style={{
                                                color: typeConfig.color,
                                                backgroundColor: typeConfig.bg,
                                            }}
                                        >
                                            {typeConfig.label}
                                        </span>

                                        <p className="truncate font-mono text-sm font-bold tracking-tight text-text-primary">
                                            {row.blNo}
                                        </p>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-text-primary">
                                                {toTitleCase(row.client)}
                                            </p>
                                            {row.port !== '—' ? (
                                                <p className="mt-0.5 truncate text-xs text-text-muted">
                                                    {row.vessel !== '—' ? `${row.vessel} · ` : ''}
                                                    {row.port}
                                                </p>
                                            ) : null}
                                        </div>

                                        <div>
                                            <p className="text-sm font-semibold text-text-secondary">
                                                {formatDate(row.date)}
                                            </p>
                                            <p className="mt-0.5 text-xs text-text-muted">
                                                {row.dateLabel} date
                                            </p>
                                        </div>

                                        <div className="flex justify-center">
                                            {normalizedStatus === 'cancelled' ? (
                                                <span
                                                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                                                    style={{
                                                        color: '#ff453a',
                                                        backgroundColor: 'rgba(255,69,58,0.13)',
                                                    }}
                                                >
                                                    <span
                                                        className="inline-block h-1.5 w-1.5 rounded-full"
                                                        style={{
                                                            backgroundColor: '#ff453a',
                                                            boxShadow: '0 0 4px #ff453a',
                                                        }}
                                                    />
                                                    Cancelled
                                                </span>
                                            ) : (
                                                <span
                                                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                                                    style={{
                                                        color: '#30d158',
                                                        backgroundColor: 'rgba(48,209,88,0.13)',
                                                    }}
                                                >
                                                    <span
                                                        className="inline-block h-1.5 w-1.5 rounded-full"
                                                        style={{
                                                            backgroundColor: '#30d158',
                                                            boxShadow: '0 0 4px #30d158',
                                                        }}
                                                    />
                                                    {row.type === 'import' ? 'Cleared' : 'Shipped'}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex justify-center">
                                            {isMissingDocs ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                                                    <svg
                                                        className="h-3 w-3"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2.5}
                                                            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                                                        />
                                                    </svg>
                                                    Missing
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                                    <svg
                                                        className="h-3 w-3"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                        />
                                                    </svg>
                                                    {row.docCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {meta && meta.last_page > 1 ? (
                        <Pagination
                            currentPage={meta.current_page}
                            totalPages={meta.last_page}
                            perPage={meta.per_page}
                            onPageChange={onPageChange}
                            onPerPageChange={onPerPageChange}
                        />
                    ) : null}
                </>
            )}
        </>
    );
};
