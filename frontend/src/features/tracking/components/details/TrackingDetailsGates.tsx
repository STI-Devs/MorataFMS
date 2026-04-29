import { Icon } from '../../../../components/Icon';

type FinalizedNoticeProps = {
    referenceId: string;
    finalizedStatus?: string;
    onBack: () => void;
    onOpenDocuments: () => void;
};

export const FinalizedNotice = ({
    referenceId,
    finalizedStatus,
    onBack,
    onOpenDocuments,
}: FinalizedNoticeProps) => (
    <div className="text-center py-16 max-w-xl mx-auto">
        <Icon name="file-text" className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-bold text-text-primary">Tracking Has Ended</h3>
        <p className="text-text-secondary mt-1">
            Transaction <span className="font-bold">{referenceId}</span> is already
            <span className="font-bold"> {finalizedStatus ?? 'finalized'}</span>.
        </p>
        <p className="text-text-secondary mt-2 mb-6">
            Live tracking is only available for active transactions. Review the finalized file in Documents.
        </p>
        <div className="flex items-center justify-center gap-3">
            <button
                onClick={onOpenDocuments}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
                Open Documents
            </button>
            <button
                onClick={onBack}
                className="px-4 py-2 bg-surface-secondary text-text-primary rounded-xl font-bold hover:bg-hover transition-colors border border-border"
            >
                Go Back
            </button>
        </div>
    </div>
);

type NotFoundNoticeProps = {
    referenceId?: string;
    onBack: () => void;
};

export const NotFoundNotice = ({ referenceId, onBack }: NotFoundNoticeProps) => (
    <div className="text-center py-16">
        <Icon name="alert-circle" className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-bold text-text-primary">Transaction Not Found</h3>
        <p className="text-text-secondary mt-1 mb-6">
            The transaction with reference <span className="font-bold">{referenceId}</span> could not be found.
        </p>
        <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
        >
            Go Back
        </button>
    </div>
);
