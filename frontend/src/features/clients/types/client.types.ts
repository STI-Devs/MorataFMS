export type ClientType = 'importer' | 'exporter' | 'both';

export interface Country {
    id: number;
    name: string;
    code: string;
}

export interface Client {
    id: number;
    name: string;
    type: ClientType;
    country_id: number | null;
    country: Country | null;
    contact_person: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    address: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateClientData {
    name: string;
    type: ClientType;
    country_id?: number | null;
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;
    address?: string;
}

export interface UpdateClientData {
    name?: string;
    type?: ClientType;
    country_id?: number | null;
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;
    address?: string;
}

export interface ImportTransaction {
    id: number;
    type: 'import';
    customs_ref_no: string | null;
    bl_no: string | null;
    arrival_date: string | null;
    status: string;
    selective_color?: string;
    assigned_user: { id: number; name: string } | null;
    created_at: string;
}

export interface ExportTransaction {
    id: number;
    type: 'export';
    bl_no: string | null;
    vessel?: string | null;
    destination?: string | null;
    status: string;
    assigned_user: { id: number; name: string } | null;
    created_at: string;
}

export type ClientTransaction = ImportTransaction | ExportTransaction;

export interface ClientTransactionHistory {
    transactions: {
        imports: ImportTransaction[];
        exports: ExportTransaction[];
    };
}
