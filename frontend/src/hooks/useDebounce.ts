import { useEffect, useRef, useState } from 'react';

/**
 * Delays updating the returned value until `delay` ms have passed
 * since the last change. Used to avoid firing API requests on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState<T>(value);
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        timerRef.current = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timerRef.current);
    }, [value, delay]);

    return debounced;
}
