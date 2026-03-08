import type { IconName } from '../../../../components/Icon';
import { Icon } from '../../../../components/Icon';

export const EmptyState = ({ icon, title, subtitle, action }: {
    icon: IconName; title: string; subtitle?: string; action?: React.ReactNode;
}) => (
    <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
        <div className="w-14 h-14 rounded-xl border border-gray-200 flex items-center justify-center bg-gray-50">
            <Icon name={icon} className="w-7 h-7 opacity-40" />
        </div>
        <div className="text-center">
            <p className="text-sm font-semibold text-gray-600">{title}</p>
            {subtitle && <p className="text-xs mt-0.5 text-gray-400">{subtitle}</p>}
        </div>
        {action}
    </div>
);
