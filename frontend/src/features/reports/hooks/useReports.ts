import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../api/reportApi';
import { reportKeys } from '../utils/queryKeys';

export const useMonthlyReport = (year: number) =>
    useQuery({
        queryKey: reportKeys.monthly(year),
        queryFn: () => reportApi.getMonthly(year),
    });

export const useClientReport = (year: number, month?: number) =>
    useQuery({
        queryKey: reportKeys.clients(year, month),
        queryFn: () => reportApi.getClients(year, month),
    });

export const useTurnaroundReport = (year: number, month?: number) =>
    useQuery({
        queryKey: reportKeys.turnaround(year, month),
        queryFn: () => reportApi.getTurnaround(year, month),
    });
