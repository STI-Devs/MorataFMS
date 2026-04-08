import type { AppRole, PermissionMap } from '../../../types/access';

// Auth Types
export interface User {
    id: number;
    email: string;
    name: string;
    job_title: string | null;
    role: AppRole;
    role_label: string;
    departments: ('brokerage' | 'legal')[];
    multi_department: boolean;
    permissions: PermissionMap;
}

export interface LoginCredentials {
    email: string;
    password: string;
    turnstile_token?: string;
}

export interface AuthResponse {
    user: User;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
