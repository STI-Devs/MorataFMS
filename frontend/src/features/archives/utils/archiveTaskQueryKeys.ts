import type { ArchiveTaskRole } from '../types/archiveTask.types';

export const archiveTaskKeys = {
    operational: (role: ArchiveTaskRole) => ['archives', 'operational', role] as const,
};
