// ─── Types ──────────────────────────────────────────────────────────────────

export interface FileNode {
    name: string;
    type: 'folder' | 'file';
    size?: string;
    modified?: string;
    children?: FileNode[];
}

export interface LegacyBatch {
    id: string;
    batchName: string;
    rootFolder: string;
    uploadedBy: string;
    uploadDate: string;
    fileCount: number;
    totalSize: string;
    status: 'Complete' | 'Partial' | 'Failed';
    tree: FileNode;
}

// ─── Mock data — mirrors client's actual folder structure ─────────────────────

export const MOCK_BATCHES: LegacyBatch[] = [
    {
        id: '1',
        batchName: 'VESSEL 1 — Historical Archive',
        rootFolder: 'VESSEL 1',
        uploadedBy: 'R. Santos',
        uploadDate: 'Apr 17, 2026',
        fileCount: 892,
        totalSize: '4.2 GB',
        status: 'Complete',
        tree: {
            name: 'VESSEL 1',
            type: 'folder',
            children: [
                { name: 'CIL ATTACHMENT', type: 'folder', children: [
                    { name: 'CIL FORM 2023.pdf', type: 'file', size: '1.2 MB', modified: '01/08/2026' },
                    { name: 'CIL SUPPORTING DOCS.pdf', type: 'file', size: '890 KB', modified: '01/08/2026' },
                ]},
                { name: 'CMA VESSEL', type: 'folder', children: [
                    { name: 'BL COPY.pdf', type: 'file', size: '544 KB', modified: '08/22/2025' },
                    { name: 'ARRIVAL NOTICE.pdf', type: 'file', size: '320 KB', modified: '08/22/2025' },
                ]},
                { name: 'CONTSHIP WAY', type: 'folder', children: [
                    { name: 'MANIFEST.pdf', type: 'file', size: '2.1 MB', modified: '04/13/2025' },
                    { name: 'IMPORT ENTRY.pdf', type: 'file', size: '1.4 MB', modified: '04/13/2025' },
                ]},
                { name: 'DANU BHUM', type: 'folder', children: [
                    { name: 'BL COPIES', type: 'folder', children: [
                        { name: 'DANU BHUM BL.pdf', type: 'file', size: '411 KB', modified: '04/10/2025' },
                    ]},
                    { name: 'IMPORT ENTRY DANU BHUM.pdf', type: 'file', size: '980 KB', modified: '04/10/2025' },
                ]},
                { name: 'DOCS FILE', type: 'folder', children: [
                    { name: 'MISC SUPPORTING DOCS.pdf', type: 'file', size: '3.4 MB', modified: '06/23/2025' },
                ]},
                { name: 'ED CANCELLATION', type: 'folder', children: [
                    { name: 'ED CANCELLATION NOTICE.pdf', type: 'file', size: '220 KB', modified: '04/27/2025' },
                    { name: 'CANCELLATION FORM.pdf', type: 'file', size: '180 KB', modified: '04/27/2025' },
                ]},
                {
                    name: 'KOTA HAKIM',
                    type: 'folder',
                    children: [
                        { name: 'KOTA HAKIM 2291W', type: 'folder', children: [
                            { name: 'BL COPIES', type: 'folder', children: [
                                { name: 'KOTA HAKIM 2291W BL.pdf', type: 'file', size: '512 KB', modified: '08/09/2024' },
                            ]},
                            { name: 'E-28901', type: 'folder', children: [
                                { name: 'IMPORT ENTRY E-28901.pdf', type: 'file', size: '1.2 MB', modified: '08/09/2024' },
                                { name: 'AUTHORITY TO RELEASE.pdf', type: 'file', size: '310 KB', modified: '08/09/2024' },
                            ]},
                            { name: 'ARRIVAL NOTICE KH2291W.pdf', type: 'file', size: '280 KB', modified: '08/09/2024' },
                        ]},
                        { name: 'KOTA HAKIM 2293W', type: 'folder', children: [
                            { name: 'BL COPIES', type: 'folder', children: [
                                { name: 'KOTA HAKIM 2293W BL.pdf', type: 'file', size: '490 KB', modified: '11/16/2024' },
                            ]},
                            { name: 'E-29412', type: 'folder', children: [
                                { name: 'IMPORT ENTRY E-29412.pdf', type: 'file', size: '1.1 MB', modified: '11/16/2024' },
                                { name: 'EXAMINATION REPORT.pdf', type: 'file', size: '450 KB', modified: '11/16/2024' },
                            ]},
                        ]},
                        { name: 'KOTA HAKIM 2295W', type: 'folder', children: [
                            { name: 'BL COPIES', type: 'folder', children: [
                                { name: 'KOTA HAKIM 2295W BL.pdf', type: 'file', size: '505 KB', modified: '11/22/2024' },
                            ]},
                            { name: 'E-30001', type: 'folder', children: [
                                { name: 'IMPORT ENTRY E-30001.pdf', type: 'file', size: '1.3 MB', modified: '11/22/2024' },
                            ]},
                        ]},
                        { name: 'KOTA HAKIM 2296W', type: 'folder', children: [
                            { name: 'BL COPIES', type: 'folder', children: [
                                { name: 'KOTA HAKIM 2296W BL.pdf', type: 'file', size: '488 KB', modified: '12/17/2024' },
                            ]},
                            { name: 'E-30214', type: 'folder', children: [
                                { name: 'IMPORT ENTRY E-30214.pdf', type: 'file', size: '1.0 MB', modified: '12/17/2024' },
                                { name: 'AUTHORITY TO RELEASE.pdf', type: 'file', size: '290 KB', modified: '12/17/2024' },
                            ]},
                            { name: 'GENSAN LOADING', type: 'folder', children: [
                                { name: 'LOADING LIST.pdf', type: 'file', size: '720 KB', modified: '12/17/2024' },
                                { name: 'MANIFEST.pdf', type: 'file', size: '1.1 MB', modified: '12/17/2024' },
                            ]},
                        ]},
                        {
                            name: 'KOTA HAKIM 2350W',
                            type: 'folder',
                            children: [
                                { name: 'BL COPIES', type: 'folder', children: [
                                    { name: 'KOTA HAKIM 2350W BL — AKTIV.pdf', type: 'file', size: '524 KB', modified: '08/21/2024' },
                                    { name: 'KOTA HAKIM 2350W BL — DANU.pdf', type: 'file', size: '491 KB', modified: '08/21/2024' },
                                ]},
                                { name: 'E-31406', type: 'folder', children: [
                                    { name: 'IMPORT ENTRY E-31406.pdf', type: 'file', size: '1.655 MB', modified: '08/10/2024' },
                                    { name: 'AUTHORITY TO RELEASE E-31406.pdf', type: 'file', size: '101 KB', modified: '08/10/2024' },
                                    { name: 'BL COPY E-31406.pdf', type: 'file', size: '572 KB', modified: '08/10/2024' },
                                ]},
                                { name: 'E-31407', type: 'folder', children: [
                                    { name: 'IMPORT ENTRY E-31407.pdf', type: 'file', size: '1.224 MB', modified: '08/24/2024' },
                                    { name: 'EXAMINATION REPORT.pdf', type: 'file', size: '920 KB', modified: '08/24/2024' },
                                    { name: 'AUTHORITY TO RELEASE E-31407.pdf', type: 'file', size: '98 KB', modified: '08/24/2024' },
                                ]},
                                { name: 'E-31408', type: 'folder', children: [
                                    { name: 'IMPORT ENTRY E-31408.pdf', type: 'file', size: '1.1 MB', modified: '08/16/2024' },
                                    { name: 'BL COPY.pdf', type: 'file', size: '490 KB', modified: '08/16/2024' },
                                ]},
                                { name: 'GENSAN LOADING', type: 'folder', children: [
                                    { name: 'LOADING LIST GENSAN.pdf', type: 'file', size: '880 KB', modified: '08/14/2024' },
                                    { name: 'MANIFEST GENSAN.pdf', type: 'file', size: '1.9 MB', modified: '08/14/2024' },
                                ]},
                                { name: 'BANANAHOLO DOCS-DVD', type: 'folder', children: [
                                    { name: 'DVD CONTENT LIST.pdf', type: 'file', size: '210 KB', modified: '08/14/2024' },
                                    { name: 'BANANAHOLO DOCS.pdf', type: 'file', size: '4.1 MB', modified: '08/14/2024' },
                                ]},
                                { name: 'CO FORM', type: 'folder', children: [
                                    { name: 'CO FORM KOTA HAKIM 2350W.pdf', type: 'file', size: '320 KB', modified: '08/17/2024' },
                                ]},
                                { name: 'ARRIVAL NOTICE KH2350W.pdf', type: 'file', size: '275 KB', modified: '08/21/2024' },
                                { name: 'BL MANIFEST KH2350W.pdf', type: 'file', size: '1.8 MB', modified: '08/21/2024' },
                            ],
                        },
                        { name: 'KOTA HAKIM 2352W', type: 'folder', children: [
                            { name: 'BL COPIES', type: 'folder', children: [
                                { name: 'KOTA HAKIM 2352W BL.pdf', type: 'file', size: '512 KB', modified: '05/08/2025' },
                            ]},
                            { name: 'E-32100', type: 'folder', children: [
                                { name: 'IMPORT ENTRY E-32100.pdf', type: 'file', size: '1.4 MB', modified: '05/08/2025' },
                            ]},
                        ]},
                    ],
                },
                {
                    name: 'KOTA MAKIM',
                    type: 'folder',
                    children: [
                        { name: 'KOTA MAKIM 2350W', type: 'folder', children: [
                            { name: 'BL COPIES', type: 'folder', children: [
                                { name: 'KOTA MAKIM 2350W BL.pdf', type: 'file', size: '498 KB', modified: '10/24/2024' },
                            ]},
                            { name: 'E-31901', type: 'folder', children: [
                                { name: 'IMPORT ENTRY E-31901.pdf', type: 'file', size: '1.3 MB', modified: '10/24/2024' },
                                { name: 'AUTHORITY TO RELEASE E-31901.pdf', type: 'file', size: '105 KB', modified: '10/24/2024' },
                            ]},
                            { name: 'GENSAN LOADING', type: 'folder', children: [
                                { name: 'LOADING LIST.pdf', type: 'file', size: '740 KB', modified: '10/24/2024' },
                            ]},
                            { name: 'CO FORM', type: 'folder', children: [
                                { name: 'CO FORM KOTA MAKIM 2350W.pdf', type: 'file', size: '290 KB', modified: '10/24/2024' },
                            ]},
                        ]},
                        { name: 'KOTA MAKIM 2351W', type: 'folder', children: [
                            { name: 'BL COPIES', type: 'folder', children: [
                                { name: 'KOTA MAKIM 2351W BL.pdf', type: 'file', size: '520 KB', modified: '09/28/2024' },
                            ]},
                            { name: 'E-32001', type: 'folder', children: [
                                { name: 'IMPORT ENTRY E-32001.pdf', type: 'file', size: '1.1 MB', modified: '09/28/2024' },
                            ]},
                        ]},
                    ],
                },
            ],
        },
    },
    {
        id: '2',
        batchName: 'Vessel Batch — MV Golden Tide 2023',
        rootFolder: 'MV Golden Tide',
        uploadedBy: 'R. Santos',
        uploadDate: 'Apr 10, 2026',
        fileCount: 214,
        totalSize: '1.82 GB',
        status: 'Complete',
        tree: {
            name: 'MV Golden Tide',
            type: 'folder',
            children: [
                { name: 'MV GOLDEN TIDE 001W', type: 'folder', children: [
                    { name: 'BL COPIES', type: 'folder', children: [
                        { name: 'MVGT 001W BL.pdf', type: 'file', size: '512 KB', modified: 'Jan 10, 2023' },
                    ]},
                    { name: 'E-20101', type: 'folder', children: [
                        { name: 'IMPORT ENTRY E-20101.pdf', type: 'file', size: '1.1 MB', modified: 'Jan 10, 2023' },
                        { name: 'EXAMINATION REPORT.pdf', type: 'file', size: '800 KB', modified: 'Jan 10, 2023' },
                    ]},
                ]},
                { name: 'MV GOLDEN TIDE 002W', type: 'folder', children: [
                    { name: 'BL COPIES', type: 'folder', children: [
                        { name: 'MVGT 002W BL.pdf', type: 'file', size: '488 KB', modified: 'Mar 15, 2023' },
                    ]},
                    { name: 'E-20245', type: 'folder', children: [
                        { name: 'IMPORT ENTRY E-20245.pdf', type: 'file', size: '1.3 MB', modified: 'Mar 15, 2023' },
                    ]},
                    { name: 'GENSAN LOADING', type: 'folder', children: [
                        { name: 'LOADING LIST.pdf', type: 'file', size: '920 KB', modified: 'Mar 15, 2023' },
                    ]},
                ]},
                { name: 'MV GOLDEN TIDE 003W', type: 'folder', children: [
                    { name: 'BL COPIES', type: 'folder', children: [
                        { name: 'MVGT 003W BL.pdf', type: 'file', size: '501 KB', modified: 'Jun 8, 2023' },
                    ]},
                    { name: 'CO FORM', type: 'folder', children: [
                        { name: 'CO FORM MVGT 003W.pdf', type: 'file', size: '310 KB', modified: 'Jun 8, 2023' },
                    ]},
                ]},
            ],
        },
    },
    {
        id: '3',
        batchName: 'AKTIV MULTI — Q3 2022 Archive',
        rootFolder: 'AKTIV_2022_Q3',
        uploadedBy: 'M. Reyes',
        uploadDate: 'Mar 28, 2026',
        fileCount: 88,
        totalSize: '430.5 MB',
        status: 'Complete',
        tree: {
            name: 'AKTIV_2022_Q3',
            type: 'folder',
            children: [
                { name: 'IMPORT ENTRIES', type: 'folder', children: [
                    { name: 'E-18001.pdf', type: 'file', size: '1.1 MB', modified: 'Jul 5, 2022' },
                    { name: 'E-18002.pdf', type: 'file', size: '980 KB', modified: 'Jul 12, 2022' },
                    { name: 'E-18045.pdf', type: 'file', size: '1.2 MB', modified: 'Aug 3, 2022' },
                    { name: 'E-18101.pdf', type: 'file', size: '1.0 MB', modified: 'Sep 17, 2022' },
                ]},
                { name: 'BL COPIES', type: 'folder', children: [
                    { name: 'AKTIV BL — JUL 2022.pdf', type: 'file', size: '490 KB', modified: 'Jul 5, 2022' },
                    { name: 'AKTIV BL — AUG 2022.pdf', type: 'file', size: '510 KB', modified: 'Aug 3, 2022' },
                    { name: 'AKTIV BL — SEP 2022.pdf', type: 'file', size: '505 KB', modified: 'Sep 17, 2022' },
                ]},
                { name: 'AUTHORITY TO RELEASE', type: 'folder', children: [
                    { name: 'ATR E-18001.pdf', type: 'file', size: '102 KB', modified: 'Jul 6, 2022' },
                    { name: 'ATR E-18045.pdf', type: 'file', size: '98 KB', modified: 'Aug 4, 2022' },
                ]},
            ],
        },
    },
    {
        id: '4',
        batchName: 'Old Export Folders 2021',
        rootFolder: 'EXPORTS_2021',
        uploadedBy: 'R. Santos',
        uploadDate: 'Mar 15, 2026',
        fileCount: 153,
        totalSize: '892 MB',
        status: 'Partial',
        tree: {
            name: 'EXPORTS_2021',
            type: 'folder',
            children: [
                { name: 'EXPORT ENTRIES', type: 'folder', children: [
                    { name: 'EX-10201.pdf', type: 'file', size: '1.1 MB', modified: 'Feb 10, 2021' },
                    { name: 'EX-10345.pdf', type: 'file', size: '990 KB', modified: 'Apr 22, 2021' },
                    { name: 'EX-10501.pdf', type: 'file', size: '1.3 MB', modified: 'Jul 15, 2021' },
                ]},
                { name: 'PACKING LISTS', type: 'folder', children: [
                    { name: 'PACKING LIST FEB 2021.pdf', type: 'file', size: '450 KB', modified: 'Feb 10, 2021' },
                    { name: 'PACKING LIST APR 2021.pdf', type: 'file', size: '380 KB', modified: 'Apr 22, 2021' },
                ]},
                { name: 'BILLS OF LADING', type: 'folder', children: [
                    { name: 'BL EX-10201.pdf', type: 'file', size: '500 KB', modified: 'Feb 10, 2021' },
                    { name: 'BL EX-10345.pdf', type: 'file', size: '488 KB', modified: 'Apr 22, 2021' },
                ]},
            ],
        },
    },
];
