import type { ArchiveYear } from '../../documents/types/document.types';
import type { DrillState } from './archive.utils';
import { FOLDER_LABEL, MONTH_NAMES } from './archive.utils';

export type BreadcrumbPart = {
    label: string;
    onClick?: () => void;
};

interface BuildBreadcrumbPartsArgs {
    currentDrill: DrillState;
    nav: (next: DrillState) => void;
    navToYear: (yr: ArchiveYear) => void;
}

export function buildBreadcrumbParts({
    currentDrill,
    nav,
    navToYear,
}: BuildBreadcrumbPartsArgs): BreadcrumbPart[] {
    const baseCrumb: BreadcrumbPart = {
        label: 'Archives',
        onClick: currentDrill.level !== 'years' ? () => nav({ level: 'years' }) : undefined,
    };

    if (currentDrill.level === 'years') {
        return [baseCrumb];
    }

    if (currentDrill.level === 'types') {
        return [baseCrumb, { label: String(currentDrill.year.year) }];
    }

    if (currentDrill.level === 'months') {
        return [
            baseCrumb,
            { label: String(currentDrill.year.year), onClick: () => navToYear(currentDrill.year) },
            { label: `${FOLDER_LABEL[currentDrill.type as keyof typeof FOLDER_LABEL]}/` },
        ];
    }

    if (currentDrill.level === 'bls') {
        return [
            baseCrumb,
            { label: String(currentDrill.year.year), onClick: () => navToYear(currentDrill.year) },
            { label: `${FOLDER_LABEL[currentDrill.type as keyof typeof FOLDER_LABEL]}/`, onClick: () => navToYear(currentDrill.year) },
            { label: `${MONTH_NAMES[currentDrill.month - 1]}/` },
        ];
    }

    return [
        baseCrumb,
        { label: String(currentDrill.year.year), onClick: () => navToYear(currentDrill.year) },
        { label: `${FOLDER_LABEL[currentDrill.type as keyof typeof FOLDER_LABEL]}/`, onClick: () => navToYear(currentDrill.year) },
        {
            label: `${MONTH_NAMES[currentDrill.month - 1]}/`,
            onClick: () => nav({ level: 'bls', year: currentDrill.year, type: currentDrill.type, month: currentDrill.month }),
        },
        { label: `${currentDrill.bl}/` },
    ];
}
