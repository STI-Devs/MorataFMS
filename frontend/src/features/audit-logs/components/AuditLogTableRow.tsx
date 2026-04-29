import { Fragment } from 'react';

import type { AuditLogEntry } from '../types/auditLog.types';
import {
    SELECTIVE_COLOR_TONES,
    countMeaningfulFieldKeys,
    formatDate,
    formatKey,
    formatValue,
    getEventCfg,
} from '../utils/auditLog.utils';

interface Props {
    log: AuditLogEntry;
    idx: number;
    isOpen: boolean;
    onToggle: () => void;
}

export const AuditLogTableRow = ({ log, idx, isOpen, onToggle }: Props) => {
    const cfg = getEventCfg(log.event);
    const isDelete = log.event === 'deleted';

    const hasNew = log.new_values && Object.keys(log.new_values).length > 0;
    const hasOldOnly = isDelete && log.old_values && Object.keys(log.old_values).length > 0;
    const changesData = hasNew ? log.new_values : hasOldOnly ? log.old_values : null;
    const changeCount = countMeaningfulFieldKeys(changesData ?? null);

    const zebraRow = idx % 2 !== 0 ? 'bg-surface-secondary/30' : '';

    return (
        <Fragment>
            <tr
                onClick={() => (changeCount > 0 ? onToggle() : undefined)}
                className={`border-b border-border/50 transition-colors ${zebraRow} ${changeCount > 0 ? 'cursor-pointer hover:bg-hover' : ''} ${isOpen ? '!bg-hover' : ''}`}
            >
                <td className="px-5 py-3.5 whitespace-nowrap">
                    <p className="text-xs tabular-nums text-text-secondary">{formatDate(log.created_at)}</p>
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap">
                    {log.user ? (
                        <p className="font-medium text-text-primary text-sm">{log.user.name}</p>
                    ) : (
                        <span className="text-text-muted italic text-xs">System</span>
                    )}
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold capitalize"
                        style={{ color: cfg.color, backgroundColor: cfg.bg }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                        {cfg.label}
                    </span>
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap">
                    {log.auditable_type ? (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-surface-tint border border-border-tint text-text-secondary capitalize">
                            {log.auditable_type}
                        </span>
                    ) : (
                        <span className="text-text-muted">—</span>
                    )}
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap">
                    {isDelete && changeCount > 0 ? (
                        <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                            style={{
                                color: '#ff453a',
                                backgroundColor: 'rgba(255,69,58,0.10)',
                                borderColor: 'rgba(255,69,58,0.25)',
                            }}
                        >
                            Snapshot
                        </span>
                    ) : !isDelete && changeCount > 0 ? (
                        <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                            style={{
                                color: '#0a84ff',
                                backgroundColor: 'rgba(10,132,255,0.10)',
                                borderColor: 'rgba(10,132,255,0.25)',
                            }}
                        >
                            {changeCount} field{changeCount !== 1 ? 's' : ''}
                        </span>
                    ) : (
                        <span className="text-text-muted text-xs">—</span>
                    )}
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap text-xs tabular-nums text-text-muted">
                    {log.ip_address ?? '—'}
                </td>

                <td className="pr-4 py-3.5 whitespace-nowrap text-right">
                    {changeCount > 0 && (
                        <svg
                            className="w-4 h-4 text-text-muted transition-transform duration-200 inline"
                            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    )}
                </td>
            </tr>

            {changesData && (
                <tr>
                    <td colSpan={7} className="p-0 border-0" style={{ padding: 0 }}>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateRows: isOpen ? '1fr' : '0fr',
                                transition: 'grid-template-rows 380ms cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                        >
                            <div style={{ overflow: 'hidden' }}>
                                <div
                                    className="bg-surface/50 overflow-hidden"
                                    style={{
                                        borderTop: '1px solid var(--color-border-strong, rgba(255,255,255,0.06))',
                                        borderBottom: '1px solid var(--color-border-strong, rgba(255,255,255,0.06))',
                                        opacity: isOpen ? 1 : 0,
                                        transform: isOpen ? 'translateY(0)' : 'translateY(-6px)',
                                        transition: 'opacity 300ms ease, transform 300ms ease',
                                        transitionDelay: isOpen ? '60ms' : '0ms',
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: '16px 24px 12px',
                                            borderBottom: '1px solid var(--color-border-strong, rgba(255,255,255,0.06))',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                backgroundColor: cfg.color,
                                                boxShadow: `0 0 6px ${cfg.color}`,
                                                flexShrink: 0,
                                            }}
                                        />
                                        <p style={{ fontSize: '11px', fontWeight: 700, color: cfg.color, letterSpacing: '0.02em' }}>
                                            {isDelete
                                                ? `Record Snapshot${log.auditable_label ? ` · ${log.auditable_label}` : ''}`
                                                : `${cfg.label} — ${changeCount} field${changeCount !== 1 ? 's' : ''}${log.auditable_label ? ` · ${log.auditable_label}` : ''}`
                                            }
                                        </p>
                                    </div>

                                    <div
                                        style={{
                                            padding: '20px 24px 24px',
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                            gap: '24px 16px',
                                        }}
                                    >
                                        {hasNew
                                            ? Object.entries(log.new_values!).filter(([k]) => !k.endsWith('_type')).map(([key, newVal], fi) => {
                                                const oldVal = log.old_values?.[key];
                                                const hasOldVal = oldVal !== undefined && oldVal !== null;
                                                const isColorField = key === 'selective_color';
                                                const scColor = isColorField ? SELECTIVE_COLOR_TONES[String(newVal).toLowerCase()] : undefined;
                                                return (
                                                    <div
                                                        key={key}
                                                        style={{
                                                            padding: '4px 8px',
                                                            minWidth: 0,
                                                            textAlign: 'left',
                                                            opacity: isOpen ? 1 : 0,
                                                            transform: isOpen ? 'translateY(0)' : 'translateY(4px)',
                                                            transition: `opacity 280ms ease ${80 + fi * 30}ms, transform 280ms ease ${80 + fi * 30}ms`,
                                                        }}
                                                    >
                                                        <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted, #6b7280)', marginBottom: '5px' }}>
                                                            {formatKey(key)}
                                                        </p>
                                                        {hasOldVal && (
                                                            <p
                                                                style={{
                                                                    fontSize: '10px',
                                                                    fontFamily: 'monospace',
                                                                    textDecoration: 'line-through',
                                                                    color: 'var(--color-text-muted, #6b7280)',
                                                                    opacity: 0.55,
                                                                    marginBottom: '2px',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                }}
                                                                title={formatValue(oldVal)}
                                                            >
                                                                {formatValue(oldVal)}
                                                            </p>
                                                        )}
                                                        {isColorField && scColor ? (
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                                padding: '2px 8px', borderRadius: '999px',
                                                                background: `${scColor}22`,
                                                                border: `1px solid ${scColor}55`,
                                                                fontSize: '11px', fontWeight: 700, fontFamily: 'monospace',
                                                                color: scColor,
                                                            }}>
                                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: scColor, flexShrink: 0 }} />
                                                                {formatValue(newVal)}
                                                            </span>
                                                        ) : (
                                                            <p
                                                                style={{
                                                                    fontSize: '11px',
                                                                    fontFamily: 'monospace',
                                                                    fontWeight: 600,
                                                                    color: hasOldVal ? cfg.color : 'var(--color-text-primary, #f0f0f0)',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                }}
                                                                title={formatValue(newVal)}
                                                            >
                                                                {formatValue(newVal)}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })
                                            : Object.entries(log.old_values!).filter(([k]) => !k.endsWith('_type')).map(([key, oldVal], fi) => {
                                                const isColorField = key === 'selective_color';
                                                const scColor = isColorField ? SELECTIVE_COLOR_TONES[String(oldVal).toLowerCase()] : undefined;
                                                return (
                                                    <div
                                                        key={key}
                                                        style={{
                                                            padding: '4px 8px',
                                                            minWidth: 0,
                                                            textAlign: 'left',
                                                            opacity: isOpen ? 1 : 0,
                                                            transform: isOpen ? 'translateY(0)' : 'translateY(4px)',
                                                            transition: `opacity 280ms ease ${80 + fi * 30}ms, transform 280ms ease ${80 + fi * 30}ms`,
                                                        }}
                                                    >
                                                        <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted, #6b7280)', marginBottom: '5px' }}>
                                                            {formatKey(key)}
                                                        </p>
                                                        {isColorField && scColor ? (
                                                            <span style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                                padding: '2px 8px', borderRadius: '999px',
                                                                background: `${scColor}22`,
                                                                border: `1px solid ${scColor}55`,
                                                                fontSize: '11px', fontWeight: 700, fontFamily: 'monospace',
                                                                color: scColor,
                                                            }}>
                                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: scColor, flexShrink: 0 }} />
                                                                {formatValue(oldVal)}
                                                            </span>
                                                        ) : (
                                                            <p
                                                                style={{
                                                                    fontSize: '11px',
                                                                    fontFamily: 'monospace',
                                                                    color: 'var(--color-text-secondary, #9ca3af)',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                }}
                                                                title={formatValue(oldVal)}
                                                            >
                                                                {formatValue(oldVal)}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </Fragment>
    );
};
