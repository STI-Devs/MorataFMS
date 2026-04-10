import { useCurrentDateTime } from '../hooks/useCurrentDateTime';

type CurrentDateTimeProps = {
    className?: string;
    timeClassName?: string; // Kept for interface compatibility but ignored
    dateClassName?: string; // Kept for interface compatibility but ignored
};

export function CurrentDateTime({
    className = '',
}: CurrentDateTimeProps) {
    const dateTime = useCurrentDateTime();

    return (
        <div className={className}>
            <p className="text-2xl font-bold tabular-nums text-text-primary uppercase tracking-tight" style={{ lineHeight: '1.2' }}>{dateTime.time}</p>
            <p className="text-sm font-medium text-text-muted">{dateTime.date}</p>
        </div>
    );
}
