interface SpinnerProps {
    color?: string;
    size?: number;
}

/**
 * Minimal CSS-only spinner for loading states inside data panels.
 */
export function Spinner({ color = 'var(--primary)', size = 24 }: SpinnerProps) {
    return (
        <div className="flex items-center justify-center py-10">
            <div
                className="rounded-full border-[3px] animate-spin"
                style={{
                    width:       size,
                    height:      size,
                    // color-mix keeps alpha working whether `color` is a hex or a CSS var
                    borderColor: `color-mix(in srgb, ${color} 19%, transparent)`,
                    borderTopColor: color,
                }}
            />
        </div>
    );
}
