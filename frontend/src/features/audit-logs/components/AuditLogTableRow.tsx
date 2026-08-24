import { Fragment } from 'react';
import { ChevronDown } from 'lucide-react';
import { TableCell, TableRow } from '../../../components/ui/table';
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

export const AuditLogTableRow = ({ log, isOpen, onToggle }: Props) => {
    const cfg = getEventCfg(log.event);
    const isDelete = log.event === 'deleted';

    const hasNew = log.new_values && Object.keys(log.new_values).length > 0;
    const hasOldOnly = isDelete && log.old_values && Object.keys(log.old_values).length > 0;
    const changesData = hasNew ? log.new_values : hasOldOnly ? log.old_values : null;
    const changeCount = countMeaningfulFieldKeys(changesData ?? null);

    return (
        <Fragment>
            <TableRow
                onClick={() => (changeCount > 0 ? onToggle() : undefined)}
                className={`border-b border-border/60 transition-colors ${
                    changeCount > 0 ? 'cursor-pointer hover:bg-muted/50' : 'hover:bg-muted/20'
                } ${isOpen ? 'bg-muted/40 hover:bg-muted/40' : ''}`}
            >
                {/* Timestamp */}
                <TableCell className="py-3 px-4 whitespace-nowrap">
                    <p className="text-xs tabular-nums text-muted-foreground">{formatDate(log.created_at)}</p>
                </TableCell>

                {/* User */}
                <TableCell className="py-3 px-4 whitespace-nowrap">
                    {log.user ? (
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold shrink-0">
                                {log.user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-xs text-foreground truncate max-w-[140px]" title={log.user.name}>
                                {log.user.name}
                            </span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground italic text-xs">System</span>
                    )}
                </TableCell>

                {/* Event */}
                <TableCell className="py-3 px-4 whitespace-nowrap">
                    <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize border"
                        style={{
                            color: cfg.color,
                            backgroundColor: cfg.bg,
                            borderColor: `color-mix(in srgb, ${cfg.color} 25%, transparent)`,
                        }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                        {cfg.label}
                    </span>
                </TableCell>

                {/* Auditable Entity / Record */}
                <TableCell className="py-3 px-4 whitespace-nowrap">
                    {log.auditable_type ? (
                        <span className="inline-flex items-center rounded-md border border-border/80 bg-muted/50 px-2 py-0.5 text-xs font-medium text-foreground capitalize">
                            {log.auditable_type}
                        </span>
                    ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                    )}
                </TableCell>

                {/* Changes Count */}
                <TableCell className="py-3 px-4 whitespace-nowrap">
                    {isDelete && changeCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            Snapshot
                        </span>
                    ) : !isDelete && changeCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            {changeCount} field{changeCount !== 1 ? 's' : ''}
                        </span>
                    ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                    )}
                </TableCell>

                {/* IP Address */}
                <TableCell className="py-3 px-4 whitespace-nowrap text-xs tabular-nums font-mono text-muted-foreground">
                    {log.ip_address ?? '—'}
                </TableCell>

                {/* Chevron */}
                <TableCell className="pr-4 py-3 whitespace-nowrap text-right">
                    {changeCount > 0 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggle();
                            }}
                            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                        >
                            <ChevronDown
                                className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                            />
                        </button>
                    )}
                </TableCell>
            </TableRow>

            {/* Expanded Diff Accordion */}
            {changesData && isOpen && (
                <TableRow className="border-b border-border/80 bg-muted/20 hover:bg-muted/20">
                    <TableCell colSpan={7} className="p-0">
                        <div className="border-t border-border/60 p-4 space-y-3">
                            {/* Summary Badge */}
                            <div className="flex items-center gap-2">
                                <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: cfg.color }}
                                />
                                <p className="text-xs font-semibold" style={{ color: cfg.color }}>
                                    {isDelete
                                        ? `Record Snapshot${log.auditable_label ? ` · ${log.auditable_label}` : ''}`
                                        : `${cfg.label} — ${changeCount} field${changeCount !== 1 ? 's' : ''}${
                                              log.auditable_label ? ` · ${log.auditable_label}` : ''
                                          }`}
                                </p>
                            </div>

                            {/* Diff Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                                {hasNew
                                    ? Object.entries(log.new_values!)
                                          .filter(([k]) => !k.endsWith('_type'))
                                          .map(([key, newVal]) => {
                                              const oldVal = log.old_values?.[key];
                                              const hasOldVal = oldVal !== undefined && oldVal !== null;
                                              const isColorField = key === 'selective_color';
                                              const scColor = isColorField
                                                  ? SELECTIVE_COLOR_TONES[String(newVal).toLowerCase()]
                                                  : undefined;
                                              return (
                                                  <div
                                                      key={key}
                                                      className="rounded-lg border border-border/70 bg-card p-2.5 shadow-2xs text-left min-w-0"
                                                  >
                                                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                                          {formatKey(key)}
                                                      </p>
                                                      {hasOldVal && (
                                                          <p
                                                              className="text-xs font-mono line-through text-muted-foreground/70 mb-0.5 truncate"
                                                              title={formatValue(oldVal)}
                                                          >
                                                              {formatValue(oldVal)}
                                                          </p>
                                                      )}
                                                      {isColorField && scColor ? (
                                                          <span
                                                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold font-mono border"
                                                              style={{
                                                                  background: `color-mix(in srgb, ${scColor} 13%, transparent)`,
                                                                  borderColor: `color-mix(in srgb, ${scColor} 33%, transparent)`,
                                                                  color: scColor,
                                                              }}
                                                          >
                                                              <span
                                                                  className="w-2 h-2 rounded-full shrink-0"
                                                                  style={{ background: scColor }}
                                                              />
                                                              {formatValue(newVal)}
                                                          </span>
                                                      ) : (
                                                          <p
                                                              className="text-xs font-mono font-semibold text-foreground truncate"
                                                              style={{ color: hasOldVal ? cfg.color : undefined }}
                                                              title={formatValue(newVal)}
                                                          >
                                                              {formatValue(newVal)}
                                                          </p>
                                                      )}
                                                  </div>
                                              );
                                          })
                                    : Object.entries(log.old_values!)
                                          .filter(([k]) => !k.endsWith('_type'))
                                          .map(([key, oldVal]) => {
                                              const isColorField = key === 'selective_color';
                                              const scColor = isColorField
                                                  ? SELECTIVE_COLOR_TONES[String(oldVal).toLowerCase()]
                                                  : undefined;
                                              return (
                                                  <div
                                                      key={key}
                                                      className="rounded-lg border border-border/70 bg-card p-2.5 shadow-2xs text-left min-w-0"
                                                  >
                                                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                                          {formatKey(key)}
                                                      </p>
                                                      {isColorField && scColor ? (
                                                          <span
                                                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold font-mono border"
                                                              style={{
                                                                  background: `color-mix(in srgb, ${scColor} 13%, transparent)`,
                                                                  borderColor: `color-mix(in srgb, ${scColor} 33%, transparent)`,
                                                                  color: scColor,
                                                              }}
                                                          >
                                                              <span
                                                                  className="w-2 h-2 rounded-full shrink-0"
                                                                  style={{ background: scColor }}
                                                              />
                                                              {formatValue(oldVal)}
                                                          </span>
                                                      ) : (
                                                          <p
                                                              className="text-xs font-mono text-muted-foreground truncate"
                                                              title={formatValue(oldVal)}
                                                          >
                                                              {formatValue(oldVal)}
                                                          </p>
                                                      )}
                                                  </div>
                                              );
                                          })}
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </Fragment>
    );
};
