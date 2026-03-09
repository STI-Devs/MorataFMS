export interface Field {
    id: string;
    label: string;
    type: 'text' | 'date' | 'textarea' | 'signature';
    value: string;
    placeholder?: string;
    rows?: number;
}

export interface FormTemplate {
    id: string;
    title: string;
    description: string;
    color: string;
    iconPath: string;
    fields: Field[];
}
