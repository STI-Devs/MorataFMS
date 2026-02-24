import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../api/trackingApi';
import type { ApiExportTransaction, ApiImportTransaction, ExportTransaction, ImportTransaction } from '../types';

const mapImport = (t: ApiImportTransaction): ImportTransaction => ({
    id: t.id,
    ref: t.customs_ref_no,
    bl: t.bl_no,
    status:
        t.status === 'pending' ? 'Pending' :
            t.status === 'in_progress' ? 'In Transit' :
                t.status === 'completed' ? 'Cleared' : 'Delayed',
    color:
        t.selective_color === 'green' ? 'bg-green-500' :
            t.selective_color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500',
    importer: t.importer?.name || 'Unknown',
    date: t.arrival_date || '',
});

const mapExport = (t: ApiExportTransaction): ExportTransaction => ({
    id: t.id,
    ref: `EXP-${String(t.id).padStart(4, '0')}`,
    bl: t.bl_no,
    status:
        t.status === 'pending' ? 'Processing' :
            t.status === 'in_progress' ? 'In Transit' :
                t.status === 'completed' ? 'Shipped' : 'Delayed',
    color: '',
    shipper: t.shipper?.name || 'Unknown',
    vessel: t.vessel || '',
    departureDate: t.created_at
        ? new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '',
    portOfDestination: t.destination_country?.name || '',
});

export const useTransactionDetail = (referenceId: string | undefined) =>
    useQuery<ImportTransaction | ExportTransaction | undefined>({
        queryKey: ['transaction-detail', referenceId],
        queryFn: async () => {
            if (!referenceId) return undefined;
            // Try imports first
            const importsRes = await trackingApi.getImports({ search: referenceId });
            if (importsRes.data.length > 0) return mapImport(importsRes.data[0]);
            // Fall back to exports
            const exportsRes = await trackingApi.getExports({ search: referenceId });
            if (exportsRes.data.length > 0) return mapExport(exportsRes.data[0]);
            return undefined;
        },
        enabled: !!referenceId,
        staleTime: 1000 * 60 * 2, // 2 min — details change less often
    });

