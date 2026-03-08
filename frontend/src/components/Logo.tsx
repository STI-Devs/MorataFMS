interface LogoProps {
    className?: string;
}

export const Logo = ({ className = "w-12 h-12" }: LogoProps) => {
    return (
        <div className={className}>
            <svg viewBox="0 0 64 64" className="w-full h-full">
                <circle cx="32" cy="32" r="30" fill="#1e3a5f" stroke="#c41e3a" strokeWidth="2" />
                <path d="M20 32 Q32 20 44 32 Q32 44 20 32" fill="#c41e3a" />
                <circle cx="32" cy="32" r="8" fill="white" />
                <path d="M28 28 L36 36 M36 28 L28 36" stroke="#1e3a5f" strokeWidth="2" />
            </svg>
        </div>
    );
};
