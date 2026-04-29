export type LegalDocumentCategoryCode =
    | 'affidavit_oath'
    | 'power_of_attorney'
    | 'real_estate'
    | 'business'
    | 'other';

export type LegalFileCategoryCode =
    | 'intern_records'
    | 'case_documents'
    | 'other_legal_files';

export type LegalDigitalStatus = 'missing_upload' | 'uploaded';

export type LegalBookStatus = 'active' | 'full' | 'archived';

export type NotarialActTypeCode = 'jurat' | 'acknowledgment' | 'oath_affirmation';
export type NotarialTemplateStatus = 'ready' | 'missing_file';
export type NotarialTemplateFieldTypeCode = 'text' | 'textarea' | 'date' | 'number' | 'email' | 'select';

export type PaginationMeta = {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

export type PaginatedResponse<T> = {
    data: T[];
    meta: PaginationMeta;
};

export type LegalDocumentCategory = {
    code: LegalDocumentCategoryCode;
    label: string;
    description: string;
};

export type LegalFileCategory = {
    code: LegalFileCategoryCode;
    label: string;
    description: string;
};

export type NotarialActType = {
    code: NotarialActTypeCode;
    label: string;
};

export type NotarialTemplateFieldType = {
    code: NotarialTemplateFieldTypeCode;
    label: string;
};

export type LegalDocumentType = {
    code: string;
    label: string;
    category: LegalDocumentCategoryCode;
    default_notarial_act_type: NotarialActTypeCode;
};

export type LegalFileType = {
    code: string;
    label: string;
    category: LegalFileCategoryCode;
};

export type LegalGroupedDocumentCategory = LegalDocumentCategory & {
    document_types: LegalDocumentType[];
};

export type LegalGroupedFileCategory = LegalFileCategory & {
    file_types: LegalFileType[];
};

export type LegalCatalogResponse = {
    notarial_act_types: NotarialActType[];
    template_field_types: NotarialTemplateFieldType[];
    categories: LegalDocumentCategory[];
    document_types: LegalDocumentType[];
    grouped_document_types: LegalGroupedDocumentCategory[];
    legal_file_categories: LegalFileCategory[];
    legal_file_types: LegalFileType[];
    grouped_legal_file_types: LegalGroupedFileCategory[];
};

export type LegalArchiveFile = {
    filename: string;
    mime_type: string | null;
    size_bytes: number;
    formatted_size: string;
    download_url: string;
};

export type LegalBook = {
    id: number;
    book_number: number;
    year: number;
    status: LegalBookStatus;
    generated_record_count?: number;
    page_scan_count?: number;
    legacy_file_count?: number;
    opened_at: string | null;
    closed_at: string | null;
    notes: string | null;
    scan_file: LegalArchiveFile | null;
    created_at: string | null;
    updated_at: string | null;
};

export type LegalPageScan = {
    id: number;
    notarial_book_id: number;
    page_start: number;
    page_end: number;
    page_range_label: string;
    filename: string;
    mime_type: string | null;
    size_bytes: number;
    formatted_size: string;
    download_url: string;
    uploaded_by?: {
        id: number;
        name: string;
    } | null;
    created_at: string | null;
    updated_at: string | null;
};

export type LegalLegacyBookFile = {
    id: number;
    notarial_book_id: number;
    filename: string;
    mime_type: string | null;
    size_bytes: number;
    formatted_size: string;
    download_url: string;
    uploaded_by?: {
        id: number;
        name: string;
    } | null;
    created_at: string | null;
    updated_at: string | null;
};

export type LegalParty = {
    id: number;
    name: string;
    principal_address: string | null;
    created_at: string | null;
    updated_at: string | null;
};

export type NotarialTemplateFieldDefinition = {
    name: string;
    label: string;
    type: NotarialTemplateFieldTypeCode;
    required: boolean;
    placeholder?: string | null;
    help_text?: string | null;
    options?: string[] | null;
};

export type NotarialTemplate = {
    id: number;
    code: string;
    label: string;
    document_code: string;
    document_code_label: string | null;
    document_category: LegalDocumentCategoryCode;
    document_category_label: string | null;
    default_notarial_act_type: NotarialActTypeCode;
    default_notarial_act_type_label: string | null;
    description: string | null;
    field_schema: NotarialTemplateFieldDefinition[];
    is_active: boolean;
    template_status: NotarialTemplateStatus;
    source_file: LegalArchiveFile | null;
    created_by?: {
        id: number;
        name: string;
    } | null;
    created_at: string | null;
    updated_at: string | null;
};

export type NotarialTemplateRecord = {
    id: number;
    template_code: string;
    template_label: string;
    document_code: string;
    document_code_label: string | null;
    document_category: LegalDocumentCategoryCode;
    document_category_label: string | null;
    notarial_act_type: NotarialActTypeCode;
    notarial_act_type_label: string | null;
    party_name: string;
    template_data: Record<string, unknown>;
    notes: string | null;
    generated_at: string | null;
    generated_file: LegalArchiveFile;
    template?: {
        id: number;
        code: string;
        label: string;
    } | null;
    book?: {
        id: number;
        book_number: number | null;
        year: number | null;
        status: LegalBookStatus | null;
    } | null;
    created_by?: {
        id: number;
        name: string;
    } | null;
    created_at: string | null;
    updated_at: string | null;
};

export type LegalArchiveRecord = {
    id: number;
    file_category: LegalFileCategoryCode;
    file_category_label: string | null;
    file_code: string;
    file_code_label: string | null;
    title: string;
    related_name: string;
    document_date: string | null;
    notes: string | null;
    upload_status: LegalDigitalStatus;
    file: LegalArchiveFile | null;
    created_by?: {
        id: number;
        name: string;
    } | null;
    created_at: string | null;
    updated_at: string | null;
};

export type CreateNotarialTemplatePayload = {
    code: string;
    label: string;
    document_code: string;
    default_notarial_act_type?: NotarialActTypeCode;
    description?: string;
    field_schema: NotarialTemplateFieldDefinition[];
    is_active?: boolean;
    file?: File | null;
};

export type UpdateNotarialTemplatePayload = {
    code?: string;
    label?: string;
    document_code?: string;
    default_notarial_act_type?: NotarialActTypeCode;
    description?: string;
    field_schema?: NotarialTemplateFieldDefinition[];
    is_active?: boolean;
    file?: File | null;
};

export type GenerateNotarialTemplateRecordPayload = {
    notarial_template_id: number;
    notarial_book_id?: number;
    party_name: string;
    notes?: string;
    template_data: Record<string, unknown>;
};

export type CreateNotarialPageScanPayload = {
    page_start: number;
    page_end: number;
    file: File;
};

export type CreateNotarialLegacyFilesPayload = {
    files: File[];
};

export type UpdateNotarialPageScanPayload = {
    page_start: number;
    page_end: number;
    file?: File | null;
};

export type CreateNotarialBookPayload = {
    book_number: number;
    year: number;
    status?: LegalBookStatus;
    notes?: string;
    file?: File | null;
};

export type UpdateNotarialBookPayload = {
    book_number?: number;
    year?: number;
    status?: LegalBookStatus;
    notes?: string;
    file?: File | null;
};

export type CreateLegalArchiveRecordPayload = {
    file_category: LegalFileCategoryCode;
    file_code: string;
    title: string;
    related_name: string;
    document_date?: string;
    notes?: string;
    file?: File | null;
};

export type LegalBooksQuery = {
    status?: LegalBookStatus;
    year?: number;
    per_page?: number;
    page?: number;
};

export type NotarialTemplateQuery = {
    search?: string;
    document_code?: string;
    template_status?: NotarialTemplateStatus;
    is_active?: boolean;
    page?: number;
    per_page?: number;
};

export type NotarialTemplateRecordQuery = {
    search?: string;
    document_code?: string;
    document_category?: LegalDocumentCategoryCode;
    notarial_act_type?: NotarialActTypeCode;
    notarial_template_id?: number;
    book_id?: number;
    page?: number;
    per_page?: number;
};

export type LegalArchiveQuery = {
    search?: string;
    file_category?: LegalFileCategoryCode;
    upload_status?: LegalDigitalStatus;
    page?: number;
    per_page?: number;
};
