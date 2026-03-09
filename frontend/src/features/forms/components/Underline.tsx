interface Props {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    wide?: boolean;
}

export const Underline = ({ value, onChange, placeholder, wide }: Props) => (
    <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`border-b border-gray-800 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-600 transition-colors pb-0.5 ${wide ? 'w-full' : 'min-w-[120px] w-auto'}`}
    />
);
