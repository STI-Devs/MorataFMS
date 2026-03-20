import type { AppRole, PermissionMap } from '../../../types/access';

export type UserRole = AppRole;

export interface User {
    id: number;
    name: string;
    email: string;
    job_title: string | null;
    role: UserRole;
    role_label: string;
    is_active: boolean;
    departments: ('brokerage' | 'legal')[];
    multi_department: boolean;
    permissions: PermissionMap;
    created_at: string;
    updated_at: string;
}

export interface CreateUserData {
    name: string;
    email: string;
    job_title?: string;
    password: string;
    role: UserRole;
}

export interface UpdateUserData {
    name?: string;
    email?: string;
    job_title?: string | null;
    role?: UserRole;
}
