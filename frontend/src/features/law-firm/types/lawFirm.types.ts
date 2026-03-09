export interface BookFile {
    id: number;
    name: string;
    uploadedBy: string;
    date: string;
}

export interface Book {
    id: number;
    name: string;
    uploadedBy: string;
    date: string;
    totalSlots: number;
    files: BookFile[];
}
