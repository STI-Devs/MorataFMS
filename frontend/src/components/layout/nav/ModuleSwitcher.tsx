import type { Module } from '../utils/mainLayout.utils';

type Props = {
    activeModule: Module;
    hasBrokerage: boolean;
    hasLegal: boolean;
    isSidebarDark: boolean;
    onSwitch: (mod: Module) => void;
};

export const ModuleSwitcher = ({ activeModule, hasBrokerage, hasLegal, isSidebarDark, onSwitch }: Props) => (
    <div className={`flex gap-1 mb-5 p-1 rounded-lg ${isSidebarDark ? 'bg-white/6' : 'bg-black/6'}`}>
        {hasBrokerage && (
            <button
                onClick={() => onSwitch('brokerage')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${activeModule === 'brokerage'
                    ? isSidebarDark ? 'bg-white text-black shadow-sm' : 'bg-black text-white shadow-sm'
                    : isSidebarDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
            >
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 2v6h6" />
                </svg>
                Brokerage
            </button>
        )}
        {hasLegal && (
            <button
                onClick={() => onSwitch('legal')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${activeModule === 'legal'
                    ? isSidebarDark ? 'bg-white text-black shadow-sm' : 'bg-black text-white shadow-sm'
                    : isSidebarDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
            >
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 6l9-3 9 3M12 3v18M5 21h14M7 10l-2 4h4L7 10zM17 10l-2 4h4l-2-4z" />
                </svg>
                Legal
            </button>
        )}
    </div>
);
