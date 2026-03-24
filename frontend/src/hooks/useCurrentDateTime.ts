import { useEffect, useState } from 'react';

const DATE_TIME_LOCALE = 'en-US';
const DATE_TIME_TIME_ZONE = 'Asia/Manila';
const DATE_TIME_REFRESH_INTERVAL = 60_000;

type DateTimeValue = {
    time: string;
    date: string;
};

function formatCurrentDateTime(): DateTimeValue {
    const now = new Date();

    return {
        time: now.toLocaleTimeString(DATE_TIME_LOCALE, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: DATE_TIME_TIME_ZONE,
        }),
        date: now.toLocaleDateString(DATE_TIME_LOCALE, {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            timeZone: DATE_TIME_TIME_ZONE,
        }),
    };
}

export function useCurrentDateTime(): DateTimeValue {
    const [dateTime, setDateTime] = useState<DateTimeValue>(() => formatCurrentDateTime());

    useEffect(() => {
        const timer = window.setInterval(() => {
            setDateTime(formatCurrentDateTime());
        }, DATE_TIME_REFRESH_INTERVAL);

        return () => window.clearInterval(timer);
    }, []);

    return dateTime;
}
