export type Module = 'brokerage' | 'legal';

export const matchesPath = (pathname: string, path: string): boolean =>
    pathname === path || pathname.startsWith(path + '/');

export const matchesAnyPath = (pathname: string, paths: string[]): boolean =>
    paths.some((path) => matchesPath(pathname, path));

export const getInitialModule = (departments: string[]): Module => {
    const saved = localStorage.getItem('activeModule') as Module | null;
    if (saved === 'legal' && departments.includes('legal')) return 'legal';
    if (saved === 'brokerage' && departments.includes('brokerage')) return 'brokerage';
    if (departments.includes('brokerage')) return 'brokerage';
    if (departments.includes('legal')) return 'legal';
    return 'brokerage';
};
