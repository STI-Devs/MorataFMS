import { CurrentDateTime } from '../../../../components/CurrentDateTime';
import { getStatusStyle } from '../../../../lib/statusStyles';
import { TYPE_CONFIG, formatDate, toTitleCase } from '../../utils/documentsDetail.utils';

type Props = {
    displayRef: string;
    displayClient: string;
    displayDate: string;
    displayStatus: string;
    displayType: 'import' | 'export';
};

export const DocumentsDetailHeader = ({
    displayRef,
    displayClient,
    displayDate,
    displayStatus,
    displayType,
}: Props) => {
    const tc = TYPE_CONFIG[displayType];
    const sc = getStatusStyle(displayStatus);

    return (
        <div className="flex justify-between items-end">
            <div>
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h1 className="text-3xl font-bold text-text-primary">{displayRef}</h1>
                    <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ color: tc.color, backgroundColor: tc.bg }}
                    >
                        {tc.label}
                    </span>
                    <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ color: sc.color, backgroundColor: sc.bg }}
                    >
                        <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: sc.color, boxShadow: `0 0 4px ${sc.color}` }}
                        />
                        {displayStatus}
                    </span>
                </div>
                <p className="text-sm text-text-secondary">
                    {toTitleCase(displayClient)} · {formatDate(displayDate)}
                </p>
            </div>
            <CurrentDateTime
                className="text-right hidden sm:block shrink-0"
                timeClassName="text-2xl font-bold tabular-nums text-text-primary"
                dateClassName="text-sm text-text-secondary"
            />
        </div>
    );
};
