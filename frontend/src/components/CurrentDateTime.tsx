import { useCurrentDateTime } from '../hooks/useCurrentDateTime';

type CurrentDateTimeProps = {
    className?: string;
    timeClassName?: string;
    dateClassName?: string;
};

export function CurrentDateTime({
    className = '',
    timeClassName = '',
    dateClassName = '',
}: CurrentDateTimeProps) {
    const dateTime = useCurrentDateTime();

    return (
        <div className={className}>
            <p className={timeClassName}>{dateTime.time}</p>
            <p className={dateClassName}>{dateTime.date}</p>
        </div>
    );
}
