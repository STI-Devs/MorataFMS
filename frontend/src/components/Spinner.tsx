interface SpinnerProps {
    color?: string;
    size?: string;
}

/**
 * Simple centered spinner used for loading states in transaction panels.
 */
export function Spinner({ color = '#0a84ff', size = 'w-8 h-8' }: SpinnerProps) {
    return (
        <div className="flex items-center justify-center p-16">
            <div
                className={`${size} rounded-full border-[3px] border-transparent animate-spin`}
                style={{ borderTopColor: color }}
            />
        </div>
    );
}
