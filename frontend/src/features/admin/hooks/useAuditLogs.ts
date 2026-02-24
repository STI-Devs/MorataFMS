import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { auditLogApi } from '../api/auditLogApi';
import type { AuditLogFilters } from '../types/auditLog.types';

export const useAuditLogs = (filters: AuditLogFilters = {}) =>
    useQuery({
        queryKey: ['admin', 'audit-logs', filters],
        queryFn: () => auditLogApi.getLogs(filters),
        placeholderData: keepPreviousData,
    });

export const useAuditActions = () =>
    useQuery({
        queryKey: ['admin', 'audit-actions'],
        queryFn: () => auditLogApi.getActions(),
        select: (res) => res.data ?? [],
        staleTime: Infinity,
    });
