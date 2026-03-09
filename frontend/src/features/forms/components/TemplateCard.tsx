import type { FormTemplate } from '../types/forms.types';

interface Props {
    t: FormTemplate;
    active: boolean;
    onClick: () => void;
}

export const TemplateCard = ({ t, active, onClick }: Props) => {
    const isLandscape = t.id === 'intern-cert';
    return (
        <button onClick={onClick} className="flex flex-col items-center gap-3 w-[140px] group transition-all">
            <div className={`w-full aspect-square rounded overflow-hidden flex items-center justify-center p-4 transition-all border-2
                ${active ? 'bg-border/60 border-blue-500 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.3)]' : 'bg-surface border-transparent hover:bg-hover group-hover:border-border'}`}>
                <div className={`bg-white shadow relative flex flex-col items-center justify-center
                    ${isLandscape ? 'w-24 h-[68px]' : 'w-[72px] h-[92px]'}`}>
                    <div className="w-full h-full flex flex-col border border-gray-200">
                        <div className={`w-full h-6 bg-gradient-to-r ${t.color} flex items-center justify-center`}>
                            <svg className="w-3.5 h-3.5 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.iconPath} />
                            </svg>
                        </div>
                        <div className="flex-1 px-1.5 py-2 space-y-1">
                            <div className="w-3/4 h-0.5 bg-gray-200 rounded-full" />
                            <div className="w-full h-0.5 bg-gray-200 rounded-full" />
                            <div className="w-5/6 h-0.5 bg-gray-200 rounded-full" />
                            <div className="w-2/3 h-0.5 bg-gray-200 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
            <p className="text-sm font-semibold text-text-primary text-center truncate w-full">{t.title}</p>
        </button>
    );
};
