import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../api/reportApi';

export const useMonthlyReport = (year: number) =>
    useQuery({
        queryKey: ['admin', 'reports', 'monthly', year],
        queryFn: () => reportApi.getMonthly(year),
    });

export const useClientReport = (year: number, month?: number) =>
    useQuery({
        queryKey: ['admin', 'reports', 'clients', year, month],
        queryFn: () => reportApi.getClients(year, month),
    });

export const useTurnaroundReport = (year: number, month?: number) =>
    useQuery({
        queryKey: ['admin', 'reports', 'turnaround', year, month],
        queryFn: () => reportApi.getTurnaround(year, month),
    });
