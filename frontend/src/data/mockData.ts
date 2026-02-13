import type { ExportTransaction, FileData, ImportTransaction } from '../features/tracking/types';

export const MOCK_IMPORTS: ImportTransaction[] = [
    { ref: 'REF-2024-001', bl: 'BL-78542136', status: 'Cleared', color: 'bg-green-500', importer: 'ABC Trading Co.', date: 'Jan 15, 2024' },
    { ref: 'REF-2024-002', bl: 'BL-78542137', status: 'Pending', color: 'bg-yellow-500', importer: 'XYZ Imports Ltd.', date: 'Feb 20, 2024' },
    { ref: 'REF-2024-003', bl: 'BL-78542138', status: 'Delayed', color: 'bg-red-500', importer: 'Global Freight Inc.', date: 'Mar 10, 2024' },
    { ref: 'REF-2024-004', bl: 'BL-78542139', status: 'Cleared', color: 'bg-green-500', importer: 'Metro Supplies', date: 'Apr 05, 2024' },
    { ref: 'REF-2024-005', bl: 'BL-78542140', status: 'In Transit', color: 'bg-blue-500', importer: 'Prime Logistics', date: 'May 18, 2024' },
];

export const MOCK_EXPORTS: ExportTransaction[] = [
    { ref: 'REF-EXP-001', bl: 'BL-78542136', status: 'Shipped', color: 'bg-green-500', shipper: 'ABC Exports Inc.', vessel: 'MV Northern Light' },
    { ref: 'REF-EXP-002', bl: 'BL-78542137', status: 'Processing', color: 'bg-yellow-500', shipper: 'Global Trade Ltd.', vessel: 'Evergreen Star' },
    { ref: 'REF-EXP-003', bl: 'BL-78542138', status: 'Delayed', color: 'bg-red-500', shipper: 'Fast Cargo Co.', vessel: 'Pacific Voyager' },
    { ref: 'REF-EXP-004', bl: 'BL-78542139', status: 'Shipped', color: 'bg-green-500', shipper: 'Metro Supplies', vessel: 'MSC Oscar' },
    { ref: 'REF-EXP-005', bl: 'BL-78542140', status: 'In Transit', color: 'bg-blue-500', shipper: 'Prime Logistics', vessel: 'Hapag-Lloyd' },
];

export const MOCK_FILES: FileData[] = [
    {
        id: 1,
        name: 'Import_Manifest_Nov2025.pdf',
        date: 'Nov 20, 2025',
        uploadDate: 'Nov 23, 2025',
        uploader: { name: 'John Doe', initials: 'JD', role: 'Admin', color: 'bg-[#1a2332]' },
        size: '2.4 MB',
        type: 'pdf',
        iconColor: 'bg-red-50 text-red-500',
    },
    {
        id: 2,
        name: 'Packing_List_Final.docx',
        date: 'Nov 18, 2025',
        uploadDate: 'Nov 22, 2025',
        uploader: { name: 'Alice Smith', initials: 'AS', role: 'Manager', color: 'bg-[#c41e3a]' },
        size: '1.8 MB',
        type: 'docx',
        iconColor: 'bg-blue-50 text-blue-500',
    },
    {
        id: 3,
        name: 'Container_Photo_01.jpg',
        date: 'Nov 15, 2025',
        uploadDate: 'Nov 21, 2025',
        uploader: { name: 'Robert Johnson', initials: 'RJ', role: 'Staff', color: 'bg-blue-500' },
        size: '3.5 MB',
        type: 'jpg',
        iconColor: 'bg-orange-50 text-orange-500',
    },
];
