export type UserRole = 'encoder' | 'broker' | 'supervisor' | 'manager' | 'admin';

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateUserData {
    name: string;
    email: string;
    password: string;
    role: UserRole;
}

export interface UpdateUserData {
    name?: string;
    email?: string;
    role?: UserRole;
}
