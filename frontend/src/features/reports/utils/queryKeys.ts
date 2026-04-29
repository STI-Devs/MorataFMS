export const reportKeys = {
    all: ['admin', 'reports'] as const,
    monthly: (year: number) => ['admin', 'reports', 'monthly', year] as const,
    clients: (year: number, month?: number) =>
        ['admin', 'reports', 'clients', year, month] as const,
    turnaround: (year: number, month?: number) =>
        ['admin', 'reports', 'turnaround', year, month] as const,
};
