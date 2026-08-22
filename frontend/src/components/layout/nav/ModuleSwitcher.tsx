import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from '@/components/ui/sidebar';
import type { Module } from '../utils/mainLayout.utils';

type Props = {
    activeModule: Module;
    hasBrokerage: boolean;
    hasLegal: boolean;
    onSwitch: (mod: Module) => void;
};

export const ModuleSwitcher = ({ activeModule, hasBrokerage, hasLegal, onSwitch }: Props) => {
    const { state, isMobile } = useSidebar();
    const isCollapsed = state === 'collapsed' && !isMobile;

    return (
        <div className="flex w-full gap-1 p-1 rounded-lg bg-sidebar-accent/60 transition-all duration-200 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:gap-1.5 group-data-[collapsible=icon]:items-center">
            {hasBrokerage && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            onClick={() => onSwitch('brokerage')}
                            aria-label="Brokerage"
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all duration-200 overflow-hidden group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:flex-initial cursor-pointer ${
                                activeModule === 'brokerage'
                                    ? 'bg-sidebar-foreground text-sidebar shadow-xs font-bold'
                                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                            }`}
                        >
                            <svg className="size-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 2v6h6" />
                            </svg>
                            <span className="truncate group-data-[collapsible=icon]:hidden">Brokerage</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center" hidden={!isCollapsed}>
                        Brokerage
                    </TooltipContent>
                </Tooltip>
            )}
            {hasLegal && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            onClick={() => onSwitch('legal')}
                            aria-label="Legal"
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all duration-200 overflow-hidden group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:flex-initial cursor-pointer ${
                                activeModule === 'legal'
                                    ? 'bg-sidebar-foreground text-sidebar shadow-xs font-bold'
                                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                            }`}
                        >
                            <svg className="size-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 6l9-3 9 3M12 3v18M5 21h14M7 10l-2 4h4L7 10zM17 10l-2 4h4l-2-4z" />
                            </svg>
                            <span className="truncate group-data-[collapsible=icon]:hidden">Legal</span>
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center" hidden={!isCollapsed}>
                        Legal
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
};
