import { Icon } from '../../../../components/Icon';
import type { LegacyBatchSummary } from '../../types/legacyBatch.types';

type LegacyBatchZipButtonProps = {
    batch: LegacyBatchSummary;
    isBusy?: boolean;
    compact?: boolean;
    onRequest: (batchId: string) => void;
    onRetry: (batchId: string, exportId: string) => void;
    onDownload: (exportId: string, filename: string) => void;
};

const isActiveZipStatus = (status?: string): boolean => status === 'pending' || status === 'processing';

export const LegacyBatchZipButton = ({
    batch,
    isBusy = false,
    compact = false,
    onRequest,
    onRetry,
    onDownload,
}: LegacyBatchZipButtonProps) => {
    if (!batch.canRequestZip || batch.status !== 'completed') {
        return null;
    }

    const zipExport = batch.zipExport;
    const isPreparing = isBusy || isActiveZipStatus(zipExport?.status);
    const isReady = zipExport?.status === 'ready' && zipExport.canDownload;
    const needsRetry = zipExport?.status === 'failed' || zipExport?.status === 'expired';
    const label = isPreparing
        ? 'Preparing ZIP'
        : isReady
            ? 'Download ZIP'
            : needsRetry
                ? 'Retry ZIP'
                : 'Prepare ZIP';

    const handleClick = () => {
        if (isPreparing) {
            return;
        }

        if (isReady && zipExport) {
            onDownload(zipExport.id, zipExport.filename);
            return;
        }

        if (needsRetry && zipExport) {
            onRetry(batch.id, zipExport.id);
            return;
        }

        onRequest(batch.id);
    };

    return (
        <button
            type="button"
            disabled={isPreparing}
            onClick={handleClick}
            title={zipExport?.errorMessage ?? label}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                isReady
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : needsRetry
                        ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                        : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
            } ${compact ? 'xl:min-w-[96px]' : ''}`}
        >
            <Icon name={isPreparing ? 'clock' : 'download'} className="h-3.5 w-3.5" />
            {label}
        </button>
    );
};
