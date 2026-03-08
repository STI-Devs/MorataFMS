interface SpinnerProps {
    color?: string;
    size?: number;
}

/**
 * Minimal CSS-only spinner for loading states inside data panels.
 */
export function Spinner({ color = '#0a84ff', size = 24 }: SpinnerProps) {
    return (
        <div className="flex items-center justify-center py-10">
            <div
                className="rounded-full border-[3px] animate-spin"
                style={{
                    width:       size,
                    height:      size,
                    borderColor: `${color}30`,
                    borderTopColor: color,
                }}
            />
        </div>
    );
}
