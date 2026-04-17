export type CountryType = 'import_origin' | 'export_destination' | 'both';

export interface Country {
    id: number;
    name: string;
    code: string | null;
    type: CountryType;
    type_label: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateCountryData {
    name: string;
    code?: string | null;
    type: CountryType;
}

export interface UpdateCountryData {
    name: string;
    code?: string | null;
    type: CountryType;
}
