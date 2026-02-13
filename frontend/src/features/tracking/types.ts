export interface LayoutContext {
    user?: { name: string; role: string };
    dateTime: { time: string; date: string };
}

export interface ImportTransaction {
    ref: string;
    bl: string;
    status: string;
    color: string;
    importer: string;
    date: string;
}

export interface ExportTransaction {
    ref: string;
    bl: string;
    status: string;
    color: string;
    shipper: string;
    vessel: string;
}

export interface FileData {
    id: number;
    name: string;
    date: string;
    uploadDate: string;
    uploader: { name: string; initials: string; role: string; color: string };
    size: string;
    type: 'pdf' | 'docx' | 'jpg';
    iconColor: string;
}
